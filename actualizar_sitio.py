# -*- coding: utf-8 -*-
"""Actualizador automático del sitio (Asociación Municipal de Básquetbol Cliza).

Ejecutar doble clic en `actualizar_sitio.bat` o desde la terminal:

    python actualizar_sitio.py

Automatiza:
  * Footer: ordena los enlaces alfabéticamente (es) en las 10 páginas.
  * Firma digital: garantiza que "O.LoPeZ_LoLZeRo v1.0" esté en la parte
    inferior de cada página.
  * JavaScript: garantiza que `widget_contacto` esté en los `data-scripts`
    del cargador en todas las páginas que lo usan.
  * Sitemap: regenera `sitemap.xml` con todas las páginas del sitio.

Todo es idempotente: volver a ejecutar no cambia nada.
"""

import datetime
import os
import re

BASE = r"C:\Users\LoL_ZeRo\Desktop\PROGRAMAR\Pagina_web_ABMC"
SITIO_URL = "http://127.0.0.1:8765"
FIRMA = "O.LoPeZ_LoLZeRo v1.0"

PAGINAS = [
    "index.html",
    "fixture.html",
    "posiciones.html",
    "clubes.html",
    "planilla.html",
    "admin.html",
    "aviso-legal.html",
    "privacidad.html",
    "cookies.html",
    "contacto.html",
]


def leer(nombre):
    with open(os.path.join(BASE, nombre), encoding="utf-8") as fh:
        return fh.read()


def escribir(nombre, txt):
    with open(os.path.join(BASE, nombre), "w", encoding="utf-8") as fh:
        fh.write(txt)


def ordenar_footer(txt):
    """Ordena alfabéticamente los enlaces de `.footer-links`."""
    m = re.search(r'<div class="footer-links">\s*(.*?)\s*</div>', txt, re.S)
    if not m:
        return txt
    enlaces = re.findall(r'<a href="([^"]+)">([^<]+)</a>', m.group(1))
    ordenado = sorted(enlaces, key=lambda e: e[1].lower())
    nuevo = (
        '<div class="footer-links">\n'
        + "\n".join('        <a href="%s">%s</a>' % (href, texto) for href, texto in ordenado)
        + "\n      </div>"
    )
    return txt[: m.start()] + nuevo + txt[m.end():]


def asegurar_firma(txt):
    """Garantiza que exista la firma digital en la parte inferior de la página."""
    if 'firma-pie-texto' in txt and FIRMA in txt:
        return txt, False
    m = re.search(r'(<span class="firma-pie-texto">)([^<]*)(</span>)', txt)
    if m and FIRMA not in txt:
        txt = txt[: m.start()] + m.group(1) + FIRMA + m.group(3) + txt[m.end():]
        return txt, True
    firma = (
        '\n\n  <div class="firma-pie">\n'
        '    <span class="firma-pie-texto">%s</span>\n'
        '  </div>\n' % FIRMA
    )
    m = re.search(r"(</footer>)", txt)
    if not m:
        return txt, False
    return txt[: m.end()] + firma + txt[m.end():], True


def automatizar_javascript(txt):
    """Garantiza que `widget_contacto` esté en los `data-scripts` del cargador."""
    m = re.search(r'<script src="js/cargar-sitio\.js" data-scripts="([^"]*)"', txt)
    if not m:
        return txt, False
    actuales = [e.strip() for e in m.group(1).split(",") if e.strip()]
    if "widget_contacto" in actuales:
        return txt, False
    actuales.append("widget_contacto")
    nuevo = '<script src="js/cargar-sitio.js" data-scripts="%s"' % ",".join(actuales)
    return txt[: m.start()] + nuevo + txt[m.end():], True


def regenerar_sitemap(paginas):
    lastmod = datetime.date.today().isoformat()
    urls = "".join(
        '  <url><loc>%s/%s</loc><lastmod>%s</lastmod></url>\n' % (SITIO_URL, p, lastmod)
        for p in sorted(paginas)
    )
    contenido = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls
        + '</urlset>\n'
    )
    with open(os.path.join(BASE, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(contenido)
    return lastmod


def main():
    firmas = 0
    js_añadidos = 0
    paginas_modificadas = 0

    for nombre in PAGINAS:
        txt = leer(nombre)
        original = txt
        txt = ordenar_footer(txt)
        txt, añadir_firma = asegurar_firma(txt)
        txt, añadir_js = automatizar_javascript(txt)
        firmas += 1 if añadir_firma else 0
        js_añadidos += 1 if añadir_js else 0
        if txt != original:
            paginas_modificadas += 1
            escribir(nombre, txt)

    lastmod = regenerar_sitemap(PAGINAS)

    print("\u2713 Actualización del sitio completada.")
    print("  Páginas: %d" % len(PAGINAS))
    print("  Páginas modificadas: %d" % paginas_modificadas)
    print("  Firmas digitales añadidas/actualizadas: %d" % firmas)
    print("  Scripts JS automatizados: %d" % js_añadidos)
    print("  Sitemap regenerado: %d URLs (lastmod %s)" % (len(PAGINAS), lastmod))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
