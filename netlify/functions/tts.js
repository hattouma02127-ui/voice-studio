const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

exports.handler = async (event) => {
  const { voice = "en-US-BrianNeural", text = "" } = event.queryStringParameters || {};

  if (!text.trim()) {
    return { statusCode: 400, body: "Missing text" };
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const { audioStream } = tts.toStream(text);

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
      return { statusCode: 500, body: "No audio generated" };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "TTS error: " + err.message };
  }
};