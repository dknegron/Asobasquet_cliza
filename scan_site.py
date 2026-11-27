# -*- coding: utf-8 -*-
"""
Escaneo diario de seguridad estática del sitio (Asociación Municipal de Básquetbol Cliza).

Chequeos:
  1. Contenido de texto: patrones de código malicioso común
     (eval, shell, PHP, base64, cadenas de ataque...).
  2. Extensiones ejecutables/peligrosas en el árbol del sitio.
  3. Integridad: manifest en integrity/hashes.json vs hashes SHA-256
     (si falta, se crea como línea base).
  4. Escaneo con Windows Defender (mpcmdrun.exe), si está disponible.

Genera informe en logs/scan_site_<fecha>.log y devuelve exit code 1 si
hay hallazgos, 0 si está limpio.
Ejecutar: python scan_site.py
"""

import hashlib
import glob
import json
import os
import re
import subprocess
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

LOGS = os.path.join(BASE, "logs")
INTEGRITY = os.path.join(BASE, "integrity")
os.makedirs(LOGS, exist_ok=True)
os.makedirs(INTEGRITY, exist_ok=True)

PATRONES = [
    r"eval\(", r"new Function", r"document\.write\s*\(", r"base64_decode", r"atob\(",
    r"<\?php", r"<%", r"/etc/passwd", r"mysql_connect", r"c99", r"r57", r"wso",
    r"/bin/sh", r"/etc/shadow", r"cat\s+/etc/passwd", r"\$_GET", r"\$_POST", r"\$_COOKIE",
    r"phpinfo\(", r"shell_exec", r"system\s*\(", r"passthru\(", r"proc_open",
    r"/proc/self/environ", r"adminer", r"pma", r"web\.config", r"\.env\b",
]

EXTENSIONES_EJECUTABLES = {
    ".exe", ".dll", ".bat", ".cmd", ".ps1", ".scr", ".vbs", ".wsf", ".lnk",
    ".jar", ".class", ".dmg", ".msi", ".pfx", ".p12", ".key", ".pem",
}

DIRS_EXCLUIDAS = {"logs", "secretos", "integrity", "__pycache__"}

# Archivos del proyecto de seguridad/mantenimiento (código legítimo y documentos
# de referencia): se excluyen del escaneo de patrones y de extensiones ejecutables.
ARCHIVOS_EXCLUIDOS = {
    "actualizar_sitio.py", "actualizar_sitio.bat", "actualizar_backup.bat",
    "start_server.bat", "instalar_scan_diario.bat",
    "scan_site.py", "servidor.py", "admin-ingreso.html", "README-seguridad.md",
}


def es_excluido(rel):
    """True si el archivo es de nuestros scripts (comparación en separadores inválidos)."""
    return rel.replace(os.sep, "/") in ARCHIVOS_EXCLUIDOS


def archivos_del_sitio():
    resultado = []
    for dirpath, dirnames, filenames in os.walk(BASE):
        dirnames[:] = [d for d in dirnames if d not in DIRS_EXCLUIDAS]
        for fn in filenames:
            resultado.append(os.path.relpath(os.path.join(dirpath, fn), BASE))
    return sorted(resultado)


