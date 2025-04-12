const Eyes = ({ mood, isThinking }) => {
	return (
		<div className="eyes">
			<div className={`eye left ${isThinking ? "blinking" : ""} ${mood}`}></div>
			<div className={`eye right ${isThinking ? "blinking" : ""} ${mood}`}></div>
		</div>
	);
};

export default Eyes;
