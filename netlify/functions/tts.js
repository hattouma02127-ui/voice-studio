exports.handler = async (event) => {
  const { voice = 'Brian', text = '' } = event.queryStringParameters || {};

  if (!text.trim()) {
    return { statusCode: 400, body: 'Missing text' };
  }

  const upstream =
    'https://api.streamelements.com/kappa/v2/speech' +
    `?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;

  const res = await fetch(upstream);
  if (!res.ok) {
    return { statusCode: res.status, body: 'Upstream error' };
  }

  const arrayBuf = await res.arrayBuffer();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
    body: Buffer.from(arrayBuf).toString('base64'),
    isBase64Encoded: true,
  };
};