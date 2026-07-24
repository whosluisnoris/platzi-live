# Plan de monetización

> **Estado: propuesta estratégica.** Este documento analiza cómo Clusly puede
> generar ingresos partiendo de lo que **hoy** es y de sus restricciones reales.
> No es un compromiso de construir todo lo de aquí; es un mapa de opciones,
> ordenado por encaje, esfuerzo y tiempo hasta el primer ingreso.

## TL;DR (la recomendación en un párrafo)

Clusly **no puede cobrar por los videos** (son gratuitos y públicos en YouTube; el
producto solo los organiza en `<iframe>`). Por tanto, lo monetizable no es el
_contenido_, sino la **capa de curaduría, guía, progreso, comunidad e
inteligencia** que Clusly pone encima, y la **audiencia de alta intención** que
reúne (gente que está intentando aprender una habilidad concreta). La ruta
recomendada es incremental y no rompe la promesa de marca ("en español y gratis"):

1. **Fase 1 — sin fricción:** afiliación a educación/herramientas de pago +
   donaciones ("Apóyanos") + bolsa de empleo curada. Cero paywall, se lanza en
   días, valida que la audiencia convierte.
2. **Fase 2 — Clusly Pro (freemium):** cobrar por la _capa de productividad_
   (seguimiento de progreso, tutor con IA, certificados, notas/colecciones), nunca
   por ver los videos. Precio localizado y pagos locales.
3. **Fase 3 — patrocinios y B2B:** rutas/categorías patrocinadas, Clusly para
   Equipos (por asiento), white-label para bootcamps e informes de tendencias de
   aprendizaje.

El dinero rápido y de bajo riesgo vive en la Fase 1 y 3 (audiencia); el negocio
recurrente y defendible vive en la Fase 2 y 3 (producto + B2B).

---

## 1. La restricción que define toda la estrategia

Antes de listar opciones hay que ser honestos sobre lo que Clusly es y no es:

| Realidad | Consecuencia para monetizar |
|---|---|
| Los videos son gratis y públicos en YouTube; Clusly solo los **embebe** | No se puede vender "acceso al contenido": el usuario siempre puede ir a YouTube. Se vende la **organización y la experiencia**, no el video. |
| Clusly **no es dueño** del contenido | Un muro de pago sobre el catálogo es débil (legal y éticamente) y fácil de eludir. La marca dice "en español y **gratis**" — romperlo mata la confianza. |
| Costo marginal casi cero (iframes, scraping, capas gratuitas de Vercel/Supabase) | Cualquier ingreso es casi todo margen. No hay presión de costos que _obligue_ a cobrar; se puede crecer audiencia primero. |
| Audiencia LATAM / hispanohablante | Alta intención pero menor disposición a pagar en USD; hacen falta **medios de pago locales** (Mercado Pago, PIX) y **precios localizados**. |
| Dependencia de scraping de YouTube (playlists, lives) | Es frágil y va contra los ToS de YouTube: es un **riesgo de negocio**, no solo técnico (ver §7). |

**Conclusión estratégica:** monetizar la **capa** (guía, progreso, IA, comunidad,
certificados) y la **audiencia** (afiliación, patrocinio, empleo, datos), **no el
acceso** al video.

## 2. Activos monetizables (qué tenemos ya)

Lo que Clusly ya reunió y que tiene valor económico:

- **Curaduría por área** — 12 categorías tecnológicas y recursos ordenados en
  "rutas". Es trabajo editorial que la gente no quiere hacer sola.
- **Audiencia de alta intención** — no es tráfico casual: son personas intentando
  aprender IA, datos, web, etc. Es exactamente el público que compra cursos,
  bootcamps, herramientas y al que quieren contratar las empresas.
- **Capa de comunidad** — cuentas, envíos, votación, perfiles y roles ya
  existentes (`profiles`, `resource_votes`, `submitted_by`).
- **Señal de demanda** — analítica anónima (`watch_events`, `watch_stats`) +
  votos: sabemos **qué se quiere aprender**. Ese dato agregado vale para terceros.
- **SEO potencial** — páginas por recurso y por categoría = tráfico orgánico de
  cola larga (el denominador de todo ingreso por audiencia).
- **Base de IA planificada** — la propuesta Gemini (`06-propuesta-ia-gemini.md`)
  es la semilla del diferenciador de pago (tutor/rutas personalizadas).

## 3. Opciones de monetización

Cuatro grandes vías. Cada tabla indica **esfuerzo**, **potencial**, **encaje con
la marca** y **cuándo tiene sentido**.

### A. Monetizar la audiencia y la distribución (empezar aquí)

Funciona **sin paywall** y sin romper la promesa gratis. Necesita **tráfico**,
no producto nuevo.

