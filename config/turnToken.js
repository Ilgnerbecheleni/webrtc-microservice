const crypto = require('crypto');

const TURN_SECRET = process.env.TURN_SECRET;
const TURN_REALM = process.env.TURN_REALM;
const TURN_URL = process.env.TURN_URL;

function generateTurnToken() {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const hmac = crypto.createHmac('sha1', TURN_SECRET);
  hmac.update(`${expiry}`);
  const credential = hmac.digest('base64');

  return {
    username: `${expiry}`,
    credential,
    ttl: 3600,
    urls: [
      `stun:${TURN_URL}:3478`,
      `turn:${TURN_URL}:3478?transport=udp`,
      `turn:${TURN_URL}:3478?transport=tcp`
    ]
  };
}

module.exports = generateTurnToken;
