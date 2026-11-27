(function (global) {
  const CLAVE_STORAGE = "ABMC_CLIZA_LIGA_V1";
  const CLAVE_CATALOGO = "ABMC_CLUBES_CATALOGO";
  const baseInicial = global.ABMC_DATOS || {
    partidos: [],
    sanciones: [],
    comunicados: []
  };

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let memoria = null; // respaldo en memoria si el navegador bloquea localStorage

  function cargarEstado() {
    try {
      const crudo = global.localStorage.getItem(CLAVE_STORAGE);
      if (!crudo) {
        const inicial = clonar(baseInicial);
        memoria = inicial;
        global.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(inicial));
        return inicial;
      }
      const parseado = JSON.parse(crudo);
      const limpio = {
        partidos: Array.isArray(parseado.partidos) ? parseado.partidos : [],
        sanciones: Array.isArray(parseado.sanciones) ? parseado.sanciones : [],
        comunicados: Array.isArray(parseado.comunicados) ? parseado.comunicados : []
      };
      memoria = limpio;
      return limpio;
    } catch (err) {
      if (memoria) return memoria;
      memoria = clonar(baseInicial);
      return memoria;
    }
  }

  function hayAlmacenamiento() {
    try {
      const clave = "__abmc_probe__";
      global.localStorage.setItem(clave, "1");
      global.localStorage.removeItem(clave);
      return true;
    } catch (err) {
      return false;
    }
  }

  function guardarEstado(estado) {
    memoria = estado;
    try {
      global.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
    } catch (err) {
      // Navegador sin permiso de almacenamiento (modo privado o cuota llena):
      // el cambio sigue vivo en memoria durante la sesión.
    }
    return estado;
  }

  function normalizarPartido(datosPartido, idExistente) {
    const esWO = String(datosPartido.estado || "").toLowerCase() === "wo";
    const woGanador = datosPartido.woGanador || "local";

    let ptsLocal =
      datosPartido.ptsLocal === "" || datosPartido.ptsLocal === null || datosPartido.ptsLocal === undefined
        ? null
        : Number(datosPartido.ptsLocal);
    let ptsVisitante =
      datosPartido.ptsVisitante === "" || datosPartido.ptsVisitante === null || datosPartido.ptsVisitante === undefined
        ? null
        : Number(datosPartido.ptsVisitante);

    if (esWO) {
      ptsLocal = woGanador === "visitante" ? 0 : 20;
      ptsVisitante = woGanador === "visitante" ? 20 : 0;
    }

    return {
      id: idExistente || datosPartido.id || `p-${Date.now()}`,
      categoria: (datosPartido.categoria || "Primera de Honor").trim(),
      fecha: (datosPartido.fecha || "Fecha 1").trim(),
      hora: (datosPartido.hora || "19:00").trim(),
      coliseo: (datosPartido.coliseo || "Coliseo Municipal de Cliza").trim(),
      estado: (datosPartido.estado || "programado").toLowerCase(),
      local: (datosPartido.local || "Club Local").trim(),
      visitante: (datosPartido.visitante || "Club Visitante").trim(),
      ptsLocal: ptsLocal,
      ptsVisitante: ptsVisitante,
      woGanador: esWO ? woGanador : null,
      cuartos:
        (datosPartido.cuartos || "").trim() ||
        (esWO ? "W.O. reglamentario (marcador oficial 20 - 0)" : "C1: - · C2: - · C3: - · C4: -"),
      observaciones: (datosPartido.observaciones || "").trim()
    };
  }

  function agregarPartido(nuevoPartido) {
    const estado = cargarEstado();
    const registro = normalizarPartido(nuevoPartido, nuevoPartido.id);
    estado.partidos.unshift(registro);
    guardarEstado(estado);
    return registro;
  }

  function actualizarPartido(idPartido, cambios) {
    const estado = cargarEstado();
    const indice = estado.partidos.findIndex((p) => String(p.id) === String(idPartido));
    if (indice === -1) return null;

    const previo = estado.partidos[indice];
    const actualizado = normalizarPartido({ ...previo, ...cambios }, previo.id);
    estado.partidos[indice] = actualizado;
    guardarEstado(estado);
    return actualizado;
  }

  function eliminarPartido(idPartido) {
    const estado = cargarEstado();
    const filtrados = estado.partidos.filter((p) => String(p.id) !== String(idPartido));
    if (filtrados.length === estado.partidos.length) return false;
    estado.partidos = filtrados;
    guardarEstado(estado);
    return true;
  }

  function eliminarSancion(idSancion) {
    const estado = cargarEstado();
    const lista = Array.isArray(estado.sanciones) ? estado.sanciones : [];
    const filtradas = lista.filter((s) => String(s.id) !== String(idSancion));
    if (filtradas.length === lista.length) return false;
    estado.sanciones = filtradas;
    guardarEstado(estado);
    return true;
  }

  function agregarSancion(nuevaSancion) {
    const estado = cargarEstado();
    const registro = {
      id: nuevaSancion.id || `s-${Date.now()}`,
      club: (nuevaSancion.club || "").trim(),
      categoria: (nuevaSancion.categoria || "Primera de Honor").trim(),
      ajustePuntos: Number(nuevaSancion.ajustePuntos ?? 0),
      detalle: (nuevaSancion.detalle || "Resolución del tribunal de disciplina.").trim()
    };

    estado.sanciones.unshift(registro);
    guardarEstado(estado);
    return registro;
  }

  function agregarComunicado(nuevoComunicado) {
    const estado = cargarEstado();
    const registro = {
      id: nuevoComunicado.id || `c-${Date.now()}`,
      titulo: (nuevoComunicado.titulo || "").trim(),
      tipo: (nuevoComunicado.tipo || "circular").trim(),
      fecha: nuevoComunicado.fecha || "Actualizado hoy",
      mensaje: (nuevoComunicado.mensaje || "").trim()
    };

    estado.comunicados.unshift(registro);
    guardarEstado(estado);
    return registro;
  }

  function actualizarComunicado(idComunicado, cambios) {
    const estado = cargarEstado();
    const indice = estado.comunicados.findIndex((c) => String(c.id) === String(idComunicado));
    if (indice === -1) return null;

    const previo = estado.comunicados[indice];
    const actualizado = {
      ...previo,
      titulo: (cambios.titulo ?? previo.titulo).trim(),
      tipo: (cambios.tipo ?? previo.tipo).trim(),
      fecha: cambios.fecha || previo.fecha || "Actualizado hoy",
      mensaje: (cambios.mensaje ?? previo.mensaje).trim()
    };
    estado.comunicados[indice] = actualizado;
    guardarEstado(estado);
    return actualizado;
  }

  function eliminarComunicado(idComunicado) {
    const estado = cargarEstado();
    const filtrados = estado.comunicados.filter((c) => String(c.id) !== String(idComunicado));
    if (filtrados.length === estado.comunicados.length) return false;
    estado.comunicados = filtrados;
    guardarEstado(estado);
    return true;
  }

  function restaurarEjemplo() {
    const inicial = clonar(baseInicial);
    try {
      global.localStorage.removeItem(CLAVE_CATALOGO);
    } catch (err) {}
    return guardarEstado(inicial);
  }

  /* ---------------------------------------------------------------- catálogo de clubes */

  function clubesDefecto() {
    return Array.isArray(global.ABMC_DATOS && global.ABMC_DATOS.clubes)
      ? global.ABMC_DATOS.clubes
      : [];
  }

  function normalizarNombreClub(valor) {
    return String(valor || "").trim().toLowerCase();
  }

  function cargarCatalogoClubes() {
    try {
      const crudo = global.localStorage.getItem(CLAVE_CATALOGO);
      if (!crudo) return clubesDefecto();
      const parseado = JSON.parse(crudo);
      if (!Array.isArray(parseado)) return clubesDefecto();
      return parseado
        .map((c) => ({
          id: (c.id || "").trim(),
          nombre: (c.nombre || "").trim(),
          categoria: (c.categoria || "").trim(),
          slug: (c.slug || "").trim(),
          fotos: Array.isArray(c.fotos) ? c.fotos : null
        }))
        .filter((c) => c.nombre);
    } catch (err) {
      return clubesDefecto();
    }
  }

  function guardarCatalogoClubes(lista) {
    const ordenada = Array.from(lista).sort((a, b) =>
      normalizarNombreClub(a.nombre).localeCompare(normalizarNombreClub(b.nombre), "es")
    );
    try {
      global.localStorage.setItem(CLAVE_CATALOGO, JSON.stringify(ordenada));
    } catch (err) {}
    return ordenada;
  }

  function fotosDeClub(club) {
    if (!club) return [];
    if (Array.isArray(club.fotos) && club.fotos.length > 0) return club.fotos;
    if (!club.slug) return [];
    return [1, 2, 3].map((n) => "assetsimgclubes/" + club.slug + "-" + n + ".svg");
  }

  function fallbackUrl(nombre) {
    const texto = String(nombre || "Sin foto")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">' +
      '<rect width="300" height="420" fill="#FFFFFF"/>' +
      '<rect x="8" y="8" width="284" height="404" fill="none" stroke="#0A0A0A" stroke-opacity="0.16" stroke-width="2"/>' +
      '<text x="150" y="192" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0A0A0A">' + texto + "</text>" +
      '<text x="150" y="248" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="16" letter-spacing="3" fill="#FF2A2A">SIN FOTO</text>' +
      '<text x="150" y="348" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" letter-spacing="2" fill="#0A0A0A" fill-opacity="0.6">ASOCIACIÓN MUNICIPAL DE BASQUETBOL CLIZA</text>' +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function agregarClubAlCatalogo(datos) {
    const nombre = (datos && datos.nombre || "").trim();
    if (!nombre) return null;
    const lista = cargarCatalogoClubes();
    const yaExiste = lista.some(
      (c) => normalizarNombreClub(c.nombre) === normalizarNombreClub(nombre)
    );
    if (yaExiste) return null;
    lista.push({
      id: (datos.id || "").trim() || ("cat-" + Date.now()),
      nombre: nombre,
      categoria: (datos.categoria || "").trim(),
      slug: (datos.slug || "").trim(),
      fotos: Array.isArray(datos.fotos) ? datos.fotos : null
    });
    return guardarCatalogoClubes(lista);
  }

  function editarClubDelCatalogo(nombreOriginal, datos) {
    const lista = cargarCatalogoClubes();
    const indice = lista.findIndex(
      (c) => normalizarNombreClub(c.nombre) === normalizarNombreClub(nombreOriginal)
    );
    if (indice === -1) return null;
    const nombre = (datos && datos.nombre || "").trim();
    if (!nombre) return null;
    const previo = lista[indice];
    lista[indice] = {
      id: (datos.id || previo.id || "").trim() || ("cat-" + Date.now()),
      nombre: nombre,
      categoria: (datos && datos.categoria || "").trim(),
      slug: (datos && datos.slug || "").trim(),
      fotos: (datos && Array.isArray(datos.fotos)) ? datos.fotos : null
    };
    return guardarCatalogoClubes(lista);
  }

  function eliminarClubDelCatalogo(nombre) {
    const lista = cargarCatalogoClubes();
    const filtrada = lista.filter(
      (c) => normalizarNombreClub(c.nombre) !== normalizarNombreClub(nombre)
    );
    if (filtrada.length === lista.length) return false;
    guardarCatalogoClubes(filtrada);
    return true;
  }

  global.ABMC_ALMACEN = {
    cargarEstado: cargarEstado,
    guardarEstado: guardarEstado,
    hayAlmacenamiento: hayAlmacenamiento,
    agregarPartido: agregarPartido,
    actualizarPartido: actualizarPartido,
    eliminarPartido: eliminarPartido,
    eliminarSancion: eliminarSancion,
    agregarSancion: agregarSancion,
    agregarComunicado: agregarComunicado,
    actualizarComunicado: actualizarComunicado,
    eliminarComunicado: eliminarComunicado,
    restaurarEjemplo: restaurarEjemplo,
    cargarCatalogoClubes: cargarCatalogoClubes,
    guardarCatalogoClubes: guardarCatalogoClubes,
    fotosDeClub: fotosDeClub,
    fallbackUrl: fallbackUrl,
    agregarClubAlCatalogo: agregarClubAlCatalogo,
    editarClubDelCatalogo: editarClubDelCatalogo,
    eliminarClubDelCatalogo: eliminarClubDelCatalogo
  };
})(window);