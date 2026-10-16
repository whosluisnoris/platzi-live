import type { Dictionary } from "./es";

// Traducción al inglés. Tipada contra el diccionario español: si allá se agrega
// una clave, TypeScript falla aquí hasta traducirla.
//
// Nota: la interfaz se traduce, pero el catálogo sigue siendo mayoritariamente
// contenido en español (títulos de videos, categorías, artículos del blog). Por
// eso el filtro de idioma del video existe: para que quien lee en inglés pueda
// quedarse con lo que sí va a entender.
export const en: Dictionary = {
  meta: {
    defaultTitle: "{site} — tech learning resources curated by the community",
    description:
      "Tech playlists and videos curated by topic, contributed and voted on by the community — free, mostly in Spanish.",
    tagline: "We help you find your path in an endless world of videos.",
  },

  common: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    refresh: "Refresh",
    sending: "Sending…",
    saving: "Saving…",
    noConnection: "You're offline. Please try again.",
    optional: "optional",
  },

  nav: {
    explore: "Explore",
    blog: "Blog",
    opinions: "Feedback",
    saved: "Saved",
    admin: "Admin",
    submit: "+ Add a video",
    submitShort: "Add a video",
    signIn: "Sign in",
    signUp: "Sign up",
    myVideos: "My videos",
    myProfile: "My profile",
    signOut: "Sign out",
    signingOut: "Signing out…",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
  },

  language: {
    label: "Language",
    switchTo: "Switch to Spanish",
    es: "Spanish",
    en: "English",
    esShort: "ES",
    enShort: "EN",
    videoLabel: "Video language",
    videoEs: "Spanish",
    videoEn: "English",
    filterAll: "All languages",
  },

  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
    light: "Light theme",
    dark: "Dark theme",
  },

  footer: {
    opinionLink: "What do you think of Clusly?",
    credit: "Made with care for people learning AI and data. By",
  },

  landing: {
    titleLead: "In an endless world of videos,",
    titleAccent: "your path starts here.",
    subtitle: "The best of YouTube for learning tech. Free, in your language, and in order.",
    ctaPrimary: "Start your path",
    claim1: "Curated by topic",
    claim2: "Free, in your language",
    claim3: "Step by step",
    routeSample: "sample path",
    routeProgress: "{done} of {total}",
    routeNext: "Next",
    topicsTitle: "Explore by topic",
    seeAll: "See all →",
    resourceCount: { one: "{n} resource", other: "{n} resources" },
    howToTitle: "Did a video help you? Add it.",
    howToSubtitle: "Four steps, under a minute.",
    howToStep1: "Copy the YouTube link",
    howToStep2: "Paste it into Clusly",
    howToStep3: "Pick topic and language",
    howToStep4: "Publish and let the community vote",
    howToCta: "Add a video",
  },

  categories: {
    tecnologia: {
      name: "Technology",
      description: "Tech fundamentals and what's new",
    },
    programacion: {
      name: "Programming",
      description: "Languages, algorithms and good practices",
    },
    web: {
      name: "Web",
      description: "Frontend, backend and everything in the browser",
    },
    ia: {
      name: "AI",
      description: "Artificial intelligence and machine learning",
    },
    agentes: {
      name: "Agents",
      description: "Autonomous agents and LLM orchestration",
    },
    datos: {
      name: "Data",
      description: "Data engineering and analysis",
    },
    diseno: {
      name: "Design",
      description: "UI, UX and product design",
    },
    producto: {
      name: "Product",
      description: "Product management and strategy",
    },
    devops: {
      name: "DevOps",
      description: "Infrastructure, CI/CD and cloud",
    },
    ciberseguridad: {
      name: "Cybersecurity",
      description: "Offensive and defensive security",
    },
    movil: {
      name: "Mobile",
      description: "iOS, Android and cross-platform development",
    },
    carrera: {
      name: "Career",
      description: "Jobs, soft skills and professional growth",
    },
  },

  explore: {
    title: "Explore",
    subtitle:
      "The best of the community, ranked by votes. Filter by topic or discover what's new.",
    sortLabel: "Sort",
    sortTop: "Most voted",
    sortNew: "Newest",
    allCategories: "All",
    languageLabel: "Language",
    emptyFiltered: "No videos match those filters. Try others, or add the first one.",
    empty: "No videos yet. Be the first to add one!",
  },

  card: {
    playlist: "Playlist",
    videoCount: { one: "{n} video", other: "{n} videos" },
    save: "Save",
    saved: "Saved",
    unsave: "Remove from saved",
    voteUp: "Mark as useful",
    voteDown: "Mark as not useful",
  },

  category: {
    empty: "No resources in this topic yet. We'll add more soon.",
  },

  resource: {
    backTo: "Back to {target}",
    backAll: "All",
    voteHint: "Did it help? Vote so more people find it.",
    playlistMeta: "Playlist · {n} videos",
    emptyPlaylist: "This playlist has no videos yet.",
    episodes: "Episodes",
    publishedVerb: "Published",
  },

  submit: {
    title: "Add a video",
    subtitleUser:
      "A video that helped you learn? Share it with the community. It shows up right away and votes push it higher.",
    subtitleGuest:
      "A video that helped you learn? Share it with the community. Fill this in without an account — we'll only ask at the end, and your draft won't be lost.",
    urlLabel: "YouTube link",
    urlHint: "A single video, or a playlist with the /playlist?list=… link",
    categoriesLabel: "Topics",
    languageHint: "What language is the video in?",
    submitButton: "Publish on Clusly",
    submitting: "Adding…",
    guestHint: "No account needed to start — we'll ask when you confirm.",
    accountTitle: "Almost there. Publish it under your name?",
    accountBody:
      "With an account your video shows up in the catalog right away, stays in your contributions, and you can vote and save. Your draft is stored: sign in now and you'll find it exactly as you left it.",
    accountSignUp: "Sign up and publish",
    accountSignIn: "I already have an account",
    accountAnon: "Send it without an account",
    accountAnonHint:
      "That works too: we keep your submission and it waits for the team's approval before it shows up in the catalog.",
    keepEditing: "← Keep editing",
    successTitle: "Thank you! Your contribution is live on Clusly.",
    successLink: "See the video →",
    pendingTitle: "Thank you! Your contribution was saved.",
    pendingBody:
      "It's pending approval: the team reviews it and, if all is well, it shows up in the catalog. Create an account and your next contributions publish instantly.",
    pendingCta: "Sign up →",
    duplicateTitle: "That video is already on Clusly.",
    duplicateBody: "Someone beat you to it. You can go vote it up instead.",
    duplicateLink: "See it →",
    genericError: "Couldn't add the video.",
  },

  saved: {
    title: "Saved",
    empty: "Videos and playlists you heart will gather here.",
    count: {
      one: "{n} saved resource · only you can see it.",
      other: "{n} saved resources · only you can see them.",
    },
    exploreCta: "Explore the catalog",
    emptyBody:
      "You haven't saved anything yet. Hover any card and tap the heart to keep it here.",
    emptyLink: "Go explore →",
  },

  myVideos: {
    title: "My videos",
    empty: "Videos you contribute to Clusly will show up here.",
    count: {
      one: "{n} contribution · its score rises with community votes.",
      other: "{n} contributions · their score rises with community votes.",
    },
    cta: "+ Add a video",
    emptyBody: "You haven't contributed any videos yet.",
    emptyLink: "Add the first one →",
    allHidden: "All your videos are hidden for now.",
    hiddenTitle: "Hidden by moderation ({n})",
    hiddenBadge: "Hidden",
  },

  opinions: {
    title: "Feedback",
    subtitle:
      "Clusly is built on what the people using it say. Tell us what works, what's missing and what you'd add.",
    privacy:
      "🔒 What you write here isn't published: it goes straight to the Clusly team and we read every word. Want a reply? Leave your email in the message.",
    sentimentQuestion: "How do you feel about Clusly?",
    sentimentLove: "I love it",
    sentimentOk: "Room to improve",
    sentimentBad: "Not convinced",
    messageLabel: "What would you like to tell us?",
    messagePlaceholder: "What works, what's missing, what you'd add…",
    signedAs: "It will be signed as {name}.",
    anonAs: "It will be sent as Anonymous.",
    signInToSign: "Sign in",
    signInToSignAfter: "if you'd like to sign it.",
    submit: "Send feedback",
    thanksTitle: "Thanks for writing! 💚",
    thanksBody: "Your message reached us. We read them all.",
    writeAnother: "Write another",
    errorSentiment: "Pick how you feel about Clusly.",
    errorShort: "Tell us a bit more (3 characters minimum).",
    errorGeneric: "Couldn't send your feedback.",
    errorNetwork: "Couldn't send your feedback — check your connection.",
  },

  profile: {
    editButton: "Edit profile",
    editTitle: "Edit profile",
    noBio: "You haven't written your bio yet.",
    memberSince: "Since {date}",
    nameLabel: "Display name",
    nameHint: "This is the name that signs your feedback and contributions.",
    bioLabel: "Bio",
    bioPlaceholder: "What you're learning, what you work on, what you like to share…",
    locationLabel: "Location",
    locationPlaceholder: "Mexico City, remote…",
    linksLabel: "Links",
    linksHint: "(up to {n})",
    linksEmpty: "Your site, GitHub, LinkedIn, your channel… whatever you want to share.",
    linkName: "Name (GitHub…)",
    linkRemove: "Remove",
    linkAdd: "+ Add link",
    saveChanges: "Save changes",
    activityTitle: "Your activity",
    statContributions: "Contributions",
    statContributionsHint: "videos and playlists you added",
    statSaved: "Saved",
    statSavedHint: "your private list",
    statVotes: "Votes",
    statVotesHint: "resources you've voted on",
    statOpinions: "Feedback",
    statOpinionsHint: "what you've told us",
    shortcutsLabel: "Shortcuts",
    shortcutSubmit: "+ Add a video",
    shortcutSaved: "See saved",
    shortcutOpinion: "Leave feedback",
    errorName: "Your name needs at least 2 characters.",
    errorLink: "\"{url}\" isn't a valid link: it must start with https://",
    errorGeneric: "Couldn't save your profile.",
  },

  blog: {
    title: "Blog",
    subtitle:
      "What we learn while building Clusly: how to study with judgement, platform news and finds from the catalog.",
    empty: "No articles published yet. We'll write the first one soon.",
    readingTime: "{n} min read",
    back: "Back to the blog",
    ctaTitle: "Know a video that belongs on Clusly?",
    ctaButton: "+ Add a video",
    notFound: "Article not found",
  },



  auth: {
    signInTitle: "Sign in to your account",
    signUpTitle: "Create your account",
    signInSubtitle: "Welcome back to Clusly.",
    signUpSubtitle: "Add videos, sort them by topic and vote for the ones that help.",
    nameLabel: "Name",
    namePlaceholder: "What should we call you",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    passwordLabel: "Password",
    passwordPlaceholderSignUp: "At least 8 characters",
    passwordPlaceholderSignIn: "Your password",
    submitting: "One moment…",
    submitSignIn: "Sign in",
    submitSignUp: "Sign up",
    haveAccount: "Already have an account?",
    haveAccountLink: "Sign in",
    noAccount: "New to Clusly?",
    noAccountLink: "Create your account",
    checkEmailTitle: "Check your email",
    checkEmailBody:
      "We sent a confirmation link to {email}. Open it to activate your account and start adding videos.",
    backToSignIn: "Back to sign in",
    confirmError:
      "We couldn't confirm your email. The link may have expired; try signing in again.",
    genericError: "Something went wrong. Please try again.",
    networkError: "You're offline. Check your connection and try again.",
  },
};
