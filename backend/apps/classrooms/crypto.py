"""
AES-256-GCM application-layer encryption for the Classrooms CRUD.

Wire format (both directions):
    {"data": "<base64(iv_12 || ciphertext || tag_16)>"}

Used by EncryptedJSONParser (request body) and EncryptedJSONRenderer (response body).
The DRF views themselves see/produce normal Python dicts — encryption is transparent.
"""

import base64
import json
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer


# ── Key helper ──────────────────────────────────────────────────────────────

def _get_key() -> bytes:
    key_hex: str = getattr(settings, 'CLASSROOM_ENCRYPTION_KEY', '')
    if not key_hex or len(key_hex) != 64:
        raise ValueError(
            "CLASSROOM_ENCRYPTION_KEY must be a 64-char hex string (32 bytes / AES-256). "
            "Set it in your .env file."
        )
    return bytes.fromhex(key_hex)


# ── Core encrypt / decrypt ───────────────────────────────────────────────────

def encrypt_payload(data) -> dict:
    """
    Encrypt any JSON-serialisable value.
    Returns {"data": "<base64(iv || ciphertext_with_tag)>"}.
    """
    aesgcm = AESGCM(_get_key())
    iv = os.urandom(12)
    plaintext = json.dumps(data, ensure_ascii=False).encode('utf-8')
    ciphertext = aesgcm.encrypt(iv, plaintext, None)   # tag appended automatically
    combined = iv + ciphertext
    return {'data': base64.b64encode(combined).decode('ascii')}


def decrypt_payload(envelope: dict):
    """
    Decrypt {"data": "..."} and return the original Python value.
    """
    aesgcm = AESGCM(_get_key())
    combined = base64.b64decode(envelope['data'])
    iv, ciphertext = combined[:12], combined[12:]
    plaintext = aesgcm.decrypt(iv, ciphertext, None)
    return json.loads(plaintext.decode('utf-8'))


# ── DRF parser ───────────────────────────────────────────────────────────────

class EncryptedJSONParser(JSONParser):
    """
    Accepts {"data": "..."} in the request body, decrypts it, and hands the
    original dict/list to the view — as if the client had sent plain JSON.
    Falls back to plain JSON if the 'data' envelope is absent (for dev use).
    """

    def parse(self, stream, media_type=None, parser_context=None):
        raw = super().parse(stream, media_type, parser_context)
        if isinstance(raw, dict) and 'data' in raw and len(raw) == 1:
            return decrypt_payload(raw)
        return raw


# ── DRF renderer ─────────────────────────────────────────────────────────────

class EncryptedJSONRenderer(JSONRenderer):
    """
    Takes the normal response dict/list from the view, wraps it in
    {"data": "<base64 ciphertext>"}, and serialises to JSON bytes.
    204 No Content (data=None) is passed through unchanged.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return super().render(data, accepted_media_type, renderer_context)
        encrypted = encrypt_payload(data)
        return super().render(encrypted, accepted_media_type, renderer_context)
