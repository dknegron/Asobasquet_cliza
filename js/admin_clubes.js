/* js/admin_clubes.js
   Panel de administración: gestión del catálogo de clubes afiliados.
   - Lista de clubes con fotos (editar / eliminar).
   - Formulario para agregar o editar clubes.
   - El catálogo se guarda en localStorage (ABMC_CLUBES_CATALOGO) y se muestra
     en la página de Clubes (clubes.html).
   - Fotos: lista de URLs por línea (vacía = usar placeholder de assetsimgclubes/<slug>). */
(function () {
  "use strict";

  const almacen = window.ABMC_ALMACEN;
  const grid = document.getElementById("clubesAdminList");
  const form = document.getElementById("clubesAdminForm");
  const msg = document.getElementById("clubesAdminMsg");
  const btnNuevo = document.getElementById("clubesAdminNuevo");
  const btnCancelar = document.getElementById("clubesAdminCancelar");
  const inNombre = document.getElementById("clubNombre");
  const inCategoria = document.getElementById("clubCategoria");
  const inSlug = document.getElementById("clubSlug");
  const inFotos = document.getElementById("clubFotos");
  const hint = document.getElementById("clubesAdminHint");
  const count = document.getElementById("clubesAdminCount");

  if (!almacen || !grid || !form) return;

  let clubEditable = null; // nombre del club cuyo formulario está activo (null = nuevo)

  function mostrar(texto, estado) {
    if (!msg) return;
    msg.textContent = texto;
    msg.className = "clubes-admin-msg" + (estado === "error" ? " clubes-admin-msg--error" : "");
  }

  function escapar(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fotosDelFormulario() {
    return (inFotos.value || "")
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea);
  }

  function infoFotos(club) {
    if (Array.isArray(club.fotos) && club.fotos.length > 0) {
      return club.fotos.map((f) => f.split("/").pop()).join(", ");
    }
    if (club.slug) return "Placeholder (slug: " + club.slug + ", 3 fotos)";
    return "Sin fotos";
  }

  function renderizar() {
    const lista = almacen.cargarCatalogoClubes();
    if (count) count.textContent = lista.length;

    if (lista.length === 0) {
      grid.innerHTML = `<p class="table-note">No hay clubes registrados en el catálogo. Los clubes que aparecen en el fixture se muestran igualmente en la página de Clubes.</p>`;
      return;
    }

    grid.innerHTML = lista
      .map((club) => {
        const fotos = almacen.fotosDeClub(club);
        const fotosHTML = fotos
          .map((src) => `<img class="clubes-admin-foto" src="${escapar(src)}" alt="Foto de ${escapar(club.nombre)}" />`)
          .join("");
        const categorias = club.categoria ? club.categoria : "Categoría por asignar";
        return `
          <div class="clubes-admin-fila">
            <div class="clubes-admin-info">
              <strong class="clubes-admin-nombre">${escapar(club.nombre)}</strong>
              <span class="clubes-admin-categoria">${escapar(categorias)}</span>
              <span class="clubes-admin-fotos-texto">${escapar(infoFotos(club))}</span>
            </div>
            <div class="clubes-admin-fotos">${fotosHTML}</div>
            <div class="clubes-admin-acciones">
              <button type="button" class="btn btn-outline-dark btn-sm" data-accion="editar" data-nombre="${escapar(club.nombre)}">Editar</button>
              <button type="button" class="btn btn-primary btn-sm" data-accion="eliminar" data-nombre="${escapar(club.nombre)}">Eliminar</button>
            </div>
          </div>`;
      })
      .join("");

    // Si una foto del catálogo no existe, se muestra la imagen de "Sin foto".
    grid.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", function () {
        this.src = almacen.fallbackUrl(img.alt || "Sin foto");
      });
    });

    actividadLista();
  }

  function buscarClub(nombre) {
    return almacen.cargarCatalogoClubes().find(
      (c) => c.nombre.trim().toLowerCase() === String(nombre || "").trim().toLowerCase()
    );
  }

  function actividadLista() {
    grid.querySelectorAll("[data-accion]").forEach((boton) => {
      const accion = boton.getAttribute("data-accion");
      const nombre = boton.getAttribute("data-nombre");

      if (accion === "editar") {
        boton.addEventListener("click", function () {
          const club = buscarClub(nombre);
          if (club) inicializarFormulario(club);
          form.scrollIntoView({ behavior: "smooth", block: "center" });
          inNombre.focus();
        });
      } else if (accion === "eliminar") {
        boton.addEventListener("click", function () {
          const club = buscarClub(nombre);
          if (!club) return;
          const confirmar = window.confirm("¿Eliminar el club " + club.nombre + " del catálogo?");
          if (!confirmar) return;
          almacen.eliminarClubDelCatalogo(club.nombre);
          if (clubEditable && clubEditable.toLowerCase() === club.nombre.toLowerCase()) {
            limpiarFormulario();
          }
          renderizar();
          mostrar("Club eliminado del catálogo: " + club.nombre + ".", "ok");
        });
      }
    });
  }

  function inicializarFormulario(club) {
    inNombre.value = club ? club.nombre : "";
    inCategoria.value = club ? club.categoria : "";
    inSlug.value = club ? club.slug : "";
    inFotos.value = club && Array.isArray(club.fotos) ? club.fotos.join("\n") : "";
    clubEditable = club ? club.nombre : null;
    if (btnCancelar) btnCancelar.hidden = false;
    if (hint) hint.textContent = club && club.slug ? infoFotos(club) : "";
  }

  function limpiarFormulario() {
    inNombre.value = "";
    inCategoria.value = "";
    inSlug.value = "";
    inFotos.value = "";
    clubEditable = null;
    if (btnCancelar) btnCancelar.hidden = true;
    if (hint) hint.textContent = "";
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    const nombre = inNombre.value.trim();
    if (!nombre) {
      mostrar("Ingresa el nombre del club.", "error");
      return;
    }
    const categoria = inCategoria.value.trim();
    const slug = inSlug.value.trim();
    const fotos = fotosDelFormulario();

    if (clubEditable) {
      const resultado = almacen.editarClubDelCatalogo(clubEditable, { nombre, categoria, slug, fotos });
      if (!resultado) {
        mostrar("No se encontró el club " + clubEditable + " para editarlo.", "error");
        return;
      }
      mostrar("Club actualizado: " + nombre + ".", "ok");
    } else {
      const yaExiste = almacen.cargarCatalogoClubes().some(
        (c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );
      if (yaExiste) {
        mostrar("Ya existe un club llamado " + nombre + ".", "error");
        return;
      }
      almacen.agregarClubAlCatalogo({ nombre, categoria, slug, fotos });
      mostrar("Club agregado al catálogo: " + nombre + ".", "ok");
    }
    limpiarFormulario();
    renderizar();
  });

  if (btnNuevo) btnNuevo.addEventListener("click", function () {
    limpiarFormulario();
  });
  if (btnCancelar) btnCancelar.addEventListener("click", function () {
    limpiarFormulario();
  });

  renderizar();
  mostrar("", "ok");
})();
