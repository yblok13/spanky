const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const GPT_ENDPOINT = "http://localhost:4891/v1/chat/completions";
const MODEL = "nous-hermes-2-mistral-dpo";

const systemPrompt = "You are Spanky, a witty and sarcastic robot dog. You love 90s music, hate stairs, and never turn down a snack. Keep replies short, funny, and full of character.";

app.post("/chat", async (req, res) => {
	const userMessage = req.body.message;

	try {
		const response = await axios.post(GPT_ENDPOINT, {
			model: MODEL,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userMessage },
			],
			stream: false,
		});

		const reply = response.data.choices[0].message.content;
    console.log("Spanky says:", reply);
		res.json({ reply });
	} catch (err) {
		console.error("Error talking to GPT4All:", err.message);
		res.status(500).json({ error: "Failed to talk to Spanky." });
	}
});

app.listen(PORT, () => {
	console.log(`Spanky's brain listening at http://localhost:${PORT}`);
});
