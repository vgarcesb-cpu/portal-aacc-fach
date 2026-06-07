[README.md](https://github.com/user-attachments/files/28676587/README.md)
# ❄️ Portal A/C FACH — Climatización & Energía

Sistema de gestión de mantenimiento de equipos de Aire Acondicionado para la Fuerza Aérea de Chile.

**Stack:** Cloudflare Workers (backend) + Cloudflare D1 (base de datos) + Cloudflare Pages (frontend) + Cloudflare Access (seguridad) — **100% gratuito.**

---

## 🔐 Seguridad activa

- **Cloudflare Access** → PIN al email `vgarcesb@gmail.com` — nadie llega al portal sin autenticación
- **CORS restringido** → Worker solo acepta requests desde `https://aacc.totis.cl`
- **Acceso directo al Worker bloqueado** → `portal-aacc-fach-api.vgarcesb.workers.dev` devuelve 403
- **SSL automático** → HTTPS en todo el stack

---

## 📂 Archivos del repositorio

| Archivo | Descripción |
|---|---|
| `index.html` | Frontend completo — HTML + CSS + JS en un solo archivo, sin login |
| `worker.js` | Backend API REST — Cloudflare Workers v3.1, seguridad por origen |
| `schema.sql` | Base de datos D1 — 29 equipos FACH precargados |
| `wrangler.toml` | Configuración del Worker |

---

## 🌐 URLs del sistema

| Recurso | URL |
|---|---|
| Portal (acceso oficial) | `https://aacc.totis.cl` |
| Frontend Pages | `https://portal-aacc-fach.pages.dev` |
| Backend Worker | `https://portal-aacc-fach-api.vgarcesb.workers.dev` |
| Health check | `https://portal-aacc-fach-api.vgarcesb.workers.dev/api/health` |

---

## 🚀 Despliegue inicial (ya realizado)

### PASO 1 — Crear la base de datos D1
1. Ir a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages → D1 SQL Database → Create database**
3. Nombre: `portal-aacc-fach-db`
4. Copiar el **Database ID**
5. Pestaña **Console** → ejecutar `schema.sql` en 4 partes separadas

### PASO 2 — Actualizar wrangler.toml
1. Editar `wrangler.toml` en GitHub con el lápiz ✏️
2. Reemplazar `REEMPLAZAR_CON_TU_DATABASE_ID` con el Database ID real

### PASO 3 — Crear el Worker (backend API)
1. **Workers & Pages → Create → Start with Hello World**
2. Nombre: `portal-aacc-fach-api` → **Deploy**
3. **Edit code** → borrar todo → pegar `worker.js` → **Deploy**
4. **Settings → Variables and Secrets**: agregar `JWT_SECRET`
5. **Bindings → Add binding**: `DB` → `portal-aacc-fach-db`

### PASO 4 — Desplegar frontend en Cloudflare Pages
1. **Workers & Pages → Create → Pages → Import Git repository**
2. Seleccionar `vgarcesb-cpu/portal-aacc-fach`
3. Framework preset: **None** — todo vacío
4. **Save and Deploy**

### PASO 5 — Dominio personalizado
1. DNS de `totis.cl` → agregar CNAME: `aacc` → `portal-aacc-fach.pages.dev` (Proxied)
2. Pages → **Custom domains** → agregar `aacc.totis.cl`

---

## 🔄 Actualizaciones diarias

- **Frontend:** Editar `index.html` en GitHub con ✏️ → Commit → Pages actualiza en ~30 segundos
- **Backend:** Editar `worker.js` en GitHub → Copiar y pegar en el editor web del Worker → Deploy

---

## ⚙️ Configuración del sistema

Al ingresar al portal por primera vez en un navegador nuevo:
1. Ir a **⚙️ Configuración → API Worker**
2. Pegar: `https://portal-aacc-fach-api.vgarcesb.workers.dev`
3. Clic en **Probar Conexión** → debe aparecer ✅ Conectado — Portal A/C FACH v3.1.0
4. Clic en **Guardar Configuración**

---

## 📊 Inventario precargado

El `schema.sql` incluye los **29 equipos reales FACH**:
- 12 equipos Mayores de 40.000 BTU (TRANE, YORK, CARRIER, LENNOX)
- 17 equipos Menores de 40.000 BTU (CLARK, TOSHIBA, PANASONIC, SHOOT AIRE, YORK, WESTING)

---

## 👨‍💻 Autor

Victor Manuel Garces Borje — [totis.cl](https://totis.cl)
