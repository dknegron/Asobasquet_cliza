(function () {
  const almacen = window.ABMC_ALMACEN;
  const datos = almacen
    ? almacen.cargarEstado()
    : window.ABMC_DATOS || { partidos: [], sanciones: [], comunicados: [] };
  const partidos = Array.isArray(datos.partidos) ? datos.partidos : [];

  function escaparTexto(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function obtenerIdDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function infoEstado(estado) {
    const clave = String(estado || "programado").toLowerCase();
    const mapa = {
      programado: { clase: "badge--programado", texto: "Programado" },
      finalizado: { clase: "badge--finalizado", texto: "Finalizado" },
      wo: { clase: "badge--wo", texto: "W.O. (20 - 0)" },
      postergado: { clase: "badge--postergado", texto: "Postergado" }
    };
    return mapa[clave] || mapa.programado;
  }

  function parsearCuartosTexto(cuartosStr) {
    const resultado = {
      local: ["-", "-", "-", "-", "-"],
      visitante: ["-", "-", "-", "-", "-"]
    };

    if (!cuartosStr || typeof cuartosStr !== "string") {
      return resultado;
    }

    const segmentos = cuartosStr.split("·");
    segmentos.forEach((seg) => {
      const match = seg.match(/(C1|C2|C3|C4|PR[ÓO]RROGA|OT)\s*:\s*(\d+)\s*-\s*(\d+)/i);
      if (!match) return;

      const etiqueta = match[1].toUpperCase();
      const pLocal = match[2];
      const pVisit = match[3];

      let indice = -1;
      if (etiqueta === "C1") indice = 0;
      else if (etiqueta === "C2") indice = 1;
      else if (etiqueta === "C3") indice = 2;
      else if (etiqueta === "C4") indice = 3;
      else indice = 4;

      resultado.local[indice] = pLocal;
      resultado.visitante[indice] = pVisit;
    });

    return resultado;
  }

  function renderBoxscore(tbodyId, jugadores, nombreEquipo) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (!Array.isArray(jugadores) || jugadores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td>-</td>
          <td>Sin planilla detallada de jugadores para ${escaparTexto(nombreEquipo)}</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = jugadores
      .map(
        (j) => `
          <tr>
            <td>${escaparTexto(j.dorsal ?? "-")}</td>
            <td><strong>${escaparTexto(j.nombre ?? "Jugador")}</strong></td>
            <td class="col-pts">${escaparTexto(j.pts ?? 0)}</td>
            <td>${escaparTexto(j.fp ?? 0)}</td>
            <td>${escaparTexto(j.ftfd ?? 0)}</td>
          </tr>
        `
      )
      .join("");
  }

  function iniciarPlanilla() {
    if (partidos.length === 0) return;

    const idBuscado = obtenerIdDesdeUrl();
    const partido =
      partidos.find((p) => String(p.id) === String(idBuscado)) || partidos[0];

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

    const tagEl = document.getElementById("matchCategoryTag");
    const h1El = document.getElementById("matchTitleHeading");
    const subEl = document.getElementById("matchSubtitleInfo");
    const badgeEl = document.getElementById("matchStatusBadge");
    const metaLeftEl = document.getElementById("matchMetaLeft");
    const metaRightEl = document.getElementById("matchMetaRight");
    const homeLabelEl = document.getElementById("homeTeamLabel");
    const awayLabelEl = document.getElementById("awayTeamLabel");
    const homeScoreEl = document.getElementById("homeTeamScore");
    const awayScoreEl = document.getElementById("awayTeamScore");
    const quartersBodyEl = document.getElementById("quartersTableBody");
    const notesEl = document.getElementById("matchNotesText");
    const titleLocalEl = document.getElementById("tituloPlanillaLocal");
    const titleVisitanteEl = document.getElementById("tituloPlanillaVisitante");

    if (tagEl) tagEl.textContent = `${partido.categoria || "Categoría"} · ${partido.fecha || "Fecha"}`;
    if (h1El) h1El.textContent = `${partido.local || "Local"} vs ${partido.visitante || "Visitante"}`;
    if (subEl) {
      subEl.textContent = idBuscado
        ? `Detalle oficial del encuentro (${partido.fecha || ""} · ${partido.hora || ""}) en ${partido.coliseo || "Coliseo Municipal de Cliza"}.`
        : `Mostrando encuentro de referencia (${partido.local} vs ${partido.visitante}). Selecciona otro partido desde Fixture para ver su planilla.`;
    }

    if (badgeEl) {
      const info = infoEstado(estado);
      badgeEl.className = `badge ${info.clase}`;
      badgeEl.textContent = info.texto;
    }

    if (metaLeftEl) {
      metaLeftEl.textContent = `${partido.categoria || "Categoría"} · ${partido.fecha || "Fecha"} · ${partido.hora || ""}`;
    }
    if (metaRightEl) {
      metaRightEl.textContent = partido.coliseo || "Coliseo Municipal de Cliza";
    }

    if (homeLabelEl) homeLabelEl.textContent = partido.local || "Club Local";
    if (awayLabelEl) awayLabelEl.textContent = partido.visitante || "Club Visitante";
    if (homeScoreEl) homeScoreEl.textContent = String(ptsLocal);
    if (awayScoreEl) awayScoreEl.textContent = String(ptsVisitante);

    if (titleLocalEl) titleLocalEl.textContent = `Planilla · ${partido.local || "Local"}`;
    if (titleVisitanteEl) titleVisitanteEl.textContent = `Planilla · ${partido.visitante || "Visitante"}`;

    if (quartersBodyEl) {
      const parciales = parsearCuartosTexto(partido.cuartos);
      quartersBodyEl.innerHTML = `
        <tr>
          <td><strong>${escaparTexto(partido.local || "Local")}</strong></td>
          <td>${escaparTexto(parciales.local[0])}</td>
          <td>${escaparTexto(parciales.local[1])}</td>
          <td>${escaparTexto(parciales.local[2])}</td>
          <td>${escaparTexto(parciales.local[3])}</td>
          <td>${escaparTexto(parciales.local[4])}</td>
          <td class="col-pts">${escaparTexto(ptsLocal)}</td>
        </tr>
        <tr>
          <td><strong>${escaparTexto(partido.visitante || "Visitante")}</strong></td>
          <td>${escaparTexto(parciales.visitante[0])}</td>
          <td>${escaparTexto(parciales.visitante[1])}</td>
          <td>${escaparTexto(parciales.visitante[2])}</td>
          <td>${escaparTexto(parciales.visitante[3])}</td>
          <td>${escaparTexto(parciales.visitante[4])}</td>
          <td class="col-pts">${escaparTexto(ptsVisitante)}</td>
        </tr>
      `;
    }

    renderBoxscore("homeBoxscoreBody", partido.jugadoresLocal, partido.local || "Local");
    renderBoxscore("awayBoxscoreBody", partido.jugadoresVisitante, partido.visitante || "Visitante");

    if (notesEl) {
      const textoCuartos = partido.cuartos ? `Parciales / Detalle: ${partido.cuartos}. ` : "";
      const textoObs = partido.observaciones || "Sin observaciones adicionales registradas.";
      notesEl.textContent = `${textoCuartos}${textoObs}`;
    }
  }

  document.addEventListener("DOMContentLoaded", iniciarPlanilla);
})();