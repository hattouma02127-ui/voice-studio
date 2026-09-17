const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

// ---- Edge TTS (neural, best quality) ----
async function edgeTTS(text, voice) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);

  return await new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => reject(new Error("Edge TTS timeout")), 15000);
    audioStream.on("data", (c) => chunks.push(c));
    audioStream.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
    audioStream.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}

// ---- Google Translate TTS (free, very reliable, ~200 char limit) ----
async function googleTTS(text, lang = "en") {
  const url =
    "https://translate.google.com/translate_tts" +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Referer": "https://translate.google.com/",
    },
  });
  if (!res.ok) throw new Error("Google TTS " + res.status);
  return Buffer.from(await res.arrayBuffer());
}

function mp3(buffer, source) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
      "X-TTS-Source": source,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
}

exports.handler = async (event) => {
  const { voice = "en-US-BrianNeural", text = "" } = event.queryStringParameters || {};
  if (!text.trim()) return { statusCode: 400, body: "Missing text" };

  const errors = [];

  // 1. Try Edge (neural, high quality)
  try {
    const buf = await edgeTTS(text, voice);
    if (buf.length > 0) return mp3(buf, "edge");
    errors.push("edge: empty buffer");
  } catch (e) {
    errors.push("edge: " + e.message);
  }

  // 2. Fallback to Google (robotic but reliable)
  try {
    const lang = (voice.split("-")[0] || "en").toLowerCase();
    const buf = await googleTTS(text.slice(0, 200), lang);
    if (buf.length > 0) return mp3(buf, "google");
    errors.push("google: empty buffer");
  } catch (e) {
    errors.push("google: " + e.message);
  }

  // 3. Both failed — return diagnostics as JSON
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ errors, node: process.version }),
  };
};