| Opción | Cómo encaja en Clusly | Esfuerzo | Potencial | Riesgo/nota |
|---|---|---|---|---|
| **Afiliación a educación/herramientas** | En una ruta de "Datos", recomendar el curso/bootcamp de pago que profundiza (Platzi, Domestika, DataCamp, Hostinger, créditos de nube…). Comisión por registro. | Bajo | Medio–alto | Debe ser **contextual y honesto**; marcar como recomendación. Ya se rastrea `open_youtube`: replicar para clics salientes. |
| **Patrocinio de rutas/categorías** | "Ruta de Agentes, presentada por [herramienta X]". Nativo, divulgado. Audiencia nicho = CPM alto. | Bajo–medio | Alto | Requiere audiencia vendible; empezar cuando haya tráfico constante. |
| **Bolsa de empleo** | La categoría **"Carrera"** ya existe. Empresas pagan por publicar vacantes junior/remote LATAM; o comisión por contratación. | Medio | Alto | Encaja perfecto con el público (gente subiendo de nivel = buscando empleo). |
| **Publicidad display/nativa** | Banners fuera del reproductor. | Bajo | Bajo | **Último recurso**: peor UX y **prohibido superponer anuncios al reproductor de YouTube** (ToS). |

> **Recomendación A:** afiliación + bolsa de empleo son el mejor par
> esfuerzo/retorno para empezar. La publicidad display queda al final.

### B. Monetización directa al usuario — "Clusly Pro" (freemium)

El plan gratuito **se queda completo** (explorar, ver, votar, enviar). Pro cobra
por la **capa de productividad y resultados**, nunca por ver el video.

| Función Pro | Por qué la pagarían | Base ya existente |
|---|---|---|
| **Seguimiento de progreso** | Marcar episodios vistos, reanudar, % de ruta, rachas. Convierte "ver videos" en "avanzar hacia una meta". | La analítica por `video_id` es reutilizable. |
| **Tutor / rutas con IA** | "Dime tu meta y te armo una ruta con el catálogo"; "¿qué veo después?"; preguntas sobre el contenido. **El diferenciador real frente a YouTube crudo.** | Es la evolución de `06-propuesta-ia-gemini.md`. |
| **Certificados / perfil público** | "Completé la ruta de Datos en Clusly", compartible en LinkedIn. Motivación + viralidad. | `profiles` ya existe. |
| **Notas, marcadores y colecciones** | Biblioteca personal, notas por video, playlists propias. | — |
| **Experiencia sin distracción + avisos** | Reproductor limpio, sin ads, notificaciones de nuevos recursos en tus temáticas. | — |

- **Modelo:** freemium con prueba gratis y plan anual (menos _churn_, menos
  comisiones de pago).
- **Realismo:** en LATAM la conversión freemium suele ser baja (frecuentemente
  <2–3 %). Modelar ingresos = _audiencia × conversión realista_, y apoyarse en las
  vías A y C para caja mientras crece la base.

### C. B2B / B2B2C (mayor techo de ingresos)

| Opción | Qué es | Esfuerzo | Potencial |
|---|---|---|---|
| **Clusly para Equipos (L&D)** | Empresas LATAM que forman devs junior usan rutas en español + tablero de progreso del equipo. Cobro **por asiento**. | Medio–alto | Alto |
| **White-label / API** | Bootcamps y escuelas usan el motor de Clusly para organizar su curaduría de YouTube, con su marca. Licencia SaaS. | Alto | Alto |
| **Datos e insights** | Informe/tablero anonimizado de "qué está aprendiendo LATAM en tech": valioso para creadores de cursos, bootcamps, equipos de DevRel e inversores. | Medio | Medio–alto |
| **Alianzas con creadores** | Educadores de YouTube quieren distribución estructurada: "curador verificado", rutas destacadas, reparto de ingresos de patrocinio. Modelo de dos lados. | Medio | Medio |

> **Privacidad:** vender insights solo con datos **agregados y anonimizados**. Hoy
> la analítica es sin PII (una fortaleza); las cuentas añaden PII, así que hace
> falta política de privacidad y ToS reales antes de cualquier producto B2B.

### D. Comunidad y misión

| Opción | Nota |
|---|---|
| **Donaciones ("Apóyanos")** | Ko-fi / Patreon / Mercado Pago: "ayúdanos a mantener Clusly gratis". Ingreso bajo pero inmediato, alineado con la misión y buena señal de afecto. |
| **Membresía / mecenazgo** | Insignia de apoyo, acceso anticipado, comunidad en Discord, AMAs con curadores. Complementa Pro. |

## 4. Hoja de ruta por fases

**Fase 0 — Medir antes de monetizar (prerrequisito).**
Ya hay analítica anónima + cuentas. Falta: embudo, retención (comparar
`session_id` recurrentes por semana, ya anotado como extensión futura), demanda
por categoría y **rastreo de clics salientes** (extender el patrón de
`open_youtube` a enlaces de afiliado). Y crecer SEO (páginas por recurso,
_sitemap_, datos estructurados): **el tráfico es el denominador de todo**.

