# -*- coding: utf-8 -*-
"""
Servidor seguro para el sitio "Asociación Municipal de Básquetbol Cliza".

Funciones aplicadas:
  * HTTPS: se entrega con un certificado autofirmado de localhost/127.0.0.1
    (generado con openssl al arrancar o con la librería `cryptography` si
    no está disponible). Se sirve en https://localhost:8765/.
  * Redirector HTTP: http://localhost:8080/ responde 301 → https://localhost:8765/...
  * WAF básico (firewall contra ataques):
      - Bloquea rutas sensibles: wp-admin, wp-login, administrator,
        certificados (/certificado/), secretos (/secretos/ salvo vienen del
        login), árbol de scripts (.php, .exe, .dll, .pem, ...), path traversal.
      - Rate limiting por ruta y IP: máx. 30 req/min (8 en /admin-ingreso.html)
        → respuesta 429.
      - Logs de acceso: logs/servidor.log.
  * Secretos generados al iniciar (si faltan):
      - secretos/contrasena_admin.txt — contraseña del acceso aAdministración.
      - secretos/otp_admin.secret.txt — secreto TOTP 2FA (se muestra en la página
        de login).

Ejecutar: python servidor.py  (o doble clic en start_server.bat)
Detener: Ctrl+C.
"""

import os
import re
import secrets
import ssl
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

PUERTO_HTTPS = 8765
PUERTO_HTTP = 8080
HOST = "0.0.0.0"
CERT = os.path.join(BASE, "certificado", "localhost.pem")
KEY = os.path.join(BASE, "certificado", "localhost.key")
LOGS = os.path.join(BASE, "logs")
SECRETOS = os.path.join(BASE, "secretos")
ARCHIVO_LOG = os.path.join(LOGS, "servidor.log")

for d in (BASE, LOGS, SECRETOS, os.path.join(BASE, "certificado")):
    os.makedirs(d, exist_ok=True)


# ------------------------------------------------------------------ Firewall

PATRONES_BLOQUEADOS = [
    r"wp-admin", r"wp-login", r"administrator", r"administración", r"administrar",
    r"\.php\b", r"\.exe\b", r"\.dll\b", r"shell\.php", r"cmd\.php", r"eval\.php",
    r"phpinfo\.php", r"install\.php", r"setup\.php", r"config\.php", r"adminer\.php",
    r"/etc/passwd", r"mysql_connect", r"r57", r"c99", r"id_rsa", r"\.ssh\b",
    r"\.env\b", r"\.git\b", r"\.envrc\b", r"upload\.php", r"\.p12$", r"\.pfx$",
    r"\.jks$", r"\.crt$", r"\.pem$", r"\.key$",
]


def chequear_seguridad(handler, path):
    """Devuelve un mensaje si la ruta debe bloquearse, None si está permitida."""
    if ".." in path:
        return "Path traversal detectado"
    if path.startswith("/certificado/"):
        return "Acceso restringido a /certificado"
    referer = handler.headers.get("Referer", "") or ""
    if path.startswith("/secretos/") and not referer.rstrip("/").endswith("admin-ingreso.html"):
        return "Acceso restringido a /secretos"
    for patron in PATRONES_BLOQUEADOS:
        if re.search(patron, path, re.IGNORECASE):
            return "Ruta bloqueada: %s" % path
    return None


# ------------------------------------------------------------- Rate limiting

RATE = {}
RATE_LOCK = threading.Lock()
RATE_MAX = 30          # req/min por ruta y IP
RATE_MAX_ADMIN = 8     # req/min para las rutas sensibles


def exceso_rate(handler, path):
    ip = handler.client_address[0] if handler.client_address else "?"
    now = time.time()
    limite = RATE_MAX_ADMIN if path in ("/admin-ingreso.html", "/admin.html") else RATE_MAX
    with RATE_LOCK:
        lista = RATE.setdefault((ip, path), [])
        lista[:] = [t for t in lista if now - t < 60]
        lista.append(now)
        return len(lista) > limite


# --------------------------------------------------------------------- Handler

