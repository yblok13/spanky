import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [log, setLog] = useState([]);

	// Placeholder for testing without input
	useEffect(() => {
		const example = ["Welcome, meatbag.", "Loading core sarcasm...", "Spanky online. Ready to vibe."];
		setLog(example);
	}, []);

	return (
		<div className="app">
			<div className="eyes">
				<div className="eye left"></div>
				<div className="eye right"></div>
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
