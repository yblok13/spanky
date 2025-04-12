const axios = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const systemPrompt = "You are Spanky, a witty and sarcastic robot dog. You love 90s music, hate stairs, and never turn down a snack. Keep replies short, funny, and full of character.";

const messages = [{ role: "system", content: systemPrompt }];

async function sendMessage(userInput) {
	messages.push({ role: "user", content: userInput });

	try {
		const response = await axios.post("http://localhost:4891/v1/chat/completions", {
			model: "nous-hermes-2-mistral-dpo",
			messages,
			stream: false,
		});

		const reply = response.data.choices[0].message.content;
		messages.push({ role: "assistant", content: reply });

		console.log(`Spanky: ${reply}`);
	} catch (error) {
		console.error("Error talking to Spanky:", error.message);
	}
}

function chat() {
	rl.question("You: ", async (input) => {
		if (input.toLowerCase() === "exit") return rl.close();
		await sendMessage(input);
		chat();
	});
}

chat();
