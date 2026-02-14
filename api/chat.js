export default {
  async fetch(request) {
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });

    try {
      if (request.method === "OPTIONS") {
        // احتياطي لو فيه CORS
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method !== "POST") {
        return json({ error: "Method not allowed. Use POST." }, 405);
      }

      const key = process.env.GEMINI_API_KEY;
      if (!key) return json({ error: "Missing GEMINI_API_KEY on Vercel env vars" }, 500);

      const body = await request.json().catch(() => ({}));
      const type = String(body.type || "عامة");
      const message = String(body.message || "").trim();
      const history = Array.isArray(body.history) ? body.history : [];

      if (!message) return json({ error: "Empty message" }, 400);

      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

      const systemText = `أنتِ مساعدة في محل إكسسوارات اسمه "فيونكة".
ردّي باللهجة المصرية البناتية (لطيفة جدًا).
خلي الرد قصير وواضح وعملي.
ممنوع تذكري إنك AI أو تذكري API.
لو السؤال عن عناية/تنضيف: ادي خطوات عملية + تحذيرات.
نوع القطعة الحالي: ${type}.`;

      const trimmedHistory = history
        .filter(
          (x) =>
            x &&
            (x.role === "user" || x.role === "model") &&
            Array.isArray(x.parts) &&
            x.parts[0] &&
            typeof x.parts[0].text === "string"
        )
        .slice(-12);

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
        `?key=${encodeURIComponent(key)}`;

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemText }] },
          contents: [...trimmedHistory, { role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 450 },
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        // خلي الرسالة واضحة عشان تعرف السبب بسرعة
        return json({ error: "Gemini API error", details: data }, 500);
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") ||
        "معلش يا قمر… قولي تاني بشكل أبسط 🎀";

      return json({ reply }, 200);
    } catch (e) {
      return json({ error: "Server error", details: String(e?.message || e) }, 500);
    }
  },
};
