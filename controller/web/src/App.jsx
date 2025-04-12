import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [log, setLog] = useState([]);
	const [isThinking, setIsThinking] = useState(true);
	const [time, setTime] = useState(new Date());

	const getReply = async () => {
		try {
			setIsThinking(true);
			const res = await fetch("http://localhost:3001/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: "Hello, Spanky. Status report?" }),
			});

			const data = await res.json();
			setLog((prev) => [...prev.slice(-2), data.reply]);
			setIsThinking(false);
		} catch (err) {
			setLog((prev) => [...prev.slice(-2), "Spanky's brain is offline."]);
			setIsThinking(false);
		}
	};

	useEffect(() => {
		getReply();

		if (import.meta.env.DEV) {
			const interval = setInterval(() => {
				getReply();
			}, 30000); // refresh every 30s in dev
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
				<div className={`eye left ${isThinking ? "blinking" : ""}`}></div>
				<div className={`eye right ${isThinking ? "blinking" : ""}`}></div>
			</div>

			<div className="log">
				{log.map((line, i) => (
					<div key={i} className="log-line">
						{line}
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
