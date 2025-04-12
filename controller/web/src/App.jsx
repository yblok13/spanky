import { useState, useEffect, useRef } from "react";
import { speak, primeSpeech } from "./logic/speak";
import { detectMood } from "./logic/mood";
import { fetchReply } from "./logic/gpt";
import "./App.css";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const IS_DEV = import.meta.env.DEV;

function App() {
	const [log, setLog] = useState([]);
	const [isThinking, setIsThinking] = useState(false);
	const [mood, setMood] = useState("neutral");
	const [time, setTime] = useState(new Date());
	const [liveTranscript, setLiveTranscript] = useState("");
	const [isMuted, setIsMuted] = useState(false);

	const lastInteractionRef = useRef(Date.now());
	const idleCooldownRef = useRef(false);

	const idleTimeout = IS_DEV ? 30_000 : 180_000;
	const idleCooldown = IS_DEV ? 45_000 : 300_000;

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
			const reply = await fetchReply(userMessage);

			setLog((prev) => [
				...prev.slice(-3),
				{
					user: isIdle ? null : userMessage,
					reply,
				},
			]);

			setIsThinking(false);
			if (!isMuted) speak(reply);
			lastInteractionRef.current = Date.now();
			setMood(detectMood(reply));
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
		setMood("happy");
		lastInteractionRef.current = Date.now();
	}, []);

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
				setMood("neutral");
			}
		};

		recognition.onerror = (event) => {
			console.error("Speech recognition error:", event.error);
			setLiveTranscript("");
			setMood("neutral");
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

			<div className="eyes">
				<div className={`eye left ${isThinking ? "blinking" : ""} ${mood}`}></div>
				<div className={`eye right ${isThinking ? "blinking" : ""} ${mood}`}></div>
			</div>

			<div className="log-overlay">
				{liveTranscript && <div className="live-transcript">{liveTranscript}</div>}

				{[...log]
					.slice(-4)
					.reverse()
					.map((line, i) => (
						<div key={i} className={`log-entry fade-${i}`}>
							{line.user && <div className="user-message">{line.user}</div>}
							<div className="log-line">{line.reply}</div>
						</div>
					))}
			</div>

			<button className="mic-btn" onClick={startListening}>
				🎙️
			</button>
		</div>
	);
}

export default App;