def sha256_archivo(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as fh:
        for bloque in iter(lambda: fh.read(65536), b""):
            h.update(bloque)
    return h.hexdigest()


def escanear_con_defensa(ruta):
    candidatos = glob.glob(r"C:\Program Files\Windows Defender\mpcmdrun.exe")
    candidatos.extend(glob.glob(r"C:\ProgramData\Microsoft\Windows Defender\Platform\*\mpcmdrun.exe"))
    for exe in candidatos:
        try:
            proc = subprocess.run(
                [exe, "-Scan", "-ScanType", "CustomScan", "-File", ruta],
                capture_output=True, text=True, timeout=600,
            )
            return proc.returncode, (proc.stdout or proc.stderr or "").strip()
        except Exception as exc:
            return None, "Error ejecutando Windows Defender: %s" % exc
    return None, "Windows Defender no encontrado en este equipo."


def main():
    fecha = time.strftime("%Y-%m-%d")
    log_path = os.path.join(LOGS, "scan_site_%s.log" % fecha)
    hallazgos = []
    archivos = archivos_del_sitio()

    # 1. Patrones de código sospechoso
    for rel in archivos:
        if es_excluido(rel):
            continue
        ruta = os.path.join(BASE, rel)
        try:
            texto = open(ruta, encoding="utf-8", errors="replace").read()
        except Exception:
            continue
        for patron in PATRONES:
            for m in re.finditer(patron, texto):
                linea = texto[: m.start()].count("\n") + 1
                hallazgos.append(
                    "%s:%s: patrón sospechoso [%s] (%r)"
                    % (rel, linea, patron, m.group(0)[:60])
                )

    # 2. Extensiones ejecutables
    for rel in archivos:
        if es_excluido(rel):
            continue
        ext = os.path.splitext(rel)[1].lower()
        if ext in EXTENSIONES_EJECUTABLES:
            hallazgos.append("%s: extensión ejecutable (%s)" % (rel, ext))

    # 3. Integridad (manifest SHA-256)
    manifest = os.path.join(INTEGRITY, "hashes.json")
    hashes = {
        rel: {"sha256": sha256_archivo(os.path.join(BASE, rel)), "tamano": os.path.getsize(os.path.join(BASE, rel))}
        for rel in archivos
    }
    if not os.path.exists(manifest):
        with open(manifest, "w", encoding="utf-8") as fh:
            json.dump({"fecha": fecha, "archivos": hashes}, fh, indent=2)
        hallazgos.append("Manifest de integridad creado (línea base): integrity/hashes.json")
    else:
        try:
            with open(manifest, encoding="utf-8") as fh:
                guardado = json.load(fh)
            prev = guardado.get("archivos", {})
            for rel in sorted(set(hashes) - set(prev)):
                hallazgos.append("Integridad: archivo nuevo detectado: %s" % rel)
            for rel in sorted(set(prev) - set(hashes)):
                hallazgos.append("Integridad: archivo eliminado: %s" % rel)
            for rel in sorted(set(prev) & set(hashes)):
                if prev[rel].get("sha256") != hashes[rel]["sha256"]:
                    hallazgos.append("Integridad: archivo MODIFICADO: %s" % rel)
        except Exception as exc:
            hallazgos.append("Integridad: no se pudo leer integrity/hashes.json (%s)" % exc)

    # 4. Escaneo con Windows Defender
    codigo, detalle = escanear_con_defensa(BASE)
    if codigo is not None:
        primera = (detalle.splitlines() or [""])[0] if detalle else ""
        hallazgos.append("Escaneo con Windows Defender: código de retorno %s (%s)" % (codigo, primera[:120]))

    # Informe
    with open(log_path, "w", encoding="utf-8") as fh:
        fh.write("Escaneo diario del sitio — Asociación Municipal de Básquetbol Cliza\n")
        fh.write("Fecha: %s\n" % time.strftime("%Y-%m-%d %H:%M:%S"))
        fh.write("Archivos analizados: %d\n\n" % len(archivos))
        if hallazgos:
            fh.write("HALLAZGOS (%d):\n" % len(hallazgos))
            for h in hallazgos:
                fh.write("  - %s\n" % h)
        else:
            fh.write("Sin hallazgos. El sitio está limpio.\n")

    print("[escaneo] Archivos analizados: %d" % len(archivos))
    print("[escaneo] Hallazgos: %d" % len(hallazgos))
    for h in hallazgos:
        print("  - %s" % h)
    print("[escaneo] Informe: %s" % log_path)
    return 1 if hallazgos else 0


if __name__ == "__main__":
    sys.exit(main())
