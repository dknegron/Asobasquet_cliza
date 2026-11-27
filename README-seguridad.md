# Seguridad del sitio — Asociación Municipal de Básquetbol Cliza

Funciones de seguridad aplicadas al sitio:

- **HTTPS** en todas las páginas (`https://localhost:8765/`).
- **Redirector HTTP → HTTPS** (`http://localhost:8080/` → 301 → `https://localhost:8765/...`).
- **Firewall básico (WAF)** contra ataques.
- **Bloqueos** por intentos erróneos de la contraseña (login).
- **Verificación en dos pasos (2FA)** para entrar al panel administrativo.
- **Acceso distinto a `wp-admin`**: el panel se accede también desde la
  página de ingreso `admin-ingreso.html`.
- **Escáner diario de virus** (Windows Defender) + análisis estático de código.

## 1. Iniciar el servidor seguro

Doble clic en **`start_server.bat`** (o desde la terminal):

```powershell
python servidor.py
```

Lo que hace el servidor:

- Genera un certificado autofirmado de `localhost`/`127.0.0.1`
  (openssl al arrancar, o librería `cryptography` si no está disponible):
  `certificado/localhost.pem` + `certificado/localhost.key`.
- Sirve HTTPS en **https://localhost:8765/**.
- Redirige HTTP en **http://localhost:8080/** hacia HTTPS.
- Aplica el firewall (WAF):
  - Bloquea rutas sensibles: `wp-admin`, `wp-login`, `administrator`,
    `administración`, `administrar`, `.php`, `.exe`, `.dll`, `shell.php`,
    `phpinfo.php`, `install.php`, `setup.php`, `config.php`, `/etc/passwd`,
    `mysql_connect`, `r57`, `c99`, `id_rsa`, `.ssh`, `.env`, `.git`, `.envrc`,
    `.p12`, `.pfx`, `.jks`, `.crt`, `.pem`, `.key`, `/certificado/`,
    `/secretos/` (salvo si vienen del login), `path traversal`, etc.
  - Rate limiting por ruta y IP: máx. 30 req/min por ruta
    (8 en `/admin-ingreso.html` y `/admin.html`) → respuesta **429**.
  - Registra todas las accesos en `logs/servidor.log`.
- Genera los secretos al iniciar (si faltan):
  - `secretos/contrasena_admin.txt` — contraseña del acceso aAdministración
    (se imprime al iniciar).
  - `secretos/otp_admin.secret.txt` — secreto TOTP 2FA (se muestra en la
    página de login).

> Accede con **https://localhost:8765/**. El navegador mostrará un aviso
> típico por certificado autofirmado; procede para continuar.

## 2. Acceso al panel administrativo (`wp-admin` distinto)

- `admin.html` redirige a la página de ingreso: **`admin-ingreso.html`**.
- Ingreso en dos pasos:
  1. Contraseña (guardada en `secretos/contrasena_admin.txt`).
  2. Código de verificación **2FA TOTP** de 6 dígitos que muestra la página
     (válido cada 30 s). El secreto TOTP se muestra para añadirlo a una
     app de autenticación.
- Bloqueos por intentos erróneos:
  - 5 intentos incorrectos de contraseña o de código 2FA → cuenta
    **bloqueada 15 minutos** (en `localStorage` del navegador).
  - El servidor limita a 8 peticiones/min los ingresos fallidos.
- Después de un ingreso correcto: `sessionStorage` + redirección a `admin.html`.

## 3. Escáner diario de viror (virus)

`scan_site.py` ejecuta un escaneo estático completo del sitio:

1. **Patrones de código sospechoso** en todos los archivos (`eval(`,
   `new Function`, `shell_exec`, `<?php`, `<%`, `/etc/passwd`,
   `c99`, `r57`, `adminer`, `.env`, `$_GET`, etc.).
2. **Extensiones ejecutables/peligrosas** en el árbol del sitio
   (`.exe`, `.dll`, `.bat`, `.cmd`, `.ps1`, `.scr`, `.vbs`, `.jar`, ...).
3. **Integridad**: manifest en `integrity/hashes.json` comparado con
   hashes SHA-256 de los archivos (si el manifest falta, se crea como línea
   base).
4. **Escaneo con Windows Defender** (`mpcmdrun.exe -Scan -ScanType
   CustomScan -File`), si está disponible.

Informe: `logs/scan_site_<fecha>.log`.

Instalar como tarea diaria (doble clic en **`instalar_scan_diario.bat`**,
requiere permisos de administrador): crea la tarea **EscaneoDiarioSitioABMC**
que ejecuta diariamente a las 02:00.

Ejecución manual: `python scan_site.py` (código de retorno 1 si hay hallazgos).

## 4. Copia de seguridad

Doble clic en **`actualizar_backup.bat`** → copia todo el sitio en
`C:\Users\LoL_ZeRo\Desktop\backups\web-Pagina_web_ABMC`.

## 5. Otros scripts del sitio

- **`actualizar_sitio.bat` / `actualizar_sitio.py`**: automatiza el footer
  (orden alfabético), la firma digital (`O.LoPeZ_LoLZeRo v1.0`) y el wiring
  del widget de contacto en todas las páginas.
- **`js/inyeccion_comun.js`**: inyección client-side del footer ordenado y
  la firma digital en cada página (ejecutado tras aceptar el consentimiento).
- **`js/widget_contacto.js`**: widget flotante de contacto (WhatsApp).
- **`js/otp_admin.js`**: generación del TOTP de verificación en dos pasos.

## 6. Variables de entorno

Ninguna necesaria. El servidor usa rutas absolutas internas (`BASE =
os.path.dirname(os.path.abspath(__file__))`).
