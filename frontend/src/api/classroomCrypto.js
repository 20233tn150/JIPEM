/**
 * AES-256-GCM encryption helpers for classroom endpoints.
 * Uses the native Web Crypto API — no external dependencies.
 *
 * Wire format:  base64( IV(12 bytes) || Ciphertext || GCM Tag(16 bytes) )
 * HTTP payload: { "data": "<base64>" }
 */

const HEX_KEY = import.meta.env.VITE_CLASSROOM_ENCRYPTION_KEY

let _keyPromise = null

function _getKey() {
  if (!_keyPromise) {
    const keyBytes = new Uint8Array(HEX_KEY.match(/.{2}/g).map(h => parseInt(h, 16)))
    _keyPromise = crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  return _keyPromise
}

/** Encrypt a plain JS object and return a base64 string. */
export async function encryptPayload(obj) {
  const key = await _getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(obj))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

/** Decrypt a base64 string and return the parsed JS object. */
export async function decryptPayload(b64) {
  const key = await _getKey()
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const ciphertext = raw.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plaintext))
}

/** Returns true when the URL targets a classroom endpoint. */
export function isClassroomUrl(url = '') {
  return /\/classrooms(\/\d+)?\/?(\?.*)?$/.test(url)
}
