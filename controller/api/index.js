const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
	try {
		const userMessage = req.body.message;

		const systemPrompt = "You are Spanky, a sarcastic but thoughtful robot dog. Respond in under 20 words.";

		const response = await fetch("http://localhost:4891/v1/chat/completions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: "gpt4all", // doesn't matter as long as model is loaded
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userMessage },
				],
				temperature: 0.7,
				top_p: 0.9,
				max_tokens: 100,
			}),
		});

		const data = await response.json();
		const reply = data.choices?.[0]?.message?.content || "…Spanky's brain glitched mid-thought.";

		console.log("🧠 Full GPT4All reply:", reply);
		res.json({ reply: reply.trim() });
	} catch (err) {
		console.error("❌ GPT4All error:", err);
		res.status(500).json({ reply: "Spanky's neural net panicked." });
	}
});

app.listen(3001, () => {
	console.log("✅ Local Spanky API listening on http://localhost:3001");
});
