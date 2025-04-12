import { useState, useEffect } from "react";
import "./App.css";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

function App() {
	const [log, setLog] = useState([]);
	const [isThinking, setIsThinking] = useState(false);
	const [mood, setMood] = useState("neutral");
	const [time, setTime] = useState(new Date());
	const [liveTranscript, setLiveTranscript] = useState("");
	const [isMuted, setIsMuted] = useState(false);

	// 🔊 Prime speech so Safari allows voice later
	const primeSpeech = () => {
		if (!window.speechSynthesis) return;
		const u = new SpeechSynthesisUtterance("init");
		u.volume = 0; // mute it
		window.speechSynthesis.speak(u);
	};

	// 🔊 Speak actual reply
	const speak = (text) => {
		if (!text || !window.speechSynthesis) return;

		const speakNow = () => {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = "en-US";
			utterance.pitch = 1;
			utterance.rate = 1;
			utterance.volume = 1;
			window.speechSynthesis.cancel();
			window.speechSynthesis.speak(utterance);
		};

		if (speechSynthesis.getVoices().length === 0) {
			speechSynthesis.onvoiceschanged = speakNow;
		} else {
			speakNow();
		}
	};

	// Check if speech is possible
	useEffect(() => {
		if (!window.speechSynthesis) {
			setIsMuted(true);
			return;
		}

		const checkVoices = () => {
			const voices = speechSynthesis.getVoices();
			if (!voices || voices.length === 0) {
				setIsMuted(true);
			}
		};

		checkVoices();
		speechSynthesis.onvoiceschanged = checkVoices;
	}, []);

	const getReply = async (userMessage) => {
		try {
			setIsThinking(true);
			const res = await fetch("http://10.0.0.164:3001/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage }),
			});

			const data = await res.json();
			const reply = data.reply;

			setLog((prev) => [...prev.slice(-3), { user: userMessage, reply }]);
			setIsThinking(false);
			if (!isMuted) speak(reply);

			if (/sleep|tired|low power/i.test(reply)) setMood("sleepy");
			else if (/angry|mad|frustrated|grr/i.test(reply)) setMood("angry");
			else if (/yay|good|happy|awesome|online/i.test(reply)) setMood("happy");
			else setMood("neutral");
		} catch (err) {
			const reply = "Spanky's brain is offline.";
			setLog((prev) => [...prev.slice(-3), { user: userMessage, reply }]);
			setMood("offline");
			setIsThinking(false);
			if (!isMuted) speak(reply);
		}
	};

	useEffect(() => {
		setLog((prev) => [...prev.slice(-3), { user: null, reply: "Spanky online. Systems nominal." }]);
		setMood("happy");
	}, []);

	useEffect(() => {
		const tick = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(tick);
	}, []);

	const startListening = () => {
		primeSpeech(); // 👈 Unlock speech support on iOS

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

			{import.meta.env.DEV && <div className="dev-banner">[DEV] Double-tap to refresh</div>}

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
