export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { type = "عامة", message = "", history = [] } = req.body || {};
    const cleanMsg = String(message).trim();
    if (!cleanMsg) return res.status(400).json({ error: "Empty message" });

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    const systemText = `أنتِ مساعدة في محل إكسسوارات اسمه "فيونكة".
ردّي باللهجة المصرية البناتية (لطيفة جدًا).
خلي الرد قصير وواضح وعملي.
ممنوع تذكري إنك AI أو تذكري API.
لو السؤال عن عناية/تنضيف: ادي خطوات عملية + تحذيرات.
نوع القطعة الحالي: ${type}.`;

    const trimmedHistory = Array.isArray(history)
      ? history
          .filter(
            (x) =>
              x &&
              (x.role === "user" || x.role === "model") &&
              Array.isArray(x.parts) &&
              x.parts[0] &&
              typeof x.parts[0].text === "string"
          )
          .slice(-12)
      : [];

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${encodeURIComponent(key)}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents: [...trimmedHistory, { role: "user", parts: [{ text: cleanMsg }] }],
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 450 },
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(500).json({ error: "Gemini API error", details: data });

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") ||
      "معلش يا قمر… قولي تاني بشكل أبسط 🎀";

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e?.message || e) });
  }
}
