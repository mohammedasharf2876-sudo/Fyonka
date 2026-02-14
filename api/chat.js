// api/chat.js  ✅ (NO KEY) — شغال على Vercel
function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function readBodyJSON(req) {
  return new Promise((resolve) => {
    // لو Vercel عامل parsing جاهز
    if (req.body && typeof req.body === "object") return resolve(req.body);

    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function hasAny(msg, arr) {
  for (let i = 0; i < arr.length; i++) if (msg.indexOf(arr[i]) !== -1) return true;
  return false;
}

function wrapReply(opener, title, bullets, ask, note) {
  var out = [];
  if (opener) out.push(opener);
  if (title) out.push("**" + title + "**");
  if (bullets && bullets.length) {
    out.push("");
    for (var i = 0; i < bullets.length; i++) out.push("✅ " + bullets[i]);
  }
  if (note) {
    out.push("");
    out.push("⚠️ " + note);
  }
  if (ask) {
    out.push("");
    out.push("سؤال صغير يا قمر: " + ask);
  }
  return out.join("\n");
}

function domainOf(message) {
  var m = message;

  var skincare = ["بشرة","سكين","روتين","غسول","مرطب","واقي","spf","سيرم","فيتامين","نياسيناميد","هيالورونيك","ريتينول","تقشير","aha","bha","ساليسيليك","جليكوليك","حساسية","تهيج","احمرار","حكة","حبوب","تصبغات","مسام"];
  var makeup   = ["ميكاب","makeup","فاونديشن","كونسيلر","بودرة","برايمر","بلاشر","برونزر","هايلايتر","ايشادو","آيشادو","ايلاينر","آيلاينر","ماسكارا","روج","ليب","حواجب","ستنج","setting","سبراي"];
  var acc      = ["خاتم","سلسلة","سلسله","انسيال","اسورة","أسورة","سوار","غوايش","غويشة","حلق","قرط","خلخال","توكة","دبوس","كوليه","اكسسوار","إكسسوار","ستانلس","فضة","مطلي","مطليه"];

  if (hasAny(m, skincare)) return "skincare";
  if (hasAny(m, makeup)) return "makeup";
  if (hasAny(m, acc)) return "accessories";
  return "general";
}

// ---------- Accessories ----------
function accessoryType(message, hint) {
  var m = message;
  if (m.indexOf("خاتم") !== -1) return "خاتم";
  if (m.indexOf("سلسلة") !== -1 || m.indexOf("سلسله") !== -1 || m.indexOf("كوليه") !== -1) return "سلسلة";
  if (m.indexOf("انسيال") !== -1 || m.indexOf("اسورة") !== -1 || m.indexOf("أسورة") !== -1 || m.indexOf("سوار") !== -1) return "انسيال";
  if (m.indexOf("غوايش") !== -1 || m.indexOf("غويشة") !== -1 || m.indexOf("غويشه") !== -1) return "غوايش";
  if (m.indexOf("حلق") !== -1 || m.indexOf("قرط") !== -1) return "حلق";
  if (m.indexOf("خلخال") !== -1) return "خلخال";
  if (m.indexOf("توكة") !== -1 || m.indexOf("دبوس") !== -1) return "توك/دبابيس";
  return hint || "عامة";
}

var ACC_TIPS = {
  "خاتم": [
    "ابعديه عن المية والصابون والكحول عشان اللون والفصوص يفضلوا حلوين.",
    "شيليه وقت الحمام/غسيل المواعين عشان مايزحلقش ويتوه.",
    "خزنيه لوحده في كيس قماش/علبة عشان ميخربش مع غيره."
  ],
  "سلسلة": [
    "بلاش نوم بيها عشان متتعقدش.",
    "البرفان لازم ينشف الأول وبعدين تلبسيها.",
    "لو اتعقدت: افرديها وحرّكي العقدة بهدوء بدبوس."
  ],
  "انسيال": [
    "شيليه وقت الشاور والبحر والكلور.",
    "بلاش شد جامد على السلسلة الرقيقة.",
    "امسحيه بعد اللبس بقطنة ناشفة."
  ],
  "غوايش": [
    "ابعديها عن الخبطات عشان متتجرح
