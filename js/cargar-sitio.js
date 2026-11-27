/* Carga los scripts del sitio SOLO después de que el usuario acepte.

   Se coloca al final del <body> con el atributo data-scripts:
     <script src="js/cargar-sitio.js" data-scripts="datos,almacen,motor,iu_public"></script>

   Si no hay consentimiento guardado, este archivo no carga absolutamente nada
   (ni datos, ni almacenamiento, ni lógica de la interfaz). */

(function (global) {
  var doc = global.document;
  var actual = doc.currentScript;
  var listaCruda = actual ? actual.getAttribute("data-scripts") || "" : "";
  var lista = listaCruda
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);

  var consentimiento = global.ABMC_CONSENTIMIENTO;

  if (!consentimiento || !consentimiento.aceptado() || lista.length === 0) {
    return; /* sin aceptar: no se carga nada */
  }

  var indice = 0;

  function terminar() {
    /* Las interfaces escuchan DOMContentLoaded: si ese evento ya ocurrió
       (lo normal, porque aquí ya terminó de parsear), se lanza una vez más
       para que rendericen. Si aún no ocurrió, se deja el evento natural. */
    if (global.__abmcDCL) {
      try {
        doc.dispatchEvent(new Event("DOMContentLoaded"));
      } catch (err) {
        /* sin soporte: la interfaz quedará estática pero nada se rompe */
      }
    }
  }

  function cargarSiguiente() {
    if (indice >= lista.length) {
      terminar();
      return;
    }

    var nombre = lista[indice];
    var etiqueta = doc.createElement("script");
    etiqueta.src = "js/" + nombre + ".js?v=2";
    etiqueta.onload = function () {
      indice += 1;
      cargarSiguiente();
    };
    etiqueta.onerror = function () {
      /* Si falta un archivo se salta y continúa con el resto. */
      indice += 1;
      cargarSiguiente();
    };
    doc.head.appendChild(etiqueta);
  }

  cargarSiguiente();
})(window);