class HandlerSeguro(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # evitamos stderr; usamos el log de acceso propio

    def _log(self, estado, nota=""):
        try:
            with open(ARCHIVO_LOG, "a", encoding="utf-8") as fh:
                fh.write("%s | %s | %s %s | %s | %s\n" % (
                    time.strftime("%Y-%m-%d %H:%M:%S"),
                    self.client_address[0] if self.client_address else "?",
                    self.command, unquote(urlparse(self.path).path), estado, nota,
                ))
        except Exception:
            pass

    def _preludio(self):
        """Chequeos de seguridad + rate limiting. Devuelve True si se respondió."""
        path = unquote(urlparse(self.path).path)

        motivo = chequear_seguridad(self, path)
        if motivo:
            self._log("403", motivo)
            self.send_error(403, motivo)
            return True

        if exceso_rate(self, path):
            self._log("429", "Límite de solicitudes excedido")
            self.send_error(429, "Demasiadas solicitudes desde tu IP. Intenta más tarde.")
            return True

        return False

    def do_GET(self):
        if self._preludio():
            return
        super().do_GET()
        self._log("200", "")

    def do_HEAD(self):
        if self._preludio():
            return
        super().do_HEAD()


class Redirector(BaseHTTPRequestHandler):
    """Redirige HTTP → HTTPS en el puerto 8080."""

    def do_GET(self):
        self._redirect()

    def do_HEAD(self):
        self._redirect()

    def _redirect(self):
        self.send_response(301)
        self.send_header("Location", "https://localhost:%d%s" % (PUERTO_HTTPS, self.path))
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, fmt, *args):
        pass


# ---------------------------------------------------------------- certificate

def generar_certificado():
    if os.path.exists(CERT) and os.path.exists(KEY):
        return
    print("[servidor] Generando certificado autofirmado de localhost/127.0.0.1...")
    try:
        subprocess.run(
            ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-days", "3650",
             "-nodes", "-subj", "/CN=localhost",
             "-addext", "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1",
             "-keyout", KEY, "-out", CERT],
            check=True, capture_output=True,
        )
        return
    except FileNotFoundError:
        pass  # probar con la librería `cryptography`
    except subprocess.CalledProcessError as exc:
        print("[servidor] Error de openssl:", (exc.stderr or b"").decode(errors="replace"))

    try:
        import ipaddress
        from datetime import datetime, timedelta, timezone
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.x509.oid import NameOID

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "localhost")])
        now = datetime.now(timezone.utc).replace(tzinfo=None)  # UTC naive
        cert = (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(name)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - timedelta(days=1))
            .not_valid_after(now + timedelta(days=3650))
            .add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
                ]),
                critical=False,
            )
            .sign(key, hashes.SHA256())
        )
        with open(KEY, "wb") as fh:
            fh.write(key.private_bytes(serialization.Encoding.PEM,
                                       serialization.PrivateFormat.TraditionalOpenSSL,
                                       serialization.NoEncryption()))
        with open(CERT, "wb") as fh:
            fh.write(cert.public_bytes(serialization.Encoding.PEM))
    except Exception as exc:  # pragma: no cover
        sys.exit("[servidor] No se pudo generar el certificado HTTPS: %s" % exc)


def asegurar_secretos():
    pwd_file = os.path.join(SECRETOS, "contrasena_admin.txt")
    otp_file = os.path.join(SECRETOS, "otp_admin.secret.txt")

    if not os.path.exists(pwd_file):
        contrasena = secrets.token_hex(4)
        with open(pwd_file, "w", encoding="utf-8") as fh:
            fh.write(contrasena + "\n")
        print("[servidor] Contraseña del acceso aAdministración: %s" % contrasena)
    if not os.path.exists(otp_file):
        with open(otp_file, "w", encoding="utf-8") as fh:
            fh.write(secrets.token_hex(20) + "\n")


# ---------------------------------------------------------------------- main

def main():
    generar_certificado()
    asegurar_secretos()

    httpd_https = ThreadingHTTPServer((HOST, PUERTO_HTTPS), HandlerSeguro)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)
    httpd_https.socket = ctx.wrap_socket(httpd_https.socket, server_side=True)

    httpd_http = ThreadingHTTPServer((HOST, PUERTO_HTTP), Redirector)

    t = threading.Thread(target=httpd_https.serve_forever, daemon=True)
    t.start()

    print("[servidor] Listo.")
    print("[servidor] HTTPS: https://localhost:%d/" % PUERTO_HTTPS)
    print("[servidor] Redirector HTTP: http://localhost:%d/ → https://localhost:%d/" % (PUERTO_HTTP, PUERTO_HTTPS))
    print("[servidor] Firewall: rutas bloqueadas, rate limit %d req/min (%d en /admin-ingreso.html) → 429" % (RATE_MAX, RATE_MAX_ADMIN))
    print("[servidor] Logs: %s" % ARCHIVO_LOG)
    print("[servidor] Presiona Ctrl+C para detener.")

    try:
        httpd_http.serve_forever()
    except KeyboardInterrupt:
        print("[servidor] Detenido.")


if __name__ == "__main__":
    main()
