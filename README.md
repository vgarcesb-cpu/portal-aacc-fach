# ❄️ Portal A/C FACH — Climatización & Energía

Sistema de gestión de mantenimiento de equipos de Aire Acondicionado para la Fuerza Aérea de Chile.

**Stack:** Cloudflare Workers (backend) + Cloudflare D1 (base de datos) + GitHub Pages (frontend) — **100% gratuito.**

---

## 📂 Archivos del repositorio

| Archivo | Descripción |
|---|---|
| `index.html` | Frontend completo — HTML + CSS + JS en un solo archivo |
| `worker.js` | Backend API REST — Cloudflare Workers |
| `schema.sql` | Base de datos D1 — 29 equipos FACH precargados |
| `wrangler.toml` | Configuración del Worker |

---

## 🚀 Despliegue paso a paso (100% visual, sin terminal)

### PASO 1 — Crear la base de datos D1

1. Ir a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages → D1 SQL Database → Create database**
3. Nombre: `portal-aacc-fach-db`
4. Copiar el **Database ID**
5. Pestaña **Console** → pegar el contenido de `schema.sql` → **Execute**

### PASO 2 — Actualizar wrangler.toml

1. En GitHub, editar `wrangler.toml` con el lápiz ✏️
2. Reemplazar `REEMPLAZAR_CON_TU_DATABASE_ID` con el ID copiado
3. Commit

### PASO 3 — Crear el Worker (backend API)

1. **Workers & Pages → Create → Create Worker**
2. Nombre: `portal-aacc-fach-api` → **Deploy**
3. **Edit code** → borrar todo → pegar contenido de `worker.js` → **Deploy**
4. Pestaña **Settings → Variables**:
   - `JWT_SECRET` = una contraseña segura (mínimo 32 caracteres)
5. Pestaña **Settings → D1 Database Bindings**:
   - Variable: `DB` → seleccionar `portal-aacc-fach-db`
6. **Save and Deploy**
7. Copiar la URL del Worker: `https://portal-aacc-fach-api.TU-USUARIO.workers.dev`

### PASO 4 — Desplegar el frontend en Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git**
2. Seleccionar este repositorio
3. Configuración de build: **Framework preset = None**, dejar todo vacío
4. **Save and Deploy**

### PASO 5 — Conectar el frontend al backend

1. Abrir la URL de Pages en el navegador
2. Ir a **⚙️ Configuración → API Worker**
3. Pegar la URL del Worker del Paso 3
4. Clic en **Probar Conexión** → debe aparecer ✅
5. **Guardar Configuración**

### PASO 6 — Primer login

| Campo | Valor por defecto |
|---|---|
| Email | `admin@fach.cl` |
| Contraseña | `Admin2024!` |

> ⚠️ Cambiar la contraseña del administrador después del primer login.

---

## 🔄 Actualizaciones diarias

- **Frontend:** Editar `index.html` en GitHub con ✏️ → Commit → Cloudflare Pages actualiza automáticamente
- **Backend:** Editar `worker.js` en GitHub → Copiar y pegar en el editor web del Worker → Deploy

---

## 📊 Inventario precargado

El `schema.sql` incluye los **29 equipos reales FACH**:
- 12 equipos Mayores de 40.000 BTU (TRANE, YORK, CARRIER, LENNOX)
- 17 equipos Menores de 40.000 BTU (CLARK, TOSHIBA, PANASONIC, SHOOT AIRE, YORK, WESTING)

---

## 👨‍💻 Autor

Victor Manuel Garces Borje — [totis.cl](https://totis.cl)
