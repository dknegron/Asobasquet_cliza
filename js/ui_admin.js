(function () {
  const almacen = window.ABMC_ALMACEN;

  let editandoPartidoId = null;
  let editandoComunicadoId = null;

  function escaparTexto(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mostrarAviso(texto) {
    const statusEl = document.getElementById("adminAuthStatus");
    if (statusEl) {
      statusEl.textContent = texto;
    } else {
      alert(texto);
    }
  }

  function formatearEstado(estado) {
    const clave = String(estado || "programado").toLowerCase();
    const mapa = {
      programado: { clase: "badge--programado", texto: "Programado" },
      finalizado: { clase: "badge--finalizado", texto: "Finalizado" },
      wo: { clase: "badge--wo", texto: "W.O. (20 - 0)" },
      postergado: { clase: "badge--postergado", texto: "Postergado" }
    };
    return mapa[clave] || mapa.programado;
  }

  function iniciarAdmin() {
    if (!almacen) return;

    const resultForm = document.getElementById("resultForm");
    const sanctionForm = document.getElementById("sanctionForm");
    const noticeForm = document.getElementById("noticeForm");
    const authCard = document.getElementById("adminAuthCard");

    const matchesListEl = document.getElementById("adminMatchesList");
    const noticesListEl = document.getElementById("adminNoticesList");
    const matchesCountEl = document.getElementById("adminMatchesCount");
    const noticesCountEl = document.getElementById("adminNoticesCount");
    const sanctionsListEl = document.getElementById("adminSancionesList");
    const sanctionsCountEl = document.getElementById("adminSancionesCount");

    const resSubmitBtn = resultForm ? resultForm.querySelector('button[type="submit"]') : null;
    const comSubmitBtn = noticeForm ? noticeForm.querySelector('button[type="submit"]') : null;

    let cancelPartidoBtn = null;
    let cancelComunicadoBtn = null;

    if (resSubmitBtn && !document.getElementById("cancelEditPartidoBtn")) {
      cancelPartidoBtn = document.createElement("button");
      cancelPartidoBtn.type = "button";
      cancelPartidoBtn.id = "cancelEditPartidoBtn";
      cancelPartidoBtn.className = "btn btn-outline-dark";
      cancelPartidoBtn.style.marginLeft = "0.5rem";
      cancelPartidoBtn.style.display = "none";
      cancelPartidoBtn.textContent = "Cancelar Edición";
      resSubmitBtn.insertAdjacentElement("afterend", cancelPartidoBtn);
    }

    if (comSubmitBtn && !document.getElementById("cancelEditComunicadoBtn")) {
      cancelComunicadoBtn = document.createElement("button");
      cancelComunicadoBtn.type = "button";
      cancelComunicadoBtn.id = "cancelEditComunicadoBtn";
      cancelComunicadoBtn.className = "btn btn-outline-dark";
      cancelComunicadoBtn.style.marginLeft = "0.5rem";
      cancelComunicadoBtn.style.display = "none";
      cancelComunicadoBtn.textContent = "Cancelar Edición";
      comSubmitBtn.insertAdjacentElement("afterend", cancelComunicadoBtn);
    }

    if (authCard && !document.getElementById("resetDemoDataBtn")) {
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.id = "resetDemoDataBtn";
      resetBtn.className = "btn btn-outline-dark btn-sm";
      resetBtn.style.marginTop = "0.75rem";
      resetBtn.textContent = "Restaurar Datos de Ejemplo";
      resetBtn.addEventListener("click", function () {
        almacen.restaurarEjemplo();
        salirEdicionPartido();
        salirEdicionComunicado();
        renderizarTodo();
        mostrarAviso("Se restauraron los datos iniciales de ejemplo en el navegador.");
      });
      authCard.appendChild(resetBtn);
    }

    function salirEdicionPartido() {
      editandoPartidoId = null;
      if (resultForm) resultForm.reset();
      if (resSubmitBtn) resSubmitBtn.textContent = "Guardar Resultado";
      if (cancelPartidoBtn) cancelPartidoBtn.style.display = "none";
    }

    function salirEdicionComunicado() {
      editandoComunicadoId = null;
      if (noticeForm) noticeForm.reset();
      if (comSubmitBtn) comSubmitBtn.textContent = "Publicar Comunicado";
      if (cancelComunicadoBtn) cancelComunicadoBtn.style.display = "none";
    }

    function entrarEdicionPartido(partido) {
      editandoPartidoId = partido.id;
      if (document.getElementById("resCategoria")) {
        document.getElementById("resCategoria").value = partido.categoria || "";
      }
      if (document.getElementById("resFecha")) {
        document.getElementById("resFecha").value = partido.fecha || "";
      }
      if (document.getElementById("resEstado")) {
        document.getElementById("resEstado").value = partido.estado || "programado";
      }
      if (document.getElementById("resLocal")) {
        document.getElementById("resLocal").value = partido.local || "";
      }
      if (document.getElementById("resPtsLocal")) {
        document.getElementById("resPtsLocal").value =
          partido.ptsLocal === null || partido.ptsLocal === undefined ? "" : partido.ptsLocal;
      }
      if (document.getElementById("resVisitante")) {
        document.getElementById("resVisitante").value = partido.visitante || "";
      }
      if (document.getElementById("resPtsVisitante")) {
        document.getElementById("resPtsVisitante").value =
          partido.ptsVisitante === null || partido.ptsVisitante === undefined
            ? ""
            : partido.ptsVisitante;
      }
      if (document.getElementById("resCuartos")) {
        document.getElementById("resCuartos").value = partido.cuartos || "";
      }

      if (resSubmitBtn) resSubmitBtn.textContent = "Actualizar Partido";
      if (cancelPartidoBtn) cancelPartidoBtn.style.display = "inline-flex";
      if (resultForm) resultForm.scrollIntoView({ behavior: "smooth", block: "center" });
      mostrarAviso(`Editando partido: ${partido.local} vs ${partido.visitante}.`);
    }

    function entrarEdicionComunicado(aviso) {
      editandoComunicadoId = aviso.id;
      if (document.getElementById("comTitulo")) {
        document.getElementById("comTitulo").value = aviso.titulo || "";
      }
      if (document.getElementById("comTipo")) {
        document.getElementById("comTipo").value = aviso.tipo || "circular";
      }
      if (document.getElementById("comMensaje")) {
        document.getElementById("comMensaje").value = aviso.mensaje || "";
      }

      if (comSubmitBtn) comSubmitBtn.textContent = "Actualizar Comunicado";
      if (cancelComunicadoBtn) cancelComunicadoBtn.style.display = "inline-flex";
      if (noticeForm) noticeForm.scrollIntoView({ behavior: "smooth", block: "center" });
      mostrarAviso(`Editando comunicado: "${aviso.titulo}".`);
    }

    function renderizarPartidosAdmin() {
      if (!matchesListEl) return;
      const estado = almacen.cargarEstado();
      const partidos = Array.isArray(estado.partidos) ? estado.partidos : [];

      if (matchesCountEl) {
        matchesCountEl.textContent = String(partidos.length);
      }

      if (partidos.length === 0) {
        matchesListEl.innerHTML = `<p class="table-note" style="margin-top: 0;">No hay partidos cargados todavía.</p>`;
        return;
      }

      matchesListEl.innerHTML = partidos
        .map((p) => {
          const info = formatearEstado(p.estado);
          const tieneMarcador =
            String(p.estado || "").toLowerCase() === "finalizado" ||
            String(p.estado || "").toLowerCase() === "wo";
          const marcadorTexto = tieneMarcador
            ? `${p.ptsLocal ?? 0} - ${p.ptsVisitante ?? 0}`
            : "Sin marcador";

          return `
            <article class="match-card">
              <div class="match-meta">
                <span>${escaparTexto(p.categoria)} · ${escaparTexto(p.fecha)}</span>
                <span class="badge ${info.clase}">${info.texto}</span>
              </div>
              <div class="match-team-row">
                <span class="match-team-name">${escaparTexto(p.local)} vs ${escaparTexto(p.visitante)}</span>
                <span class="match-score">${escaparTexto(marcadorTexto)}</span>
              </div>
              <div class="match-footer">
                <span>${escaparTexto(p.cuartos || "")}</span>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline-dark btn-sm" data-accion="editar-partido" data-id="${escaparTexto(p.id)}">
                    Editar
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" data-accion="eliminar-partido" data-id="${escaparTexto(p.id)}">
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    function renderizarComunicadosAdmin() {
      if (!noticesListEl) return;
      const estado = almacen.cargarEstado();
      const comunicados = Array.isArray(estado.comunicados) ? estado.comunicados : [];

      if (noticesCountEl) {
        noticesCountEl.textContent = String(comunicados.length);
      }

      if (comunicados.length === 0) {
        noticesListEl.innerHTML = `<p class="table-note" style="margin-top: 0;">No hay comunicados publicados todavía.</p>`;
        return;
      }

      noticesListEl.innerHTML = comunicados
        .map(
          (c) => `
            <article class="match-card">
              <div class="match-meta">
                <span>${escaparTexto(c.fecha || "Oficial")}</span>
                <span class="badge badge--programado">${escaparTexto(c.tipo || "Aviso")}</span>
              </div>
              <div class="match-team-row">
                <span class="match-team-name">${escaparTexto(c.titulo)}</span>
              </div>
              <div class="match-quarters">${escaparTexto(c.mensaje)}</div>
              <div class="match-footer">
                <span>ID: ${escaparTexto(c.id)}</span>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline-dark btn-sm" data-accion="editar-comunicado" data-id="${escaparTexto(c.id)}">
                    Editar
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" data-accion="eliminar-comunicado" data-id="${escaparTexto(c.id)}">
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          `
        )
        .join("");
    }

    function avisoAlmacenamiento() {
      try {
        if (almacen.hayAlmacenamiento && !almacen.hayAlmacenamiento()) {
          return " Aviso: este navegador no permite guardar cambios (modo privado); solo se verán en esta sesión.";
        }
      } catch (err) {
        return "";
      }
      return "";
    }

    function renderizarSancionesAdmin() {
      if (!sanctionsListEl) return;
      const estado = almacen.cargarEstado();
      const sanciones = Array.isArray(estado.sanciones) ? estado.sanciones : [];

      if (sanctionsCountEl) {
        sanctionsCountEl.textContent = String(sanciones.length);
      }

      if (sanciones.length === 0) {
        sanctionsListEl.innerHTML = `<p class="table-note" style="margin-top: 0;">No hay sanciones registradas todavía.</p>`;
        return;
      }

      sanctionsListEl.innerHTML = sanciones
        .map((s) => {
          const puntos = Number(s.ajustePuntos ?? 0);
          const clase = puntos < 0 ? "badge--wo" : "badge--finalizado";
          return `
            <article class="match-card">
              <div class="match-meta">
                <span>${escaparTexto(s.categoria || "Sin categoría")}</span>
                <span class="badge ${clase}">${puntos >= 0 ? "+" : ""}${puntos} pts</span>
              </div>
              <div class="match-team-row">
                <span class="match-team-name">${escaparTexto(s.club)}</span>
              </div>
              <div class="match-quarters">${escaparTexto(s.detalle || "Resolución del tribunal de disciplina.")}</div>
              <div class="match-footer">
                <span>ID: ${escaparTexto(s.id)}</span>
                <button type="button" class="btn btn-primary btn-sm" data-accion="eliminar-sancion" data-id="${escaparTexto(s.id)}">
                  Eliminar
                </button>
              </div>
            </article>
          `;
        })
        .join("");
    }

    function renderizarTodo() {
      renderizarPartidosAdmin();
      renderizarComunicadosAdmin();
      renderizarSancionesAdmin();
    }

    if (cancelPartidoBtn) {
      cancelPartidoBtn.addEventListener("click", function () {
        salirEdicionPartido();
        mostrarAviso("Edición de partido cancelada.");
      });
    }

    if (cancelComunicadoBtn) {
      cancelComunicadoBtn.addEventListener("click", function () {
        salirEdicionComunicado();
        mostrarAviso("Edición de comunicado cancelada.");
      });
    }

    if (resultForm) {
      resultForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const estado = document.getElementById("resEstado")?.value || "programado";
        const local = document.getElementById("resLocal")?.value.trim();
        const visitante = document.getElementById("resVisitante")?.value.trim();

        if (!local || !visitante) {
          mostrarAviso("Completa al menos el Club Local y el Club Visitante antes de guardar.");
          return;
        }

        const ptsLocalVal = document.getElementById("resPtsLocal")?.value ?? "";
        const ptsVisitanteVal = document.getElementById("resPtsVisitante")?.value ?? "";

        if (estado === "finalizado" && (ptsLocalVal === "" || ptsVisitanteVal === "")) {
          mostrarAviso("Un partido finalizado necesita los puntos de ambos clubes antes de guardar.");
          return;
        }

        let woGanador = "local";
        if (estado === "wo" && Number(ptsVisitanteVal) > Number(ptsLocalVal)) {
          woGanador = "visitante";
        }

        const payload = {
          categoria: document.getElementById("resCategoria")?.value || "Primera de Honor",
          fecha: document.getElementById("resFecha")?.value || "Fecha 1",
          estado: estado,
          local: local,
          visitante: visitante,
          ptsLocal: ptsLocalVal === "" ? null : Number(ptsLocalVal),
          ptsVisitante: ptsVisitanteVal === "" ? null : Number(ptsVisitanteVal),
          woGanador: woGanador,
          cuartos: document.getElementById("resCuartos")?.value || ""
        };

        if (editandoPartidoId) {
          almacen.actualizarPartido(editandoPartidoId, payload);
          salirEdicionPartido();
          renderizarTodo();
          mostrarAviso(`Partido actualizado (${local} vs ${visitante}).${avisoAlmacenamiento()}`);
        } else {
          almacen.agregarPartido(payload);
          resultForm.reset();
          renderizarTodo();
          mostrarAviso(
            `Partido guardado (${local} vs ${visitante}). Ya está visible en Fixture, Posiciones e Inicio.${avisoAlmacenamiento()}`
          );
        }
      });
    }

    if (sanctionForm) {
      sanctionForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const club = document.getElementById("sancClub")?.value.trim();
        const categoria =
          document.getElementById("sancCategoria")?.value.trim() || "Primera de Honor";
        const puntos = Number(document.getElementById("sancPuntos")?.value ?? 0);
        const detalle = document.getElementById("sancDetalle")?.value.trim();

        if (!club) {
          mostrarAviso("Ingresa el nombre del club sancionado.");
          return;
        }

        almacen.agregarSancion({
          club: club,
          categoria: categoria,
          ajustePuntos: puntos,
          detalle: detalle || "Resolución del tribunal de disciplina."
        });

        sanctionForm.reset();
        renderizarTodo();
        mostrarAviso(
          `Sanción registrada para ${club} (${puntos >= 0 ? "+" : ""}${puntos} pts). Revisa la tabla de Posiciones.${avisoAlmacenamiento()}`
        );
      });
    }

    if (noticeForm) {
      noticeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const titulo = document.getElementById("comTitulo")?.value.trim();
        const tipo = document.getElementById("comTipo")?.value || "circular";
        const mensaje = document.getElementById("comMensaje")?.value.trim();

        if (!titulo || !mensaje) {
          mostrarAviso("Completa el título y el detalle del comunicado.");
          return;
        }

        if (editandoComunicadoId) {
          almacen.actualizarComunicado(editandoComunicadoId, {
            titulo: titulo,
            tipo: tipo,
            mensaje: mensaje
          });
          salirEdicionComunicado();
          renderizarTodo();
          mostrarAviso(`Comunicado "${titulo}" actualizado.${avisoAlmacenamiento()}`);
        } else {
          almacen.agregarComunicado({
            titulo: titulo,
            tipo: tipo,
            mensaje: mensaje
          });
          noticeForm.reset();
          renderizarTodo();
          mostrarAviso(`Comunicado "${titulo}" publicado en Inicio y Clubes.${avisoAlmacenamiento()}`);
        }
      });
    }

    if (matchesListEl) {
      matchesListEl.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-accion]");
        if (!btn) return;
        const accion = btn.getAttribute("data-accion");
        const id = btn.getAttribute("data-id");
        const estadoActual = almacen.cargarEstado();

        if (accion === "editar-partido") {
          const partido = estadoActual.partidos.find((p) => String(p.id) === String(id));
          if (partido) entrarEdicionPartido(partido);
        } else if (accion === "eliminar-partido") {
          const partido = estadoActual.partidos.find((p) => String(p.id) === String(id));
          const nombre = partido ? `${partido.local} vs ${partido.visitante}` : "este partido";
          if (confirm(`¿Eliminar ${nombre}? Esta acción actualizará el fixture y las posiciones.`)) {
            if (editandoPartidoId === id) salirEdicionPartido();
            almacen.eliminarPartido(id);
            renderizarTodo();
            mostrarAviso(`Partido eliminado (${nombre}).`);
          }
        }
      });
    }

    if (noticesListEl) {
      noticesListEl.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-accion]");
        if (!btn) return;
        const accion = btn.getAttribute("data-accion");
        const id = btn.getAttribute("data-id");
        const estadoActual = almacen.cargarEstado();

        if (accion === "editar-comunicado") {
          const aviso = estadoActual.comunicados.find((c) => String(c.id) === String(id));
          if (aviso) entrarEdicionComunicado(aviso);
        } else if (accion === "eliminar-comunicado") {
          const aviso = estadoActual.comunicados.find((c) => String(c.id) === String(id));
          const titulo = aviso ? aviso.titulo : "este comunicado";
          if (confirm(`¿Eliminar el comunicado "${titulo}"?`)) {
            if (editandoComunicadoId === id) salirEdicionComunicado();
            almacen.eliminarComunicado(id);
            renderizarTodo();
            mostrarAviso(`Comunicado "${titulo}" eliminado.`);
          }
        }
      });
    }

    if (sanctionsListEl) {
      sanctionsListEl.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-accion]");
        if (!btn) return;
        if (btn.getAttribute("data-accion") !== "eliminar-sancion") return;

        const id = btn.getAttribute("data-id");
        const estadoActual = almacen.cargarEstado();
        const lista = Array.isArray(estadoActual.sanciones) ? estadoActual.sanciones : [];
        const sancion = lista.find((s) => String(s.id) === String(id));
        const nombre = sancion ? sancion.club : "este club";

        if (confirm(`¿Eliminar la sanción de ${nombre}? La tabla de posiciones se recalculará.`)) {
          almacen.eliminarSancion(id);
          renderizarTodo();
          mostrarAviso(`Sanción eliminada (${nombre}).${avisoAlmacenamiento()}`);
        }
      });
    }

    renderizarTodo();
  }

  document.addEventListener("DOMContentLoaded", iniciarAdmin);
})();