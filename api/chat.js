// api/chat.js
import https from "node:https";

function readBody(req) {
  return new Promise((resolve) => {
    // لو Vercel عامل parsing جاهز
    if (req.body && typeof req.body === "object") return resolve(req.body);

    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
  });
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          let json = {};
          try { json = body ? JSON.parse(body) : {}; } catch {}
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json });
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  try {
    // Ping سريع للتأكد إن الـ API شغال: افتح /api/chat في المتصفح
    if (req.method === "GET") {
      return send(res, 200, {
        ok: true,
        route: "/api/chat",
        hasKey: !!process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });
    }

    if (req.method === "OPTIONS") return res.end();
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return send(res, 500, { error: "Missing GEMINI_API_KEY on Vercel" });

    const body = await readBody(req);
    const type = String(body.type || "عامة");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) return send(res, 400, { error: "Empty message received" });

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
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        key
      )}`;

    const payload = {
      system_instruction: { parts: [{ text: systemText }] },
      contents: [...trimmedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 450 },
    };

    const r = await postJSON(url, payload);

    if (!r.ok) {
      // رجّع تفاصيل الخطأ للواجهة عشان تعرف السبب الحقيقي
      return send(res, 500, { error: "Gemini API error", details: r.json });
    }

    const reply =
      r.json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") ||
      "معلش يا قمر… قولي تاني بشكل أبسط 🎀";

    return send(res, 200, { reply });
  } catch (e) {
    return send(res, 500, { error: "Server error", details: String(e?.message || e) });
  }
}
