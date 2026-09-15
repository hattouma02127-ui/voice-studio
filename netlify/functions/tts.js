const { EdgeTTS } = require('edge-tts-universal');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  const p = event.queryStringParameters || {};
  const text = (p.text || '').trim();
  const voice = (p.voice || 'en-US-AriaNeural').trim();

  if (!text) return { statusCode: 400, body: 'Missing "text"' };
  if (text.length > 500)
    return { statusCode: 400, body: 'Chunk too long (max 500 chars)' };

  try {
    const tts = new EdgeTTS(text, voice);
    const result = await tts.synthesize();

    // result.audio is a Buffer (or Uint8Array) of MP3 data
    const buf = Buffer.from(result.audio);
    if (buf.length < 200) {
      return { statusCode: 502, body: 'Empty audio from Edge TTS' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'TTS error: ' + e.message };
  }
};