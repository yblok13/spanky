import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [log, setLog] = useState([]);
	const [isThinking, setIsThinking] = useState(true);
	const [mood, setMood] = useState("neutral");
	const [time, setTime] = useState(new Date());

	const getReply = async () => {
		try {
			setIsThinking(true);
			const res = await fetch("http://10.0.0.164:3001/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: "Hello, Spanky. Status report?" }),
			});

			const data = await res.json();
			const reply = data.reply;
			setLog((prev) => [...prev.slice(-3), reply]);
			setIsThinking(false);

			// Mood detection
			if (/sleep|tired|low power/i.test(reply)) setMood("sleepy");
			else if (/angry|mad|frustrated|grr/i.test(reply)) setMood("angry");
			else if (/yay|good|happy|awesome|online/i.test(reply)) setMood("happy");
			else setMood("neutral");
		} catch (err) {
			setLog((prev) => [...prev.slice(-3), "Spanky's brain is offline."]);
			setMood("offline");
			setIsThinking(false);
		}
	};

	useEffect(() => {
		getReply();

		if (import.meta.env.DEV) {
			const interval = setInterval(() => {
				getReply();
			}, 30000);
			return () => clearInterval(interval);
		}
	}, []);

	useEffect(() => {
		const tick = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(tick);
	}, []);

	return (
		<div className="app">
			<div className="clock">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>

			{import.meta.env.DEV && <div className="dev-banner">[DEV] Auto-refreshing every 30s</div>}

			<div className="eyes">
				<div className={`eye left ${isThinking ? "blinking" : ""} ${mood}`}></div>
				<div className={`eye right ${isThinking ? "blinking" : ""} ${mood}`}></div>
			</div>

			<div className="log-overlay">
				{[...log]
					.slice(-4)
					.reverse()
					.map((line, i) => (
						<div key={i} className={`log-line fade-${i}`}>
							{line}
						</div>
					))}
			</div>
		</div>
	);
}

export default App;
