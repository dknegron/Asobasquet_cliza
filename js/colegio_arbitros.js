/* js/colegio_arbitros.js
   Miembros del Colegio de Árbitros — fotografías de todos los miembros.
   La lista de miembros se mantiene en window.ABMC_COLEGIO_ARBITROS.
   Fotos placeholder: assetsimgarbitros/<slug>.svg (fondo blanco con el nombre del miembro).
   Para usar fotos propias: añade a cada miembro una lista `fotos` de rutas:
     { slug: "miembro-1", nombre: "Juan Pérez", rol: "Árbitro de 1ª división", fotos: ["assetsimgarbitros/miembro-1.jpg"] } */
window.ABMC_COLEGIO_ARBITROS = {
  miembros: [
    { slug: "miembro-1", nombre: "Miembro del Colegio — 1", rol: "Árbitro profesional de la Asociación" },
    { slug: "miembro-2", nombre: "Miembro del Colegio — 2", rol: "Árbitro de 1ª división" },
    { slug: "miembro-3", nombre: "Miembro del Colegio — 3", rol: "Árbitro de 2ª división" },
    { slug: "miembro-4", nombre: "Miembro del Colegio — 4", rol: "Cronometrista" },
    { slug: "miembro-5", nombre: "Miembro del Colegio — 5", rol: "Árbitro de juventil U14" },
    { slug: "miembro-6", nombre: "Miembro del Colegio — 6", rol: "Árbitro profesional" },
    { slug: "miembro-7", nombre: "Miembro del Colegio — 7", rol: "Árbitro de menores" }
  ]
};

(function () {
  "use strict";

  function iniciar() {
    const grid = document.getElementById("colegioMiembros");
    if (!grid) return;

    const datos = window.ABMC_COLEGIO_ARBITROS || { miembros: [] };
    const miembros = Array.isArray(datos.miembros) ? datos.miembros : [];

    function escapar(texto) {
      return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function htmlFotos(fotos, nombre) {
      const items = fotos.map((src) => `<img class="colegio-foto" src="${escapar(src)}" alt="Foto de ${escapar(nombre)}" />`);
      return items.join("");
    }

    grid.innerHTML = miembros
      .map((m, i) => {
        const slug = escapar(m.slug || ("miembro-" + (i + 1)));
        const fotos = Array.isArray(m.fotos) && m.fotos.length > 0
          ? m.fotos
          : ["assetsimgarbitros/" + slug + ".svg"];
        const [principal, ...extras] = fotos;
        const extraHtml = extras.length
          ? `<div class="colegio-galeria">${htmlFotos(extras, m.nombre)}</div>`
          : "";
        return `
          <article class="colegio-card">
            <img class="colegio-foto" src="${escapar(principal)}" alt="Foto de ${escapar(m.nombre)}" />
            ${extraHtml}
            <div class="colegio-info">
              <h3 class="colegio-nombre">${escapar(m.nombre)}</h3>
              <p class="colegio-rol">${escapar(m.rol)}</p>
            </div>
          </article>`;
      })
      .join("");

    if (miembros.length === 0) {
      grid.innerHTML = '<p class="table-note">Aún no se ha registrado ningún miembro en el Colegio.</p>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
