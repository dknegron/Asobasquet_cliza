/* Catálogo de clubes afiliados.
   - `slug` se usa para armar las rutas de las fotos en blanco:
       assetsimgclubes/<slug>-1.svg , -2.svg , -3.svg
   - Para usar fotos propias, cambia `slug` por una lista `fotos`:
       fotos: ["assetsimgclubes/mi-club-1.jpg", "assetsimgclubes/mi-club-2.jpg"]
   - Si un club no está en el catálogo pero juega un partido, igual aparece en la
     página de Clubes (se toma del fixture). */
window.ABMC_DATOS = {
  clubes: [
    { id: "cl-01", nombre: "SAN ANTONIO", categoria: "Primera de Honor", slug: "san-antonio" },
    { id: "cl-02", nombre: "MAYORES", categoria: "Mayores", slug: "mayores" },
    { id: "cl-03", nombre: "SAN ANTONIO MENORES", categoria: "Menores", slug: "san-antonio-menores" },
    { id: "cl-04", nombre: "S. A. CLIZA", categoria: "Primera de Honor", slug: "s-a-cliza" },
    { id: "cl-05", nombre: "WAKANDA", categoria: "Primera de Honor", slug: "wakanda" },
    { id: "cl-06", nombre: "FALCONS", categoria: "Primera de Honor", slug: "falcons" },
    { id: "cl-07", nombre: "SHARKS", categoria: "Primera de Honor", slug: "sharks" },
    { id: "cl-08", nombre: "GRIZZLIES", categoria: "Primera de Honor", slug: "grizzlies" },
    { id: "cl-09", nombre: "RAPTORS", categoria: "Primera de Honor", slug: "raptors" },
    { id: "cl-10", nombre: "THE FAMILY", categoria: "Primera de Honor", slug: "the-family" },
    { id: "cl-11", nombre: "MUNICIPAL", categoria: "Primera de Honor", slug: "municipal" },
    { id: "cl-12", nombre: "OKLAHOMA", categoria: "Primera de Honor", slug: "oklahoma" },
    { id: "cl-13", nombre: "WARRIORS", categoria: "Primera de Honor", slug: "warriors" },
    { id: "cl-14", nombre: "GOLDEN", categoria: "Primera de Honor", slug: "golden" },
    { id: "cl-15", nombre: "SPARKS", categoria: "Primera de Honor", slug: "sparks" },
    { id: "cl-16", nombre: "PISTONS", categoria: "Primera de Honor", slug: "pistons" },
    { id: "cl-17", nombre: "ESCUELA MUNICIPAL", categoria: "Escuela Municipal", slug: "escuela-municipal" },
    { id: "cl-18", nombre: "CLIPERS", categoria: "Primera de Honor", slug: "clipers" },
    { id: "cl-19", nombre: "BOSTON", categoria: "Primera de Honor", slug: "boston" },
    { id: "cl-20", nombre: "BULLS PUNATA", categoria: "Primera de Honor", slug: "bulls-punata" },
    { id: "cl-21", nombre: "R3Y", categoria: "Primera de Honor", slug: "r3y" },
    { id: "cl-22", nombre: "BULLS CLIZA", categoria: "Primera de Honor", slug: "bulls-cliza" },
    { id: "cl-23", nombre: "SUCRE", categoria: "Primera de Honor", slug: "sucre" }
  ],
  partidos: [
    {
      id: "p-01",
      categoria: "Primera de Honor",
      fecha: "Fecha 1",
      hora: "19:00",
      coliseo: "Coliseo Municipal de Cliza",
      estado: "finalizado",
      local: "SAN ANTONIO",
      visitante: "WAKANDA",
      ptsLocal: 74,
      ptsVisitante: 68,
      cuartos: "C1: 18-16 · C2: 19-17 · C3: 17-18 · C4: 20-17",
      observaciones: "Partido disputado sin incidentes en mesa."
    },
    {
      id: "p-02",
      categoria: "Primera de Honor",
      fecha: "Fecha 1",
      hora: "20:30",
      coliseo: "Coliseo Municipal de Cliza",
      estado: "wo",
      local: "FALCONS",
      visitante: "SHARKS",
      ptsLocal: 20,
      ptsVisitante: 0,
      woGanador: "local",
      cuartos: "W.O. reglamentario (marcador oficial 20 - 0)",
      observaciones: "SHARKS no se presentó a la hora reglamentaria."
    },
    {
      id: "p-03",
      categoria: "U19 Varones",
      fecha: "Fecha 1",
      hora: "17:30",
      coliseo: "Coliseo Municipal de Cliza",
      estado: "programado",
      local: "GRIZZLIES",
      visitante: "RAPTORS",
      ptsLocal: null,
      ptsVisitante: null,
      cuartos: "C1: - · C2: - · C3: - · C4: -",
      observaciones: "Programación confirmada."
    }
  ],
  sanciones: [
    {
      id: "s-01",
      club: "SHARKS",
      categoria: "Primera de Honor",
      ajustePuntos: -1,
      detalle: "Resolución del tribunal por inasistencia y observación administrativa."
    }
  ],
  comunicados: [
    {
      id: "c-01",
      titulo: "Inicio Oficial de la Temporada en Cliza",
      tipo: "circular",
      fecha: "Noviembre 2026",
      mensaje: "Se recuerda a delegados y clubes presentar nóminas habilitadas 30 minutos antes de cada encuentro."
    }
  ]
};
