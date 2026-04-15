/**
 * AES-256-GCM helpers for classroom endpoint encryption.
 *
 * Wire format: { data: "<base64(iv_12 || ciphertext || tag_16)>" }
 *
 * Uses the native Web Crypto API — no external dependency required.
 * Key is a 64-char hex string from VITE_CLASSROOM_ENCRYPTION_KEY.
 */

const KEY_HEX = import.meta.env.VITE_CLASSROOM_ENCRYPTION_KEY

let _cryptoKey = null

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function getCryptoKey() {
  if (_cryptoKey) return _cryptoKey
  const keyBytes = hexToBytes(KEY_HEX)
  _cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
  return _cryptoKey
}

/**
 * Encrypt a JS object/array.
 * Returns { data: "<base64 ciphertext>" } ready to POST/PUT.
 */
export async function encryptPayload(obj) {
  const key = await getCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(obj))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  // ciphertext already has the 16-byte GCM auth tag appended by the browser
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)
  return { data: btoa(String.fromCodePoint(...combined)) }
}

/**
 * Decrypt a { data: "..." } envelope received from the server.
 * Returns the original JS value (object, array, etc.).
 */
export async function decryptPayload(envelope) {
  if (!envelope || typeof envelope.data !== 'string') return envelope
  const key = await getCryptoKey()
  const combined = Uint8Array.from(atob(envelope.data), (c) => c.codePointAt(0) ?? 0)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plaintext))
}

/** True if the request URL targets a classroom CRUD endpoint. */
export function isClassroomUrl(url = '') {
  // Matches /classrooms/ and /classrooms/<id>/  but not /classrooms/<id>/students/
  return /^\/classrooms\/\d*\/?$/.test(url)
}
