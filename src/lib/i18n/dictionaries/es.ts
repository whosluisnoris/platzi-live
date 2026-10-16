// Diccionario base (español). `en.ts` está tipado contra este objeto, así que
// si aquí se agrega una clave, TypeScript obliga a traducirla allá.
//
// Los valores son SIEMPRE cadenas: el diccionario viaja del servidor al cliente
// (I18nProvider), así que no puede contener funciones. Para los huecos se usa
// `{algo}` y el helper `fmt()`; para los plurales, `{ one, other }` y `plural()`.
export const es = {
  meta: {
    defaultTitle: "{site} — recursos de tecnología curados por la comunidad",
    description:
      "Playlists y videos de tecnología curados por temática, aportados y votados por la comunidad — gratis y en español.",
    tagline: "Te ayudamos a encontrar tu camino en el mundo infinito de videos.",
  },

  common: {
    loading: "Cargando…",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Borrar",
    edit: "Editar",
    refresh: "Actualizar",
    sending: "Enviando…",
    saving: "Guardando…",
    noConnection: "No hay conexión. Intenta de nuevo.",
    optional: "opcional",
  },

  nav: {
    explore: "Explorar",
    blog: "Blog",
    opinions: "Opiniones",
    saved: "Guardados",
    admin: "Admin",
    submit: "+ Aportar video",
    submitShort: "Aportar video",
    signIn: "Entrar",
    signUp: "Crear cuenta",
    myVideos: "Mis videos",
    myProfile: "Mi perfil",
    signOut: "Cerrar sesión",
    signingOut: "Saliendo…",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    menu: "Menú",
  },

  language: {
    label: "Idioma",
    switchTo: "Cambiar a inglés",
    es: "Español",
    en: "Inglés",
    esShort: "ES",
    enShort: "EN",
    videoLabel: "Idioma del video",
    videoEs: "Español",
    videoEn: "Inglés",
    filterAll: "Todos los idiomas",
  },

  theme: {
    toLight: "Cambiar a tema claro",
    toDark: "Cambiar a tema oscuro",
    light: "Tema claro",
    dark: "Tema oscuro",
  },

  footer: {
    opinionLink: "¿Qué opinas de Clusly?",
    credit: "Hecho con cariño para quienes aprenden IA y datos en español. Por",
  },

  landing: {
    titleLead: "En un mundo infinito de videos,",
    titleAccent: "tu ruta empieza aquí.",
    subtitle: "Lo mejor de YouTube para aprender tecnología. Gratis, en tu idioma y en orden.",
    ctaPrimary: "Empieza tu ruta",
    // Tres ideas cortas bajo el CTA (con ✓, sin numerar: no son una secuencia).
    claim1: "Curado por área",
    claim2: "Gratis y en tu idioma",
    claim3: "Paso a paso",
    // Tarjeta ilustrativa del hero: una ruta a medio recorrer.
    routeSample: "ruta de ejemplo",
    routeProgress: "{done} de {total}",
    routeNext: "Siguiente",
    topicsTitle: "Explora por temática",
    seeAll: "Ver todo →",
    resourceCount: { one: "{n} recurso", other: "{n} recursos" },
    howToTitle: "¿Un video te sirvió? Súbelo.",
    howToSubtitle: "Cuatro pasos, menos de un minuto.",
    howToStep1: "Copia el enlace de YouTube",
    howToStep2: "Pégalo en Clusly",
    howToStep3: "Elige temática e idioma",
    howToStep4: "Publica y la comunidad vota",
    howToCta: "Aportar video",
  },

  // Nombre y descripción de cada temática, por slug. El catálogo vive en la
  // base de datos, pero las temáticas son un conjunto conocido y fijo, así que
  // se traducen aquí en vez de duplicar columnas por idioma. Una temática nueva
  // creada desde el panel no está en este mapa: `localizeCategory` cae al
  // nombre de la base y sigue funcionando.
  categories: {
    tecnologia: {
      name: "Tecnología",
      description: "Fundamentos y novedades de tecnología",
    },
    programacion: {
      name: "Programación",
      description: "Lenguajes, algoritmos y buenas prácticas",
    },
    web: {
      name: "Web",
      description: "Frontend, backend y todo lo del navegador",
    },
    ia: {
      name: "IA",
      description: "Inteligencia artificial y machine learning",
    },
    agentes: {
      name: "Agentes",
      description: "Agentes autónomos y orquestación de LLMs",
    },
    datos: {
      name: "Datos",
      description: "Ingeniería y análisis de datos",
    },
    diseno: {
      name: "Diseño",
      description: "UI, UX y diseño de producto",
    },
    producto: {
      name: "Producto",
      description: "Gestión y estrategia de producto",
    },
    devops: {
      name: "DevOps",
      description: "Infraestructura, CI/CD y nube",
    },
    ciberseguridad: {
      name: "Ciberseguridad",
      description: "Seguridad ofensiva y defensiva",
    },
    movil: {
      name: "Móvil",
      description: "Desarrollo iOS, Android y multiplataforma",
    },
    carrera: {
      name: "Carrera",
      description: "Empleo, soft skills y crecimiento profesional",
    },
  },

  explore: {
    title: "Explorar",
    subtitle:
      "Lo mejor de la comunidad, ordenado por votos. Filtra por categoría o descubre lo más reciente.",
    sortLabel: "Orden",
    sortTop: "Más votados",
    sortNew: "Recientes",
    allCategories: "Todas",
    languageLabel: "Idioma",
    emptyFiltered:
      "No hay videos con esos filtros. Prueba otros o aporta el primero.",
    empty: "Aún no hay videos. ¡Sé el primero en aportar uno!",
  },

  card: {
    playlist: "Playlist",
    videoCount: { one: "{n} video", other: "{n} videos" },
    save: "Guardar",
    saved: "Guardado",
    unsave: "Quitar de guardados",
    voteUp: "Votar útil",
    voteDown: "Votar poco útil",
  },

  category: {
    empty: "Aún no hay recursos en esta categoría. Pronto agregaremos más.",
  },

  resource: {
    backTo: "Volver a {target}",
    backAll: "Todo",
    voteHint: "¿Te sirvió? Vótalo para que más gente lo encuentre.",
    playlistMeta: "Playlist · {n} videos",
    emptyPlaylist: "Esta playlist aún no tiene videos.",
    episodes: "Episodios",
    publishedVerb: "Publicado",
  },

  submit: {
    title: "Aportar un video",
    subtitleUser:
      "¿Un video que te ayudó a aprender? Compártelo con la comunidad. Aparece al instante y la gente lo hace subir con sus votos.",
    subtitleGuest:
      "¿Un video que te ayudó a aprender? Compártelo con la comunidad. Llena esto sin cuenta: te la pedimos hasta el final, y tu borrador no se pierde.",
    urlLabel: "Enlace de YouTube",
    urlHint: "Un video suelto, o una playlist con el link /playlist?list=…",
    categoriesLabel: "Categorías",
    languageHint: "¿En qué idioma está el video?",
    submitButton: "Publicar en Clusly",
    submitting: "Agregando…",
    guestHint: "No necesitas cuenta para empezar: te la pedimos al confirmar.",
    accountTitle: "Ya casi. ¿Lo publicamos a tu nombre?",
    accountBody:
      "Con cuenta, tu video aparece al instante en el catálogo, queda en tus aportes y puedes votar y guardar. Tu borrador está guardado: si entras ahora, al volver lo encuentras tal cual.",
    accountSignUp: "Crear cuenta y publicar",
    accountSignIn: "Ya tengo cuenta",
    accountAnon: "Enviarlo sin cuenta",
    accountAnonHint:
      "También sirve: guardamos tu aporte y queda pendiente de aprobación del equipo antes de salir en el catálogo.",
    keepEditing: "← Seguir editando",
    successTitle: "¡Gracias! Tu aporte ya está en Clusly.",
    successLink: "Ver el video →",
    pendingTitle: "¡Gracias! Tu aporte quedó guardado.",
    pendingBody:
      "Queda pendiente de aprobación: el equipo lo revisa y, si todo está bien, aparece en el catálogo. Si creas una cuenta, tus próximos aportes se publican al instante.",
    pendingCta: "Crear cuenta →",
    duplicateTitle: "Ese video ya está en Clusly.",
    duplicateBody: "Alguien se te adelantó. Puedes ir a votarlo para que suba.",
    duplicateLink: "Verlo →",
    genericError: "No se pudo agregar el video.",
  },

  saved: {
    title: "Guardados",
    empty: "Aquí se juntan los videos y playlists que marques con el corazón.",
    count: {
      one: "{n} recurso guardado · solo tú lo ves.",
      other: "{n} recursos guardados · solo tú los ves.",
    },
    exploreCta: "Explorar catálogo",
    emptyBody:
      "Todavía no has guardado nada. Pasa el cursor sobre cualquier tarjeta y toca el corazón para dejarlo aquí.",
    emptyLink: "Ir a explorar →",
  },

  myVideos: {
    title: "Mis videos",
    empty: "Aquí verás los videos que aportes a Clusly.",
    count: {
      one: "{n} aporte · el puntaje sube con los votos de la comunidad.",
      other: "{n} aportes · el puntaje sube con los votos de la comunidad.",
    },
    cta: "+ Aportar video",
    emptyBody: "Todavía no has aportado ningún video.",
    emptyLink: "Aporta el primero →",
    allHidden: "Todos tus videos están ocultos por ahora.",
    hiddenTitle: "Ocultos por moderación ({n})",
    hiddenBadge: "Oculto",
  },

  opinions: {
    title: "Opiniones",
    subtitle:
      "Clusly se construye con lo que dice quien la usa. Cuéntanos qué te sirve, qué te falta y qué agregarías.",
    privacy:
      "🔒 Lo que escribas aquí no se publica: llega directo al equipo de Clusly y lo leemos todo. Si quieres respuesta, deja tu correo en el mensaje.",
    sentimentQuestion: "¿Cómo te sientes con Clusly?",
    sentimentLove: "Me encanta",
    sentimentOk: "Puede mejorar",
    sentimentBad: "No me convence",
    messageLabel: "¿Qué nos quieres contar?",
    messagePlaceholder: "Qué te sirve, qué te falta, qué agregarías…",
    signedAs: "Se enviará firmada como {name}.",
    anonAs: "Se enviará como Anónimo.",
    signInToSign: "Entra",
    signInToSignAfter: "si quieres firmarla.",
    submit: "Enviar opinión",
    thanksTitle: "¡Gracias por escribir! 💚",
    thanksBody: "Ya nos llegó tu mensaje. Lo leemos todo.",
    writeAnother: "Escribir otra",
    errorSentiment: "Elige cómo te sientes con Clusly.",
    errorShort: "Cuéntanos un poco más (mínimo 3 caracteres).",
    errorGeneric: "No se pudo enviar tu opinión.",
    errorNetwork: "No se pudo enviar tu opinión, revisa tu conexión.",
  },

  profile: {
    editButton: "Editar perfil",
    editTitle: "Editar perfil",
    noBio: "Todavía no has escrito tu biografía.",
    memberSince: "Desde {date}",
    nameLabel: "Nombre visible",
    nameHint: "Es el nombre con el que firmas tus opiniones y tus aportes.",
    bioLabel: "Biografía",
    bioPlaceholder: "Qué estás aprendiendo, en qué trabajas, qué te gusta compartir…",
    locationLabel: "Ubicación",
    locationPlaceholder: "Ciudad de México, remoto…",
    linksLabel: "Enlaces",
    linksHint: "(hasta {n})",
    linksEmpty: "Tu sitio, GitHub, LinkedIn, tu canal… lo que quieras compartir.",
    linkName: "Nombre (GitHub…)",
    linkRemove: "Quitar",
    linkAdd: "+ Agregar enlace",
    saveChanges: "Guardar cambios",
    activityTitle: "Tu actividad",
    statContributions: "Aportes",
    statContributionsHint: "videos y playlists que subiste",
    statSaved: "Guardados",
    statSavedHint: "tu lista privada",
    statVotes: "Votos",
    statVotesHint: "recursos que has votado",
    statOpinions: "Opiniones",
    statOpinionsHint: "lo que nos has contado",
    shortcutsLabel: "Atajos",
    shortcutSubmit: "+ Aportar video",
    shortcutSaved: "Ver guardados",
    shortcutOpinion: "Dejar una opinión",
    errorName: "Tu nombre necesita al menos 2 caracteres.",
    errorLink: "\"{url}\" no es un enlace válido: debe empezar con https://",
    errorGeneric: "No se pudo guardar tu perfil.",
  },

  blog: {
    title: "Blog",
    subtitle:
      "Lo que vamos aprendiendo mientras construimos Clusly: cómo estudiar con criterio, novedades de la plataforma y hallazgos del catálogo.",
    empty: "Todavía no hay artículos publicados. Pronto escribimos el primero.",
    readingTime: "{n} min de lectura",
    back: "Volver al blog",
    ctaTitle: "¿Conoces un video que debería estar en Clusly?",
    ctaButton: "+ Aportar video",
    notFound: "Artículo no encontrado",
  },



  auth: {
    signInTitle: "Entra a tu cuenta",
    signUpTitle: "Crea tu cuenta",
    signInSubtitle: "Bienvenido de vuelta a Clusly.",
    signUpSubtitle: "Aporta videos, clasifícalos y vota por los que ayudan.",
    nameLabel: "Nombre",
    namePlaceholder: "Cómo te llamas",
    emailLabel: "Correo",
    emailPlaceholder: "tu@correo.com",
    passwordLabel: "Contraseña",
    passwordPlaceholderSignUp: "Mínimo 8 caracteres",
    passwordPlaceholderSignIn: "Tu contraseña",
    submitting: "Un momento…",
    submitSignIn: "Entrar",
    submitSignUp: "Crear cuenta",
    haveAccount: "¿Ya tienes cuenta?",
    haveAccountLink: "Entra",
    noAccount: "¿Nuevo en Clusly?",
    noAccountLink: "Crea tu cuenta",
    checkEmailTitle: "Revisa tu correo",
    checkEmailBody:
      "Te enviamos un enlace de confirmación a {email}. Ábrelo para activar tu cuenta y empezar a aportar videos.",
    backToSignIn: "Volver a entrar",
    confirmError:
      "No pudimos confirmar tu correo. El enlace pudo expirar; intenta entrar de nuevo.",
    genericError: "Algo salió mal. Intenta de nuevo.",
    networkError: "No hay conexión. Revisa tu internet e intenta de nuevo.",
  },
};

// Sin `as const` a propósito: así los valores son `string` y no literales, y
// `en.ts` puede tipar contra esta forma sin tener que repetir el texto español.
export type Dictionary = typeof es;
