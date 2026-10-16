# Propuesta (fase futura): buscador de lives con IA

> **Estado: no implementado.** Este documento es el plan para decidir si se construye.

## La idea

Que cualquier persona escriba lo que quiere aprender —

> "¿en qué live explicaron cómo usar Claude Code?"
> "me perdí el live donde hablaron del terremoto de Venezuela"

— y la plataforma responda con los lives exactos donde se tocó ese tema, listos para
reproducir.

## Cómo funcionaría

### Paso 1 — Enriquecimiento (una sola vez por video)

La API de Gemini (Google AI Studio, **capa gratuita**, sin relación con la YouTube Data
API) acepta URLs de YouTube como entrada multimodal: se le pasa la URL del live y
devuelve de qué trata. Por cada video se genera **una vez** y se guarda:

```
video_insights
├── video_id     (FK lógico a streams)
├── summary      (resumen en español, 2-3 párrafos)
├── topics       (text[] — p. ej. {claude-code, agentes, mcp})
├── model        (p. ej. gemini-2.5-flash)
└── created_at
```

- Disparado **manualmente desde /admin** (botón "Generar resumen"), para respetar los
  límites de la capa gratuita (~10-15 solicitudes/minuto, cuota diaria).
- Migración aditiva (tabla nueva); cero impacto en lo existente.
- Costo: $0 en la capa gratuita; los resúmenes se cachean para siempre.

### Paso 2 — Búsqueda

`POST /api/ask` con la pregunta del usuario:

1. Se cargan los resúmenes de todos los videos (hoy ~23; caben holgadamente en el
   contexto del modelo).
2. Un solo prompt: *"Dada esta pregunta y estos resúmenes, devuelve los video_id
   relevantes ordenados, con una frase de por qué."*
3. La UI muestra los resultados como tarjetas reproducibles (reutilizando
   `VideoListItem`).

### Paso 3 — Fallback sin IA

Si no hay `GEMINI_API_KEY` o se agotó la cuota: búsqueda full-text en Postgres con
diccionario español sobre título + resumen:

```sql
ALTER TABLE video_insights ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(summary,''))) STORED;
CREATE INDEX ON video_insights USING gin(fts);
```

La caja de búsqueda funciona siempre; la IA la hace más inteligente cuando está
disponible.

## Requisitos para implementarlo

| Qué | Detalle |
|---|---|
| `GEMINI_API_KEY` | Crear en [aistudio.google.com](https://aistudio.google.com) (cuenta Google; independiente de la YouTube Data API) |
| Migración | Tabla `video_insights` (aditiva) |
| Backend | `/api/ask` + acción de enriquecimiento en `/api/admin` |
| UI | Caja de búsqueda sobre la lista lateral + estado de resultados |

## Riesgos y mitigaciones

- **Cuota gratuita limitada** → enriquecimiento manual y por lotes; resúmenes cacheados.
- **El modelo no puede ver el video** (URL privada/bloqueada) → fallback: resumir a
  partir del título; marcar `summary` como "solo título".
- **Costo futuro si crece** → el diseño permite cambiar de proveedor (los resúmenes ya
  guardados no se pierden; solo cambia quién responde la búsqueda).
