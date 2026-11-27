/* js/otp_admin.js
   Generación del código TOTP de verificación en dos pasos (2FA).

   - Usa la Web Crypto API (HMAC-SHA256 + RFC 4226 HOTP).
   - El secreto se lee de secretos/otp_admin.secret.txt (servido por el
     servidor seguro solo con Referer = página de login).
   - Retorna un código de 6 dígitos válido en el periodo actual
     (por defecto, 30 segundos).
   - Requiere un contexto seguro: https://localhost:8765/ (o 127.0.0.1). */
(function (global) {
  "use strict";

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return out;
  }

  function pow10(digitos) {
    let m = 1;
    for (let i = 0; i < digitos; i++) m *= 10;
    return m;
  }

  async function generarOtpAdmin(secreto, tiempoMs, digitos, temporalidadMs) {
    if (!secreto) return "";
    const d = digitos || 6;
    const temp = temporalidadMs || 30000;
    const t = tiempoMs == null ? Date.now() : tiempoMs;
    const counter = Math.floor(t / temp);

    const keyBytes = hexToBytes(secreto);
    const key = await global.crypto.subtle.importKey(
      "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const msg = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) {
      msg[i] = c % 256;
      c = Math.floor(c / 256);
    }

    const digest = new Uint8Array(await global.crypto.subtle.sign("HMAC", key, msg));
    const offset = digest[digest.length - 1] & 0x0f;
    const value =
      (((digest[offset] & 0x7f) << 24) |
        (digest[offset + 1] << 16) |
        (digest[offset + 2] << 8) |
        digest[offset + 3]) %
      pow10(d);

    return String(value).padStart(d, "0");
  }

  global.generarOtpAdmin = generarOtpAdmin;
})(window);
