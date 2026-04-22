import json
import os
import base64

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings
from rest_framework.parsers import BaseParser
from rest_framework.renderers import BaseRenderer

_IV_SIZE = 12  # 96 bits — GCM standard nonce size


def _get_key() -> bytes:
    return bytes.fromhex(settings.CLASSROOM_ENCRYPTION_KEY)


def encrypt_payload(data: dict) -> str:
    """Serialize dict → JSON → AES-256-GCM → base64(IV || ciphertext || tag)."""
    plaintext = json.dumps(data, ensure_ascii=False).encode('utf-8')
    iv = os.urandom(_IV_SIZE)
    ciphertext = AESGCM(_get_key()).encrypt(iv, plaintext, None)
    return base64.b64encode(iv + ciphertext).decode('ascii')


def decrypt_payload(b64: str) -> dict:
    """base64 → split IV/ciphertext → AES-256-GCM decrypt → parse JSON."""
    raw = base64.b64decode(b64)
    iv, ciphertext = raw[:_IV_SIZE], raw[_IV_SIZE:]
    plaintext = AESGCM(_get_key()).decrypt(iv, ciphertext, None)
    return json.loads(plaintext.decode('utf-8'))


class EncryptedJSONParser(BaseParser):
    """Expects {"data": "<base64_ciphertext>"}, decrypts and returns plain dict."""
    media_type = 'application/json'

    def parse(self, stream, media_type=None, parser_context=None):
        body = json.loads(stream.read())
        if 'data' in body:
            return decrypt_payload(body['data'])
        return body


class EncryptedJSONRenderer(BaseRenderer):
    """Encrypts the response dict and returns {"data": "<base64_ciphertext>"}."""
    media_type = 'application/json'
    format = 'json'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b''
        return json.dumps({'data': encrypt_payload(data)}).encode('utf-8')
