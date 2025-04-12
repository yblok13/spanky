const LogOverlay = ({ log, liveTranscript }) => {
	return (
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
	);
};

export default LogOverlay;
