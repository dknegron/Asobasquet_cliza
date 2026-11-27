/* Widget flotante de contacto (WhatsApp).
   - Lo crea en la esquina inferior-derecha (animado).
   - Si se define window.ABMC_CONTACTO.numero, al pulsarlo abre WhatsApp.
   - Si no, abre el modal de contacto con los canales oficiales.
   - Solo se ejecuta tras aceptar el consentimiento (se carga con cargar-sitio). */
(function () {
  "use strict";

  function crearWidget() {
    const existente = document.getElementById("widgetWhatsApp");
    if (existente) return existente;

    const widget = document.createElement("div");
    widget.id = "widgetWhatsApp";
    widget.className = "widget-whatsapp";
    widget.setAttribute("role", "button");
    widget.setAttribute("tabindex", "0");
    widget.setAttribute(
      "aria-label",
      "Contactar a la Asociación Municipal de Básquetbol Cliza por WhatsApp"
    );
    widget.innerHTML =
      '<img src="gifs/whatsapp.webp" alt="" class="widget-whatsapp-icono" width="34" height="34" aria-hidden="true" />';
    return widget;
  }

  function abrirModal() {
    let modal = document.getElementById("modalContacto");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modalContacto";
      modal.className = "modal-contacto";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Contacto");
      modal.innerHTML = `
        <div class="modal-card">
          <h2 class="card-title">Contacto</h2>
          <p>
            La Asociación Municipal de Básquetbol Cliza puedes contactarla a través de los
            canales oficiales que la Asociación tiene disponibles y que se difunden en sus
            comunicados.
          </p>
          <ul class="modal-list">
            <li><strong>Oficinas en Cliza</strong>: turnos coordinados por los circuitos oficiales del campeonato.</li>
            <li><strong>Comunicados oficiales</strong>: avisos, reprogramaciones y resoluciones en <a href="clubes.html">Clubes, Reglamentos y Comunicados</a>.</li>
            <li><strong>Página de contacto</strong>: ver detalles en <a href="contacto.html">Contacto</a>.</li>
          </ul>
          <a href="contacto.html" class="btn btn-primary">Ver página de contacto</a>
        </div>
        <button type="button" class="modal-close" aria-label="Cerrar">×</button>`;
      const cerrar = () => modal.classList.remove("modal-contacto--activo");
      modal.querySelector(".modal-close").addEventListener("click", cerrar);
      modal.addEventListener("click", (ev) => { if (ev.target === modal) cerrar(); });
      document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") cerrar(); });
      document.body.appendChild(modal);
    }
    modal.classList.add("modal-contacto--activo");
  }

  function iniciar() {
    const telefono = (window.ABMC_CONTACTO && window.ABMC_CONTACTO.numero) || "59177414127";
    const widget = crearWidget();
    document.body.appendChild(widget);

    widget.addEventListener("click", () => {
      if (telefono) {
        window.open("https://wa.me/" + encodeURIComponent(telefono), "_blank", "noopener");
        return;
      }
      abrirModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
