export const detectMood = (text) => {
	if (/sleep|tired|low power/i.test(text)) return "sleepy";
	if (/angry|mad|frustrated|grr/i.test(text)) return "angry";
	if (/yay|good|happy|awesome|online/i.test(text)) return "happy";
	return "neutral";
};
