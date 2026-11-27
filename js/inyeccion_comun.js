/* js/inyeccion_comun.js
   Inyección automática del footer y la firma digital en las páginas del sitio.

   - Ordena alfabéticamente (en) los enlaces de `.footer-links`.
   - Asegura que la firma digital `O.LoPeZ_LoLZeRo v1.0` exista en la parte
     inferior de la página (bloque `div.firma-pie`).
   - Expone `ABMC_INYECCION` (estado de la firma y las funciones) para
     ejecutarlas manualmente desde la consola si se necesita.

   Se conecta al cargador de scripts (`js/cargar-sitio.js`) → se ejecuta
   tras aceptar el consentimiento en todas las páginas del sitio. */
(function () {
  "use strict";

  var FIRMA = "O.LoPeZ_LoLZeRo v1.0";

  function ordenarFooter() {
    var contenedor = document.querySelector(".footer-links");
    if (!contenedor) return;

    var enlaces = Array.prototype.slice.call(contenedor.children);
    if (enlaces.length < 2) return;

    enlaces.sort(function (a, b) {
      var ta = (a.textContent || "").toLowerCase();
      var tb = (b.textContent || "").toLowerCase();
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return 0;
    });
    enlaces.forEach(function (el) {
      contenedor.appendChild(el);
    });
  }

  function asegurarFirma() {
    var firma = document.querySelector(".firma-pie");
    var texto = document.querySelector(".firma-pie-texto");

    if (!firma) {
      var bloque = document.createElement("div");
      bloque.className = "firma-pie";
      bloque.innerHTML = '<span class="firma-pie-texto">' + FIRMA + "</span>";

      var footer = document.querySelector("footer");
      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(bloque, footer.nextSibling);
      } else {
        document.body.appendChild(bloque);
      }
      return "injetada";
    }

    if (texto && texto.textContent.trim() !== FIRMA) {
      texto.textContent = FIRMA;
      return "actualizada";
    }

    return "presente";
  }

  function init() {
    ordenarFooter();
    var estado = asegurarFirma();

    window.ABMC_INYECCION = window.ABMC_INYECCION || {};
    window.ABMC_INYECCION.estadoFirma = estado;
    window.ABMC_INYECCION.asegurarFirma = asegurarFirma;
    window.ABMC_INYECCION.ordenarFooter = ordenarFooter;

    return estado;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
