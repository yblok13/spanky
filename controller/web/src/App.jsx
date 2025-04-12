import { useState, useEffect, useRef } from "react";
import Eyes from "./components/Eyes";
import LogOverlay from "./components/LogOverlay";
import MicButton from "./components/MicButton";
import { speak, primeSpeech } from "./logic/speak";
import "./App.css";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const IS_DEV = import.meta.env.DEV;

function App() {
	const [log, setLog] = useState([]);
	const [isThinking, setIsThinking] = useState(false);
	const [moodScore, setMoodScore] = useState(-6);
	const [mood, setMood] = useState(-6);
	const [time, setTime] = useState(new Date());
	const [liveTranscript, setLiveTranscript] = useState("");
	const [isMuted, setIsMuted] = useState(false);

	const lastInteractionRef = useRef(Date.now());
	const idleCooldownRef = useRef(false);

	const idleTimeout = IS_DEV ? 30_000 : 180_000;
	const idleCooldown = IS_DEV ? 45_000 : 300_000;

	const updateMoodFromScore = (score) => {
		if (score >= 5) return "happy";
		if (score <= -8) return "sleepy";
		if (score <= -5) return "angry";
		return "neutral";
	};

	const adjustMoodScoreFromLabel = (moodLabel) => {
		let delta = 0;
		if (moodLabel === "happy") delta = +2;
		else if (moodLabel === "angry") delta = -3;
		else if (moodLabel === "sleepy") delta = -2;
		else delta = 0;

		setMoodScore((prev) => {
			const next = Math.max(-10, Math.min(10, prev + delta));
			setMood(updateMoodFromScore(next));
			return next;
		});
	};

	useEffect(() => {
		if (!window.speechSynthesis) {
			setIsMuted(true);
			return;
		}
		const checkVoices = () => {
			const voices = speechSynthesis.getVoices();
			if (!voices || voices.length === 0) setIsMuted(true);
		};
		checkVoices();
		speechSynthesis.onvoiceschanged = checkVoices;
	}, []);

	const getReply = async (userMessage, isIdle = false) => {
		try {
			setIsThinking(true);
			const res = await fetch("http://10.0.0.164:3001/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage }),
			});

			const data = await res.json();
			const reply = data.reply;
			const moodFromAPI = data.mood;

			setLog((prev) => [
				...prev.slice(-3),
				{
					user: isIdle ? null : userMessage,
					reply,
				},
			]);

			setIsThinking(false);
			if (!isMuted) speak(reply, moodFromAPI);
			lastInteractionRef.current = Date.now();
			adjustMoodScoreFromLabel(moodFromAPI);
		} catch (err) {
			const failReply = "Spanky's brain is offline.";
			setLog((prev) => [...prev.slice(-3), { user: userMessage, reply: failReply }]);
			setMood("offline");
			setIsThinking(false);
			if (!isMuted) speak(failReply);
		}
	};

	useEffect(() => {
		setLog((prev) => [...prev.slice(-3), { user: null, reply: "Spanky online. Systems nominal." }]);
		setMood(updateMoodFromScore(moodScore));
		lastInteractionRef.current = Date.now();
	}, [moodScore]);

	useEffect(() => {
		const tick = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(tick);
	}, []);

	const startListening = () => {
		primeSpeech();
		lastInteractionRef.current = Date.now();
		idleCooldownRef.current = false;

		if (!recognition) {
			alert("Voice recognition not supported on this device.");
			return;
		}

		setMood("listening");
		recognition.lang = "en-US";
		recognition.interimResults = true;
		recognition.maxAlternatives = 1;

		recognition.start();

		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((r) => r[0].transcript)
				.join("");

			setLiveTranscript(transcript);

			if (event.results[0].isFinal) {
				getReply(transcript);
				setLiveTranscript("");
				setMood(updateMoodFromScore(moodScore));
			}
		};

		recognition.onerror = (event) => {
			console.error("Speech recognition error:", event.error);
			setLiveTranscript("");
			setMood(updateMoodFromScore(moodScore));
		};
	};

	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			if (!idleCooldownRef.current && now - lastInteractionRef.current > idleTimeout) {
				idleCooldownRef.current = true;
				lastInteractionRef.current = now;

				const idlePrompt = "Generate a short, witty or curious idle thought a sarcastic robot dog might have while waiting around. Keep it under 20 words.";
				getReply(idlePrompt, true);

				setTimeout(() => {
					idleCooldownRef.current = false;
				}, idleCooldown);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const decayInterval = setInterval(() => {
			setMoodScore((prev) => {
				if (prev === 0) return 0;
				const next = prev > 0 ? prev - 1 : prev + 1;
				setMood(updateMoodFromScore(next));
				return next;
			});
		}, 5 * 600_000);

		return () => clearInterval(decayInterval);
	}, []);

	useEffect(() => {
		let lastTap = 0;
		const handleTap = () => {
			const now = Date.now();
			if (now - lastTap < 300) {
				window.location.reload();
			}
			lastTap = now;
		};
		window.addEventListener("touchend", handleTap);
		return () => window.removeEventListener("touchend", handleTap);
	}, []);

	return (
		<div className="app">
			{isMuted && <div className="mute-icon">🔇</div>}

			<div className="clock">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>

			{IS_DEV && <div className="dev-banner">[DEV] Double-tap to refresh</div>}

			<Eyes mood={mood} isThinking={isThinking} />
			<LogOverlay log={log} liveTranscript={liveTranscript} />
			<MicButton onClick={startListening} />
		</div>
	);
}

export default App;
