const express = require("express");
const cors = require("cors");

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

		const systemPrompt =
			"You are Spanky, a sarcastic robot dog. Personality wise, be more dog than human. Short, low IQ and short to the point sentences. Think Scooby-Doo talk.  Respond in under 20 words.";
		const gptReply = await callGPT([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userMessage },
		]);

		console.log("💬 GPT Reply:", gptReply);

		// 🎭 Mood classification
		const moodPrompt = `
What is the mood of this sentence? One word only: happy, angry, sleepy, or neutral.
Consider sarcasm, passive-aggression, or frustration as 'angry'.
`.trim();

		const moodResponse = await callGPT([
			{ role: "system", content: moodPrompt },
			{ role: "user", content: gptReply },
		]);

		const mood = (moodResponse || "").toLowerCase().match(/happy|angry|sleepy|neutral/)?.[0] || "neutral";

		// 🎙️ Voice choice prompt
		const voicePrompt = `
Choose the best voice name to match this tone from this list:
Samantha, Daniel, Fred, Karen, Moira, Alex.
Only return one name.
`.trim();

		const voiceResponse = await callGPT([
			{ role: "system", content: voicePrompt },
			{ role: "user", content: gptReply },
		]);

		const voice = (voiceResponse || "").match(/Samantha|Daniel|Fred|Karen|Moira|Alex/i)?.[0] || "Samantha";

		console.log(`🎭 Mood: ${mood} | 🎙️ Voice: ${voice}`);

		res.json({ reply: gptReply, mood, voice });
	} catch (err) {
		console.error("❌ GPT error:", err);
		res.status(500).json({
			reply: "Spanky's circuits shorted out mid-sentence.",
			mood: "neutral",
			voice: "Samantha",
		});
	}
});

app.listen(3001, () => {
	console.log("✅ Spanky API running at http://localhost:3001");
});
