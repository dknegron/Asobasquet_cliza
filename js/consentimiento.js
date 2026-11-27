/* Control de consentimiento (se carga en <head> de todas las páginas).

   Reglas:
   - Solo guarda la decisión del usuario en ABMC_CONSENTIMIENTO_V1.
   - NO carga scripts del sitio, NO lee ni escribe ABMC_CLIZA_LIGA_V1
     (los datos del sitio) hasta que el usuario acepte.
   - Mientras no haya decisión, las páginas de contenido muestran un bloqueo
     completo; las páginas legales muestran una barra no invasiva para poder
     leer la política antes de decidir. */

(function (global) {
  var CLAVE = "ABMC_CONSENTIMIENTO_V1";
  var PAGINAS_LEGALES = ["aviso-legal", "privacidad", "cookies"];
  var estado = null;
  var pintado = false;

  try {
    estado = global.localStorage.getItem(CLAVE);
  } catch (err) {
    estado = null;
  }

  function persistir(valor) {
    try {
      global.localStorage.setItem(CLAVE, valor);
    } catch (err) {
      /* Navegador sin almacenamiento: la decisión vale para esta sesión. */
    }
  }

  function avisar() {
    try {
      global.dispatchEvent(
        new CustomEvent("abmc:consentimiento", { detail: { estado: estado } })
      );
    } catch (err) {
      /* sin soporte de CustomEvent: no hay nada más que avisar */
    }
  }

  function borrarDatosSitio() {
    /* Si el usuario rechaza (o borra su decisión), no debe permanecer
       guardado ningún dato del sitio en el navegador. */
    try {
      global.localStorage.removeItem("ABMC_CLIZA_LIGA_V1");
    } catch (err) {
      /* sin almacenamiento no había nada que borrar */
    }
  }

  var api = {
    decidido: function () {
      return estado === "aceptado" || estado === "rechazado";
    },
    aceptado: function () {
      return estado === "aceptado";
    },
    rechazado: function () {
      return estado === "rechazado";
    },
    aceptar: function () {
      estado = "aceptado";
      persistir("aceptado");
      avisar();
    },
    rechazar: function () {
      estado = "rechazado";
      persistir("rechazado");
      borrarDatosSitio();
      avisar();
    },
    olvidar: function () {
      estado = null;
      try {
        global.localStorage.removeItem(CLAVE);
      } catch (err) {
        /* sin almacenamiento no había nada que borrar */
      }
      borrarDatosSitio();
      avisar();
    }
  };

  global.ABMC_CONSENTIMIENTO = api;

  /* Marca si el DOMContentLoaded original ya se disparó: lo usa
     cargar-sitio.js para saber si debe lanzarlo de forma manual. */
  global.__abmcDCL = false;
  global.document.addEventListener("DOMContentLoaded", function () {
    global.__abmcDCL = true;
  }, false);

  /* ---------- interfaz del aviso ---------- */

  function esPaginaLegal() {
    var ruta = String(global.location.pathname || "").toLowerCase();
    for (var i = 0; i < PAGINAS_LEGALES.length; i++) {
      if (ruta.indexOf(PAGINAS_LEGALES[i]) >= 0) return true;
    }
    return false;
  }

  function crearBoton(texto, tipo, alPulsar) {
    var btn = global.document.createElement("button");
    btn.type = "button";
    btn.className = "btn " + tipo;
    btn.textContent = texto;
    btn.addEventListener("click", alPulsar);
    return btn;
  }

  function crearEnlace(texto, href) {
    var a = global.document.createElement("a");
    a.href = href;
    a.textContent = texto;
    return a;
  }

  function aceptarYRecargar() {
    api.aceptar();
    global.location.reload();
  }

  function rechazarYRecargar() {
    api.rechazar();
    global.location.reload();
  }

  function olvidarYRecargar() {
    api.olvidar();
    global.location.reload();
  }

  function quitarAvisosPrevios() {
    var viejos = global.document.querySelectorAll("[data-abmc-consentimiento]");
    for (var i = 0; i < viejos.length; i++) {
      viejos[i].parentNode.removeChild(viejos[i]);
    }
  }

  function textoBasico() {
    return (
      "Usamos almacenamiento local en tu navegador para recordar tu decisión y, " +
      "solo si lo aceptas, para guardar los datos del sitio (resultados, sanciones y comunicados). " +
      "No hay publicidad, ni analítica, ni recursos de terceros."
    );
  }

  function pintarBloqueo() {
    var doc = global.document;

    var fondo = doc.createElement("div");
    fondo.className = "consentimiento-gate";
    fondo.setAttribute("data-abmc-consentimiento", "gate");
    doc.body.classList.add("consentimiento-bloqueado");

    var caja = doc.createElement("div");
    caja.className = "consentimiento-caja";

    var titulo = doc.createElement("h2");
    titulo.className = "consentimiento-titulo";
    titulo.textContent = "Cookies y privacidad";

    var parrafo = doc.createElement("p");
    parrafo.className = "consentimiento-texto";
    parrafo.appendChild(doc.createTextNode(textoBasico() + " "));
    parrafo.appendChild(crearEnlace("Leer la política de cookies", "cookies.html"));

    var acciones = doc.createElement("div");
    acciones.className = "consentimiento-acciones";
    acciones.appendChild(crearBoton("Aceptar", "btn-primary", aceptarYRecargar));
    acciones.appendChild(
      crearBoton("Rechazar", "btn-outline-light", rechazarYRecargar)
    );
    acciones.appendChild(
      crearBoton("Aviso legal", "btn-outline-light", function () {
        global.location.href = "aviso-legal.html";
      })
    );

    caja.appendChild(titulo);
    caja.appendChild(parrafo);
    caja.appendChild(acciones);
    fondo.appendChild(caja);
    doc.body.appendChild(fondo);
  }

  function pintarBarra(permiteDecidir) {
    var doc = global.document;

    var barra = doc.createElement("div");
    barra.className = "consentimiento-barra";
    barra.setAttribute("data-abmc-consentimiento", "barra");
    doc.body.classList.add("consentimiento-con-barra");

    var texto = doc.createElement("div");
    texto.className = "consentimiento-barra-texto";

    var fuerte = doc.createElement("strong");
    if (permiteDecidir) {
      fuerte.textContent = "Cookies y privacidad: ";
      texto.appendChild(fuerte);
      texto.appendChild(doc.createTextNode(textoBasico()));
    } else {
      fuerte.textContent = "Has rechazado las cookies. ";
      texto.appendChild(fuerte);
      texto.appendChild(
        doc.createTextNode(
          "El sitio se muestra en modo estático: no se cargan sus scripts ni se guarda nada en tu navegador."
        )
      );
    }

    var acciones = doc.createElement("div");
    acciones.className = "consentimiento-acciones";

    if (permiteDecidir) {
      acciones.appendChild(crearBoton("Aceptar", "btn-primary", aceptarYRecargar));
      acciones.appendChild(
        crearBoton("Rechazar", "btn-outline-dark", rechazarYRecargar)
      );
    } else {
      acciones.appendChild(
        crearBoton("Configurar cookies", "btn-primary", olvidarYRecargar)
      );
    }

    var enlace = crearEnlace("Ver política", "cookies.html");
    enlace.className = "consentimiento-enlace";

    barra.appendChild(texto);
    barra.appendChild(acciones);
    barra.appendChild(enlace);
    doc.body.appendChild(barra);
  }

  function pintar() {
    if (pintado) return;
    if (!global.document.body) return;
    pintado = true;

    quitarAvisosPrevios();

    if (api.aceptado()) return; /* todo cargado, no se molesta al usuario */

    if (!api.decidido() && !esPaginaLegal()) {
      pintarBloqueo();
      return;
    }

    pintarBarra(!api.decidido());
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", pintar, false);
  } else {
    pintar();
  }
})(window);
