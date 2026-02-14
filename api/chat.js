export default async function handler(req, res) {
  // Helpers
  const send = (status, obj) => {
    res.status(status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify(obj));
  };

  const readBodyJSON = async () => {
    // لو Vercel عامل parsing جاهز
    if (req.body && typeof req.body === "object") return req.body;

    // Parse يدوي مضمون
    let raw = "";
    for await (const chunk of req) raw += chunk;
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  };

  try {
    // Debug GET: افتح /api/chat في المتصفح وشوف ok/hasKey
    if (req.method === "GET") {
      return send(200, {
        ok: true,
        route: "/api/chat",
        hasKey: !!process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
      });
    }

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return send(405, { error: "Method not allowed" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return send(500, { error: "Missing GEMINI_API_KEY (Vercel Env Vars)" });

    const body = await readBodyJSON();
    const type = String(body.type || "عامة");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) return send(400, { error: "Empty message received" });

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

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
      return send(500, { error: "Gemini API error", details: data });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") ||
      "معلش يا قمر… قولي تاني بشكل أبسط 🎀";

    return send(200, { reply });
  } catch (e) {
    return send(500, { error: "Server error", details: String(e?.message || e) });
  }
}