**Fase 1 — Ingreso sin fricción (semanas, no meses).**
Afiliación contextual + donaciones + bolsa de empleo curada (al inicio, incluso
manual). Barato, no toca la experiencia gratis, valida que la audiencia convierte.
Instrumentar todo.

**Fase 2 — Construir la capa Pro.**
Enviar seguimiento de progreso + tutor con IA (los diferenciadores) y poner lo
mejor tras Clusly Pro. Precio localizado, **pagos locales** (Mercado Pago /
Stripe LATAM), plan anual, prueba gratis. Certificados/perfil como bucle de
retención y viralidad.

**Fase 3 — Patrocinios y B2B (cuando haya audiencia).**
Rutas/categorías patrocinadas, Clusly para Equipos (por asiento), pilotos
white-label con un bootcamp, informes de datos.

**Fase 4 — Plataforma de dos lados.**
Alianzas con creadores, reparto de ingresos, mercado de rutas premium.

## 5. Precios sugeridos (localizados)

> Cifras de referencia; ajustar al poder adquisitivo local y probar con datos.

| Plan | Precio orientativo | Incluye |
|---|---|---|
| **Free** | $0 | Catálogo completo, ver, votar, enviar, explorar básico. **Siempre gratis.** |
| **Pro** | ~US$4–6/mes o equivalente local (anual ≈ 2 meses gratis) | Progreso + tutor IA + certificados + notas/colecciones + avisos + sin ads. |
| **Equipos** | ~US$X/asiento/mes | Tablero de equipo, rutas asignadas, reportes de L&D. |
| **White-label / API** | A medida | Motor de curaduría con marca del cliente. |

## 6. Métricas a seguir (KPIs)

Tráfico orgánico · registros · activación (empezó una ruta) · retención
(WAU/MAU, retención a la semana 4) · finalización de rutas · CTR y conversión de
afiliados · prueba→pago de Pro · **MRR / ARPU** · CAC (mayormente orgánico) ·
_pipeline_ de patrocinio y B2B.

## 7. Riesgos y salvaguardas

| Riesgo | Salvaguarda |
|---|---|
| **ToS de YouTube.** Embeber está permitido; **superponer anuncios al reproductor no**. Monetizar alrededor de contenido embebido es zona gris. | Mantener los anuncios **fuera** del reproductor; divulgar patrocinios; no reclamar propiedad del contenido. |
| **Fragilidad del scraping.** La importación de playlists y la detección de lives dependen de scraping (contra ToS, se rompe si YouTube cambia el HTML). Es riesgo de _negocio_, no solo técnico. | No apoyar ingresos críticos solo en el scraping; considerar migrar rutas críticas a API oficial o reforzar _fallbacks_. |
| **Romper la promesa "gratis".** Poner el catálogo tras un muro mata la confianza y la misión. | Cobrar solo por la **capa** (guía, progreso, IA, certificados, comunidad). Enmarcar Pro como "potencia tu aprendizaje", no "desbloquea el contenido". |
| **Pagos LATAM.** Precios en USD y solo tarjeta hunden la conversión. | Medios locales (Mercado Pago/PIX), precios localizados, plan anual. |
| **Privacidad.** Vender datos o añadir cuentas introduce PII. | Insights solo agregados/anonimizados; política de privacidad y ToS antes de B2B. |
| **Conversión optimista.** Freemium en LATAM convierte bajo. | Modelar con conversión realista; sostener la caja temprana con afiliación/patrocinio/B2B mientras crece la audiencia. |

## 8. Próximos pasos concretos

1. **Instrumentar clics salientes** (afiliados) reutilizando el patrón de
   `open_youtube` / `trackEvent`.
2. **Sumar 2–3 programas de afiliados** relevantes (educación + herramientas) y
   colocarlos contextualmente en fichas de recurso y páginas de categoría.
3. **Añadir "Apóyanos"** (Ko-fi/Mercado Pago) discreto en el footer.
4. **Prototipar seguimiento de progreso** (marcar visto / % de ruta) — es la base
   de Pro y mejora la retención aunque sea gratis al inicio.
5. **Escribir política de privacidad y ToS** antes de cualquier paso B2B o de datos.

## 9. Matriz de decisión (resumen)

| Opción | Esfuerzo | Potencial | Encaje con la misión | Tiempo al 1er ingreso |
|---|---|---|---|---|
| Afiliación | Bajo | Medio–alto | Alto | Días |
| Donaciones | Muy bajo | Bajo | Alto | Días |
| Bolsa de empleo | Medio | Alto | Alto | Semanas |
| Patrocinio de rutas | Bajo–medio | Alto | Medio | Con audiencia |
| Clusly Pro (freemium) | Alto | Medio–alto | Alto (si no toca el catálogo) | Meses |
| Clusly para Equipos | Medio–alto | Alto | Alto | Meses |
| White-label / API | Alto | Alto | Medio | Meses+ |
| Datos e insights | Medio | Medio–alto | Medio (cuidar privacidad) | Meses |
| Publicidad display | Bajo | Bajo | Bajo | Días |
