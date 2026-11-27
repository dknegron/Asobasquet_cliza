(function (global) {
  const PUNTOS_VICTORIA = 2;
  const PUNTOS_DERROTA = 1;
  const PUNTOS_WO = 0;
  const MARCADOR_WO = 20;

  function asegurarEstructuraClub(mapa, nombreClub, categoria) {
    const clave = `${categoria}::${nombreClub}`;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        club: nombreClub,
        categoria: categoria,
        pj: 0,
        pg: 0,
        pp: 0,
        wo: 0,
        pf: 0,
        pc: 0,
        dif: 0,
        sanciones: 0,
        pts: 0
      });
    }
    return mapa.get(clave);
  }

  function calcularPosiciones(partidos, sanciones, categoriaFiltro) {
    const tablaMapa = new Map();
    const listaPartidos = Array.isArray(partidos) ? partidos : [];
    const listaSanciones = Array.isArray(sanciones) ? sanciones : [];

    listaPartidos.forEach((partido) => {
      if (!partido) return;
      if (
        categoriaFiltro &&
        categoriaFiltro !== "todas" &&
        partido.categoria !== categoriaFiltro
      ) {
        return;
      }

      const estado = String(partido.estado || "").toLowerCase();
      if (estado !== "finalizado" && estado !== "wo") {
        return;
      }

      const local = asegurarEstructuraClub(tablaMapa, partido.local, partido.categoria);
      const visitante = asegurarEstructuraClub(tablaMapa, partido.visitante, partido.categoria);

      if (estado === "wo") {
        const ganadorEsLocal = partido.woGanador !== "visitante";
        const clubGanador = ganadorEsLocal ? local : visitante;
        const clubPerdedor = ganadorEsLocal ? visitante : local;

        local.pj += 1;
        visitante.pj += 1;

        clubGanador.pg += 1;
        clubGanador.pf += MARCADOR_WO;
        clubGanador.pc += 0;
        clubGanador.pts += PUNTOS_VICTORIA;

        clubPerdedor.pp += 1;
        clubPerdedor.wo += 1;
        clubPerdedor.pf += 0;
        clubPerdedor.pc += MARCADOR_WO;
        clubPerdedor.pts += PUNTOS_WO;
        return;
      }

      const ptsLocalBruto = partido.ptsLocal;
      const ptsVisitanteBruto = partido.ptsVisitante;
      const hayMarcador =
        ptsLocalBruto !== null &&
        ptsLocalBruto !== undefined &&
        ptsLocalBruto !== "" &&
        ptsVisitanteBruto !== null &&
        ptsVisitanteBruto !== undefined &&
        ptsVisitanteBruto !== "";

      // Un partido "finalizado" sin marcador cargado no se contabiliza
      // (si no, quedaría como victoria local 0 - 0).
      if (!hayMarcador) {
        return;
      }

      const ptsLocal = Number(ptsLocalBruto);
      const ptsVisitante = Number(ptsVisitanteBruto);
      if (!Number.isFinite(ptsLocal) || !Number.isFinite(ptsVisitante)) {
        return;
      }

      local.pj += 1;
      visitante.pj += 1;

      local.pf += ptsLocal;
      local.pc += ptsVisitante;
      visitante.pf += ptsVisitante;
      visitante.pc += ptsLocal;

      if (ptsLocal >= ptsVisitante) {
        local.pg += 1;
        local.pts += PUNTOS_VICTORIA;
        visitante.pp += 1;
        visitante.pts += PUNTOS_DERROTA;
      } else {
        visitante.pg += 1;
        visitante.pts += PUNTOS_VICTORIA;
        local.pp += 1;
        local.pts += PUNTOS_DERROTA;
      }
    });

    listaSanciones.forEach((sancion) => {
      if (!sancion) return;
      if (
        categoriaFiltro &&
        categoriaFiltro !== "todas" &&
        sancion.categoria !== categoriaFiltro
      ) {
        return;
      }

      const nombreClub = String(sancion.club || "").trim();
      if (!nombreClub) return;

      const ajuste = Number(sancion.ajustePuntos ?? 0);
      if (!Number.isFinite(ajuste) || ajuste === 0) return;

      // Aunque el club todavía no haya jugado, la sanción debe verse en la tabla.
      const fila = asegurarEstructuraClub(
        tablaMapa,
        nombreClub,
        String(sancion.categoria || "").trim() || "Sin categoría"
      );
      fila.sanciones += ajuste;
      fila.pts += ajuste;
    });

    const filas = Array.from(tablaMapa.values()).map((fila) => {
      fila.dif = fila.pf - fila.pc;
      return fila;
    });

    filas.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      if (b.pf !== a.pf) return b.pf - a.pf;
      return a.club.localeCompare(b.club, "es");
    });

    return filas;
  }

  global.ABMC_MOTOR = {
    calcularPosiciones: calcularPosiciones
  };
})(window);