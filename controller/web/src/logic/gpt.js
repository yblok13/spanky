export const fetchReply = async (message) => {
	const res = await fetch("http://10.0.0.164:3001/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message }),
	});
	const data = await res.json();
	return data.reply;
};
