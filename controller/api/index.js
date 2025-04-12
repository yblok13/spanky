const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const GPT_URL = "http://localhost:4891/v1/chat/completions";

const callGPT = async (messages) => {
	const response = await fetch(GPT_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "gpt4all",
			messages,
			temperature: 0.7,
			top_p: 0.9,
			max_tokens: 100,
		}),
	});

	const data = await response.json();
	return data.choices?.[0]?.message?.content.trim();
};

app.post("/chat", async (req, res) => {
	try {
		const userMessage = req.body.message;

		const systemPrompt = "You are Spanky, a sarcastic robot dog. Respond in under 20 words.";
		const gptReply = await callGPT([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userMessage },
		]);

		console.log("🧠 Spanky said:", gptReply);

		// Ask GPT to analyze its own mood
		const moodPrompt = "What is the mood of this sentence? One word only: happy, angry, sleepy, or neutral.";
		const moodResponse = await callGPT([
			{ role: "system", content: moodPrompt },
			{ role: "user", content: gptReply },
		]);

		// Normalize mood
		const mood = (moodResponse || "").toLowerCase().match(/happy|angry|sleepy|neutral/)?.[0] || "neutral";

		console.log(`🎭 Mood detected: ${mood}`);

		res.json({ reply: gptReply, mood });
	} catch (err) {
		console.error("❌ GPT error:", err);
		res.status(500).json({ reply: "My neural net had a mood swing.", mood: "neutral" });
	}
});

app.listen(3001, () => {
	console.log("✅ API running at http://localhost:3001");
});
