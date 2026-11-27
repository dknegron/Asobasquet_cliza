(function () {
 const almacen = window.ABMC_ALMACEN;
  const datos = almacen
    ? almacen.cargarEstado()
    : window.ABMC_DATOS || { partidos: [], sanciones: [], comunicados: [] };
  const motor = window.ABMC_MOTOR || { calcularPosiciones: () => [] };

  const partidos = Array.isArray(datos.partidos) ? datos.partidos : [];
  const sanciones = Array.isArray(datos.sanciones) ? datos.sanciones : [];
  const comunicados = Array.isArray(datos.comunicados) ? datos.comunicados : [];

  function escaparTexto(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatearEstadoBadge(estado) {
    const clave = String(estado || "programado").toLowerCase();
    const mapa = {
      programado: { clase: "badge--programado", texto: "Programado" },
      finalizado: { clase: "badge--finalizado", texto: "Finalizado" },
      wo: { clase: "badge--wo", texto: "W.O. (20 - 0)" },
      postergado: { clase: "badge--postergado", texto: "Postergado" }
    };
    const info = mapa[clave] || mapa.programado;
    return `<span class="badge ${info.clase}">${info.texto}</span>`;
  }

  function renderTarjetaPartido(partido, mostrarCuartosDetallados) {
    const estado = String(partido.estado || "programado").toLowerCase();
    const tieneMarcador = estado === "finalizado" || estado === "wo";

    const ptsLocal =
      estado === "wo"
        ? (partido.woGanador === "visitante" ? 0 : 20)
        : tieneMarcador
          ? Number(partido.ptsLocal ?? 0)
          : "-";

    const ptsVisitante =
      estado === "wo"
        ? (partido.woGanador === "visitante" ? 20 : 0)
        : tieneMarcador
          ? Number(partido.ptsVisitante ?? 0)
          : "-";

    const ganaLocal = tieneMarcador && Number(ptsLocal) > Number(ptsVisitante);
    const ganaVisitante = tieneMarcador && Number(ptsVisitante) > Number(ptsLocal);

    const metaTexto = mostrarCuartosDetallados
      ? `${escaparTexto(partido.categoria)} · ${escaparTexto(partido.fecha)} · ${escaparTexto(partido.hora || "")}`
      : `${escaparTexto(partido.categoria)} · ${escaparTexto(partido.fecha)}`;

    const bloqueCuartos = mostrarCuartosDetallados
      ? `<div class="match-quarters">${escaparTexto(partido.cuartos || "Sin detalle de cuartos.")}</div>`
      : "";

    const hrefPlanilla = `planilla.html?id=${encodeURIComponent(partido.id || "")}`;

    return `
      <article class="match-card">
        <div class="match-meta">
          <span>${metaTexto}</span>
          ${formatearEstadoBadge(estado)}
        </div>
        <div class="match-team-row ${ganaLocal ? "is-winner" : ""}">
          <span class="match-team-name">${escaparTexto(partido.local)}</span>
          <span class="match-score">${escaparTexto(ptsLocal)}</span>
        </div>
        <div class="match-team-row ${ganaVisitante ? "is-winner" : ""}">
          <span class="match-team-name">${escaparTexto(partido.visitante)}</span>
          <span class="match-score">${escaparTexto(ptsVisitante)}</span>
        </div>
        ${bloqueCuartos}
        <div class="match-footer">
          <span>${escaparTexto(partido.coliseo || "Coliseo Municipal de Cliza")}</span>
          <a href="${hrefPlanilla}" class="btn btn-dark btn-sm">Ver Planilla</a>
        </div>
      </article>
    `;
  }

  function poblarSelectCategorias(selectEl) {
    if (!selectEl) return;
    const categorias = Array.from(
      new Set(partidos.map((p) => p.categoria).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es"));

    const valorActual = selectEl.value || "todas";
    const primeraOpcion = selectEl.options[0]
      ? selectEl.options[0].outerHTML
      : `<option value="todas">Todas las categorías</option>`;

    selectEl.innerHTML =
      primeraOpcion +
      categorias
        .map((cat) => `<option value="${escaparTexto(cat)}">${escaparTexto(cat)}</option>`)
        .join("");

    if (Array.from(selectEl.options).some((opt) => opt.value === valorActual)) {
      selectEl.value = valorActual;
    }
  }

  function poblarSelectFechas(selectEl) {
    if (!selectEl) return;
    const fechas = Array.from(
      new Set(partidos.map((p) => p.fecha).filter(Boolean))
    );

    const valorActual = selectEl.value || "todas";
    const primeraOpcion = selectEl.options[0]
      ? selectEl.options[0].outerHTML
      : `<option value="todas">Todas las fechas</option>`;

    selectEl.innerHTML =
      primeraOpcion +
      fechas
        .map((f) => `<option value="${escaparTexto(f)}">${escaparTexto(f)}</option>`)
        .join("");

    if (Array.from(selectEl.options).some((opt) => opt.value === valorActual)) {
      selectEl.value = valorActual;
    }
  }

  function iniciarInicio() {
    const matchesEl = document.getElementById("homeMatchesContainer");
    const standingsBodyEl = document.getElementById("homeStandingsBody");
    const noticesEl = document.getElementById("homeNoticesContainer");

    if (matchesEl) {
      if (partidos.length === 0) {
        matchesEl.innerHTML = `<p class="table-note">No hay partidos registrados todavía.</p>`;
      } else {
        matchesEl.innerHTML = partidos
          .slice(0, 4)
          .map((p) => renderTarjetaPartido(p, false))
          .join("");
      }
    }

    if (standingsBodyEl) {
      const filas = motor.calcularPosiciones(partidos, sanciones, "todas");
      if (filas.length === 0) {
        standingsBodyEl.innerHTML = `
          <tr>
            <td>1</td>
            <td>Sin partidos finalizados aún</td>
            <td>0</td>
            <td>0</td>
            <td class="col-pts">0</td>
          </tr>
        `;
      } else {
        standingsBodyEl.innerHTML = filas
          .slice(0, 6)
          .map(
            (fila, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${escaparTexto(fila.club)}</td>
                <td>${fila.pj}</td>
                <td>${fila.dif > 0 ? `+${fila.dif}` : fila.dif}</td>
                <td class="col-pts">${fila.pts}</td>
              </tr>
            `
          )
          .join("");
      }
    }

    if (noticesEl) {
      if (comunicados.length === 0) {
        noticesEl.innerHTML = `<p class="table-note" style="margin-top: 0;">Aún no hay comunicados publicados.</p>`;
      } else {
        noticesEl.innerHTML = comunicados
          .slice(0, 3)
          .map(
            (aviso) => `
              <article class="match-card">
                <div class="match-meta">
                  <span>${escaparTexto(aviso.fecha || "Oficial")}</span>
                  <span class="badge badge--programado">${escaparTexto(aviso.tipo || "Aviso")}</span>
                </div>
                <div class="match-team-row">
                  <span class="match-team-name">${escaparTexto(aviso.titulo)}</span>
                </div>
                <div class="match-quarters">${escaparTexto(aviso.mensaje)}</div>
              </article>
            `
          )
          .join("");
      }
    }
  }

  function iniciarFixture() {
    const containerEl = document.getElementById("fixtureMatchesContainer");
    const catSelect = document.getElementById("filterCategoria");
    const fechaSelect = document.getElementById("filterFecha");
    const estadoSelect = document.getElementById("filterEstado");
    const clubInput = document.getElementById("filterClub");
    const resetBtn = document.getElementById("resetFiltersBtn");

    if (!containerEl) return;

    poblarSelectCategorias(catSelect);
    poblarSelectFechas(fechaSelect);

    function actualizarFixture() {
      const cat = catSelect ? catSelect.value : "todas";
      const fecha = fechaSelect ? fechaSelect.value : "todas";
      const estado = estadoSelect ? estadoSelect.value : "todos";
      const busqueda = clubInput ? clubInput.value.trim().toLowerCase() : "";

      const filtrados = partidos.filter((p) => {
        if (cat !== "todas" && p.categoria !== cat) return false;
        if (fecha !== "todas" && p.fecha !== fecha) return false;
        if (estado !== "todos" && String(p.estado || "").toLowerCase() !== estado) return false;
        if (busqueda) {
          const textoEquipos = `${p.local || ""} ${p.visitante || ""}`.toLowerCase();
          if (!textoEquipos.includes(busqueda)) return false;
        }
        return true;
      });

      if (filtrados.length === 0) {
        containerEl.innerHTML = `
          <p class="table-note">
            No se encontraron partidos con los filtros seleccionados.
          </p>
        `;
        return;
      }

      containerEl.innerHTML = filtrados
        .map((p) => renderTarjetaPartido(p, true))
        .join("");
    }

    [catSelect, fechaSelect, estadoSelect, clubInput].forEach((el) => {
      if (el) {
        el.addEventListener("input", actualizarFixture);
        el.addEventListener("change", actualizarFixture);
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        setTimeout(actualizarFixture, 0);
      });
    }

    actualizarFixture();
  }

  function iniciarPosiciones() {
    const tbodyEl = document.getElementById("standingsTableBody");
    const catSelect = document.getElementById("standingsCategoria");
    const buscarInput = document.getElementById("standingsBuscar");

    if (!tbodyEl) return;

    poblarSelectCategorias(catSelect);

    function actualizarTabla() {
      const cat = catSelect ? catSelect.value : "todas";
      const busqueda = buscarInput ? buscarInput.value.trim().toLowerCase() : "";

      let filas = motor.calcularPosiciones(partidos, sanciones, cat);
      if (busqueda) {
        filas = filas.filter((f) => String(f.club || "").toLowerCase().includes(busqueda));
      }

      if (filas.length === 0) {
        tbodyEl.innerHTML = `
          <tr>
            <td>1</td>
            <td>Sin resultados para este filtro</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td class="col-pts">0</td>
          </tr>
        `;
        return;
      }

      tbodyEl.innerHTML = filas
        .map(
          (f, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${escaparTexto(f.club)}</strong></td>
              <td>${f.pj}</td>
              <td>${f.pg}</td>
              <td>${f.pp}</td>
              <td>${f.wo}</td>
              <td>${f.pf}</td>
              <td>${f.pc}</td>
              <td>${f.dif > 0 ? `+${f.dif}` : f.dif}</td>
              <td>${f.sanciones !== 0 ? f.sanciones : 0}</td>
              <td class="col-pts">${f.pts}</td>
            </tr>
          `
        )
        .join("");
    }

    if (catSelect) catSelect.addEventListener("change", actualizarTabla);
    if (buscarInput) buscarInput.addEventListener("input", actualizarTabla);

    actualizarTabla();
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarInicio();
    iniciarFixture();
    iniciarPosiciones();
  });
})();