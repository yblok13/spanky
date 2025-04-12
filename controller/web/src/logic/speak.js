export const primeSpeech = () => {
	if (!window.speechSynthesis) return;
	const u = new SpeechSynthesisUtterance("init");
	u.volume = 0;
	window.speechSynthesis.speak(u);
};

export const speak = (text) => {
	if (!text || !window.speechSynthesis) return;

	const speakNow = () => {
		const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
		const utterance = new SpeechSynthesisUtterance(cleanText);
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
