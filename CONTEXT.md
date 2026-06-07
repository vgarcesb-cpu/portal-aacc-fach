# CONTEXT.md — Portal A/C FACH

## Descripción del proyecto
Portal web de gestión de mantenimiento de equipos de Aire Acondicionado para la Fuerza Aérea de Chile (FACH), unidad Climatización & Energía. Sistema de uso personal, acceso único para Victor Manuel Garces Borje.

## Arquitectura
```
aacc.totis.cl (Cloudflare Access — PIN email)
      ↓
Cloudflare Pages → index.html (frontend estático)
      ↓
Cloudflare Workers → worker.js (API REST)
      ↓
Cloudflare D1 → portal-aacc-fach-db (SQLite)
```

## Stack tecnológico
| Capa | Tecnología | Costo |
|---|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (single file) | Gratis |
| Backend | Cloudflare Workers | Gratis |
| Base de datos | Cloudflare D1 (SQLite) | Gratis |
| Hosting | Cloudflare Pages | Gratis |
| Seguridad | Cloudflare Access | Gratis hasta 50 usuarios |
| Dominio | totis.cl (subdominio aacc) | Ya existente |

## Decisiones de arquitectura
- **Sin login propio** — la autenticación la maneja Cloudflare Access con PIN al email
- **Single file HTML** — todo el frontend en un solo `index.html`, sin frameworks, sin build
- **Sin JWT** — el worker v3.1 valida origen en lugar de tokens
- **CORS restringido** — solo acepta requests desde `https://aacc.totis.cl`

## Módulos del sistema
1. **Dashboard** — resumen de equipos, próximos mantenimientos, últimas bitácoras
2. **Inventario Equipos** — listado completo con filtros, edición inline
3. **Bitácora** — registro de mantenimientos por equipo
4. **Inspecciones** — registro de inspecciones técnicas
5. **Alertas** — mantenimientos vencidos y próximos 30 días
6. **Reportes** — PDF, HTML, Email (EmailJS)
7. **Configuración** — institución, EmailJS, API Worker

## Base de datos D1
**Base:** `portal-aacc-fach-db`
**ID:** `0263cd10-255c-4872-92bb-2398a946aaa3`

### Tablas
- `equipos` — inventario de 29 equipos FACH
- `bitacora_mantenimiento` — registros de mantenimiento
- `inspecciones` — inspecciones técnicas
- `alertas` — alertas del sistema
- `configuracion` — parámetros del sistema
- `usuarios` — tabla existente pero no usada (sin login)

## Inventario de equipos
- **12 mayores de 40.000 BTU:** TRANE (6), YORK (4), CARRIER (1), LENNOX (1)
- **17 menores de 40.000 BTU:** CLARK (9), TOSHIBA (1), PANASONIC (1), LENNOX (1), SHOOT AIRE (1), YORK (1), WESTING (1)
- **23 activos, 5 fuera de servicio, 1 por baja**

## URLs de producción
- Portal: `https://aacc.totis.cl`
- Pages: `https://portal-aacc-fach.pages.dev`
- Worker: `https://portal-aacc-fach-api.vgarcesb.workers.dev`
- Health: `https://portal-aacc-fach-api.vgarcesb.workers.dev/api/health`

## Cuenta Cloudflare
- Account ID: `5e4da6124230d125dfe16cb63c2b...`
- Subdomain: `vgarcesb.workers.dev`
- Zero Trust: activo con política "Acceso AACC"

## Historial de versiones
| Versión | Descripción |
|---|---|
| v1.0 | Stack React+Express+Railway+MySQL (descartado) |
| v2.0 | Stack Cloudflare — con login y JWT |
| v3.0 | Sin login, validación CF-Access header (bug CORS) |
| v3.1 | Sin login, validación por origen `aacc.totis.cl` ✅ |

## Flujo de trabajo
1. Editar `index.html` o `worker.js` en GitHub con el lápiz ✏️
2. Hacer commit
3. Pages actualiza automáticamente en ~30 segundos (frontend)
4. Para el Worker: copiar y pegar en el editor web de Cloudflare → Deploy

## Autor
Victor Manuel Garces Borje (Toti's)
totis.cl · vgarcesb@gmail.com · Santiago, Chile · 2026
