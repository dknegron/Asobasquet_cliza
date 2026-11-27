(function () {
  const almacen = window.ABMC_ALMACEN;
  const datos = almacen
    ? almacen.cargarEstado()
    : window.ABMC_DATOS || { partidos: [], sanciones: [], comunicados: [] };

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

  const catalogoClubes = (almacen && typeof almacen.cargarCatalogoClubes === "function")
    ? almacen.cargarCatalogoClubes()
    : (Array.isArray(window.ABMC_DATOS && window.ABMC_DATOS.clubes) ? window.ABMC_DATOS.clubes : []);

  function claveClub(nombre) {
    return String(nombre || "").trim().toLowerCase();
  }

  function fotosDelClub(club) {
    if (almacen && typeof almacen.fotosDeClub === "function") {
      return almacen.fotosDeClub(club);
    }
    if (Array.isArray(club.fotos) && club.fotos.length > 0) return club.fotos;
    if (!club.slug) return [];
    return [1, 2, 3].map((n) => `assetsimgclubes/${club.slug}-${n}.svg`);
  }

  function fallbackUrl(nombre) {
    if (almacen && typeof almacen.fallbackUrl === "function") {
      return almacen.fallbackUrl(nombre);
    }
    return "";
  }

  function obtenerClubesDesdeDatos() {
    const mapaClubes = new Map();

    function asegurarClub(nombre, categoria) {
      const nombreLimpio = String(nombre || "").trim();
      if (!nombreLimpio) return null;

      const clave = claveClub(nombreLimpio);
      if (!mapaClubes.has(clave)) {
        mapaClubes.set(clave, {
          nombre: nombreLimpio,
          categorias: new Set(),
          partidosRegistrados: 0,
          sanciones: 0,
          slug: "",
          fotos: null
        });
      }

      const club = mapaClubes.get(clave);
      if (categoria) club.categorias.add(String(categoria).trim());
      return club;
    }

    // 1) Catálogo oficial de clubes afiliados (aparecen siempre)
    catalogoClubes.forEach((registro) => {
      const club = asegurarClub(registro.nombre, registro.categoria);
      if (!club) return;
      club.slug = registro.slug || "";
      if (Array.isArray(registro.fotos)) club.fotos = registro.fotos;
    });

    // 2) Clubes que aparecen en el fixture y en las sanciones
    partidos.forEach((p) => {
      const local = asegurarClub(p.local, p.categoria);
      if (local) local.partidosRegistrados += 1;
      const visitante = asegurarClub(p.visitante, p.categoria);
      if (visitante) visitante.partidosRegistrados += 1;
    });

    sanciones.forEach((s) => {
      const club = asegurarClub(s.club, s.categoria);
      if (club) club.sanciones += Number(s.ajustePuntos ?? 0);
    });

    return Array.from(mapaClubes.values())
      .map((c) => ({
        nombre: c.nombre,
        categorias: Array.from(c.categorias).sort((a, b) => a.localeCompare(b, "es")),
        partidosRegistrados: c.partidosRegistrados,
        sanciones: c.sanciones,
        slug: c.slug,
        fotos: c.fotos
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  function poblarCategoriasClubes(selectEl, listaClubes) {
    if (!selectEl) return;

    const categoriasSet = new Set();
    listaClubes.forEach((club) => {
      club.categorias.forEach((cat) => categoriasSet.add(cat));
    });

    const categorias = Array.from(categoriasSet).sort((a, b) => a.localeCompare(b, "es"));
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

  /* ---------- Carrusel de fotos de cada club ---------- */

  function htmlCarrusel(club) {
    const fotos = fotosDelClub(club);
    if (fotos.length === 0) return "";

    const nombre = escaparTexto(club.nombre);

    const diapositivas = fotos
      .map(
        (src, i) => `
              <figure class="carrusel-diapositiva">
                <img src="${escaparTexto(src)}" data-club="${escaparTexto(nombre)}" alt="${nombre} · foto ${i + 1} de ${fotos.length}" />
              </figure>`
      )
      .join("");

    const puntos = fotos
      .map(
        (_, i) => `
              <button type="button" class="carrusel-punto${i === 0 ? " is-activo" : ""}" data-carrusel-punto="${i}" aria-label="Ir a la foto ${i + 1} de ${fotos.length}"></button>`
      )
      .join("");

    return `
            <div class="carrusel" data-carrusel tabindex="0" role="group" aria-roledescription="carrusel" aria-label="Fotos de ${nombre}">
              <div class="carrusel-pista">${diapositivas}</div>
              <button type="button" class="carrusel-btn carrusel-btn--anterior" data-carrusel-anterior aria-label="Foto anterior de ${nombre}">‹</button>
              <button type="button" class="carrusel-btn carrusel-btn--siguiente" data-carrusel-siguiente aria-label="Foto siguiente de ${nombre}">›</button>
              <div class="carrusel-puntos">${puntos}</div>
              <span class="carrusel-contador" data-carrusel-contador>1 / ${fotos.length}</span>
            </div>`;
  }

  let observadoresCarrusel = [];
  let intervalosCarrusel = [];

  function liberarCarruseles() {
    intervalosCarrusel.forEach((id) => clearInterval(id));
    intervalosCarrusel = [];
    observadoresCarrusel.forEach((obs) => obs.disconnect());
    observadoresCarrusel = [];
  }

  function iniciarCarrusel(raiz) {
    const pista = raiz.querySelector(".carrusel-pista");
    const puntos = Array.from(raiz.querySelectorAll("[data-carrusel-punto]"));
    const contador = raiz.querySelector("[data-carrusel-contador]");
    const total = puntos.length;
    if (!pista || total === 0) return;

    let posicion = 0;
    let visible = false;
    let suspendido = false;
    let intervalo = null;

    function mostrar(nueva) {
      posicion = (nueva + total) % total;
      pista.style.transform = `translateX(-${posicion * 100}%)`;
      puntos.forEach((punto, i) => punto.classList.toggle("is-activo", i === posicion));
      if (contador) contador.textContent = `${posicion + 1} / ${total}`;
      raiz.setAttribute("data-indice", String(posicion));
    }

    function parar() {
      if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
      }
    }

    function arrancar() {
      if (intervalo || !visible || suspendido || total < 2) return;
      intervalo = setInterval(() => mostrar(posicion + 1), 5000);
      intervalosCarrusel.push(intervalo);
    }

    const anterior = raiz.querySelector("[data-carrusel-anterior]");
    const siguiente = raiz.querySelector("[data-carrusel-siguiente]");
    if (anterior) anterior.addEventListener("click", () => mostrar(posicion - 1));
    if (siguiente) siguiente.addEventListener("click", () => mostrar(posicion + 1));

    puntos.forEach((punto, i) => punto.addEventListener("click", () => mostrar(i)));

    raiz.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        mostrar(posicion - 1);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        mostrar(posicion + 1);
      }
    });

    let toqueX = null;
    raiz.addEventListener(
      "touchstart",
      (ev) => {
        toqueX = ev.changedTouches[0].clientX;
      },
      { passive: true }
    );
    raiz.addEventListener(
      "touchend",
      (ev) => {
        if (toqueX === null) return;
        const delta = ev.changedTouches[0].clientX - toqueX;
        toqueX = null;
        if (Math.abs(delta) < 40) return;
        mostrar(delta > 0 ? posicion - 1 : posicion + 1);
      },
      { passive: true }
    );

    raiz.addEventListener("mouseenter", () => {
      suspendido = true;
      parar();
    });
    raiz.addEventListener("mouseleave", () => {
      suspendido = false;
      arrancar();
    });
    raiz.addEventListener("focusin", () => {
      suspendido = true;
      parar();
    });
    raiz.addEventListener("focusout", () => {
      suspendido = false;
      arrancar();
    });

    if ("IntersectionObserver" in window) {
      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            visible = entrada.isIntersecting;
            if (visible) arrancar();
            else parar();
          });
        },
        { threshold: 0.35 }
      );
      observador.observe(raiz);
      observadoresCarrusel.push(observador);
    }

    function enVista(el) {
      const rect = el.getBoundingClientRect();
      return rect.bottom > -120 && rect.top < window.innerHeight + 120;
    }

    visible = visible || enVista(raiz);
    arrancar();

    mostrar(0);
  }

  function iniciarCarruseles() {
    document.querySelectorAll("[data-carrusel]").forEach(iniciarCarrusel);
  }

  function iniciarClubes() {
    const gridEl = document.getElementById("clubsGridContainer");
    const badgeEl = document.getElementById("clubsCountBadge");
    const searchInput = document.getElementById("clubSearchInput");
    const catSelect = document.getElementById("clubCategoriaSelect");
    const noticesEl = document.getElementById("noticesListContainer");

    const todosLosClubes = obtenerClubesDesdeDatos();
    poblarCategoriasClubes(catSelect, todosLosClubes);

    function renderizarClubes() {
      if (!gridEl) return;

      const texto = searchInput ? searchInput.value.trim().toLowerCase() : "";
      const cat = catSelect ? catSelect.value : "todas";

      const filtrados = todosLosClubes.filter((club) => {
        if (cat !== "todas" && !club.categorias.includes(cat)) return false;
        if (texto) {
          const coincideNombre = club.nombre.toLowerCase().includes(texto);
          const coincideCat = club.categorias.some((c) => c.toLowerCase().includes(texto));
          if (!coincideNombre && !coincideCat) return false;
        }
        return true;
      });

      if (badgeEl) {
        badgeEl.textContent = `${filtrados.length} ${filtrados.length === 1 ? "club" : "clubes"}`;
      }

      if (filtrados.length === 0) {
        liberarCarruseles();
        gridEl.innerHTML = `
          <p class="table-note" style="margin-top: 0;">
            No se encontraron clubes afiliados con ese criterio de búsqueda.
          </p>
        `;
        return;
      }

      liberarCarruseles();
      gridEl.innerHTML = filtrados
        .map((club) => {
          const catsTexto =
            club.categorias.length > 0 ? club.categorias.join(" · ") : "Categoría por asignar";
          const sancionBadge =
            club.sanciones !== 0
              ? `<span class="badge badge--wo">Sanción: ${club.sanciones} pts</span>`
              : `<span class="badge badge--finalizado">Habilitado</span>`;

          return `
            <article class="match-card club-card">
              ${htmlCarrusel(club)}
              <div class="match-meta">
                <span>Afiliación Activa · Cliza</span>
                ${sancionBadge}
              </div>
              <div class="match-team-row">
                <span class="match-team-name">${escaparTexto(club.nombre)}</span>
              </div>
              <div class="match-quarters">
                Categorías: ${escaparTexto(catsTexto)} · Encuentros en fixture: ${club.partidosRegistrados}
              </div>
              <div class="match-footer">
                <span>Cliza</span>
                <a href="posiciones.html" class="btn btn-dark btn-sm">Ver en Posiciones</a>
              </div>
            </article>
          `;
        })
        .join("");

      iniciarCarruseles();

      // Si una foto del catálogo no existe (al editar el catálogo sin cargar fotos),
      // se muestra la imagen de "Sin foto".
      document.querySelectorAll("[data-carrusel] img[data-club]").forEach((img) => {
        const club = img.getAttribute("data-club");
        const urlFallback = fallbackUrl(club);
        if (!urlFallback) return;
        img.addEventListener("error", function () {
          this.src = urlFallback;
        });
      });
    }

    function renderizarComunicados() {
      if (!noticesEl) return;

      if (comunicados.length === 0) {
        noticesEl.innerHTML = `
          <article class="match-card">
            <div class="match-meta">
              <span>Circular · Cliza</span>
              <span class="badge badge--postergado">Aviso</span>
            </div>
            <div class="match-team-row">
              <span class="match-team-name">Sin comunicados publicados todavía</span>
            </div>
            <div class="match-quarters">
              Los avisos publicados desde Administración aparecerán aquí automáticamente.
            </div>
          </article>
        `;
        return;
      }

      noticesEl.innerHTML = comunicados
        .map(
          (aviso) => `
            <article class="match-card">
              <div class="match-meta">
                <span>${escaparTexto(aviso.fecha || "Oficial")} · Cliza</span>
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

    if (searchInput) searchInput.addEventListener("input", renderizarClubes);
    if (catSelect) catSelect.addEventListener("change", renderizarClubes);

    renderizarClubes();
    renderizarComunicados();
  }

  document.addEventListener("DOMContentLoaded", iniciarClubes);
})();