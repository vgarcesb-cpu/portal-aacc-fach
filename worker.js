/**
 * worker.js - PORTAL A/C FACH v3.1
 * Seguridad: CORS restringido a aacc.totis.cl
 * Cloudflare Access protege el dominio — Worker acepta desde origen autorizado
 * Autor: Victor Manuel Garces Borje (totis.cl)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://aacc.totis.cl',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Validar que el request viene desde aacc.totis.cl
// Cloudflare Access ya garantizó autenticación antes de llegar aquí
function origenAutorizado(request) {
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  // Aceptar desde aacc.totis.cl o desde el propio Worker (health check)
  return origin.includes('aacc.totis.cl') || referer.includes('aacc.totis.cl') || origin === '';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    // Health check siempre público
    if (path === '/api/health' && method === 'GET') {
      return jsonResponse({ status: 'ok', app: 'Portal A/C FACH', version: '3.1.0' });
    }

    // Bloquear acceso desde orígenes no autorizados
    if (!origenAutorizado(request)) {
      return errorResponse('Acceso no autorizado. Use https://aacc.totis.cl', 403);
    }

    // ---- DASHBOARD ----
    if (path === '/api/dashboard' && method === 'GET') return getDashboard(env);

    // ---- EQUIPOS ----
    if (path === '/api/equipos' && method === 'GET') return getEquipos(env, url);
    if (path === '/api/equipos' && method === 'POST') return crearEquipo(request, env);
    if (path.match(/^\/api\/equipos\/\d+$/) && method === 'GET') return getEquipo(env, path);
    if (path.match(/^\/api\/equipos\/\d+$/) && method === 'PUT') return actualizarEquipo(request, env, path);
    if (path.match(/^\/api\/equipos\/\d+$/) && method === 'DELETE') return eliminarEquipo(env, path);

    // ---- BITÁCORA ----
    if (path.match(/^\/api\/equipos\/\d+\/bitacora$/) && method === 'GET') return getBitacora(env, path, url);
    if (path === '/api/bitacora' && method === 'GET') return getBitacoraGeneral(env, url);
    if (path === '/api/bitacora' && method === 'POST') return crearBitacora(request, env);
    if (path.match(/^\/api\/bitacora\/\d+$/) && method === 'PUT') return actualizarBitacora(request, env, path);
    if (path.match(/^\/api\/bitacora\/\d+$/) && method === 'DELETE') return eliminarBitacora(env, path);

    // ---- PRÓXIMOS MANTENIMIENTOS ----
    if (path === '/api/proximos-mantenimientos' && method === 'GET') return getProximosMantenimientos(env, url);

    // ---- ALERTAS ----
    if (path === '/api/alertas' && method === 'GET') return getAlertas(env, url);
    if (path.match(/^\/api\/alertas\/\d+\/resolver$/) && method === 'PUT') return resolverAlerta(env, path);

    // ---- INSPECCIONES ----
    if (path.match(/^\/api\/equipos\/\d+\/inspecciones$/) && method === 'GET') return getInspecciones(env, path);
    if (path === '/api/inspecciones' && method === 'POST') return crearInspeccion(request, env);
    if (path.match(/^\/api\/inspecciones\/\d+$/) && method === 'PUT') return actualizarInspeccion(request, env, path);

    // ---- CONFIGURACIÓN ----
    if (path === '/api/configuracion' && method === 'GET') return getConfiguracion(env);
    if (path === '/api/configuracion' && method === 'PUT') return actualizarConfiguracion(request, env);

    return errorResponse('Ruta no encontrada', 404);
  },
};

async function getDashboard(env) {
  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM equipos').first();
  const activos = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE condicion='ACTIVO'").first();
  const fuera = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE condicion='FUERA_DE_SERVICIO'").first();
  const mantto = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE condicion='EN_MANTENIMIENTO'").first();
  const baja = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE condicion='POR_BAJA'").first();
  const mayores = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE categoria='MAYOR_40000_BTU'").first();
  const menores = await env.DB.prepare("SELECT COUNT(*) as n FROM equipos WHERE categoria='MENOR_40000_BTU'").first();
  const alertasActivas = await env.DB.prepare("SELECT COUNT(*) as n FROM alertas WHERE estado='activa'").first();
  const hoy = new Date().toISOString().split('T')[0];
  const { results: proximos } = await env.DB.prepare(`
    SELECT b.id, b.equipo_id, b.proximo_mantenimiento, b.tecnico,
           e.codigo, e.ubicacion, e.marca, e.modelo
    FROM bitacora_mantenimiento b JOIN equipos e ON b.equipo_id = e.id
    WHERE b.proximo_mantenimiento >= ? ORDER BY b.proximo_mantenimiento ASC LIMIT 5
  `).bind(hoy).all();
  const { results: ultimas } = await env.DB.prepare(`
    SELECT b.*, e.codigo, e.ubicacion, e.marca
    FROM bitacora_mantenimiento b JOIN equipos e ON b.equipo_id = e.id
    ORDER BY b.creado_en DESC LIMIT 5
  `).all();
  return jsonResponse({
    resumen: {
      total: total?.n||0, activos: activos?.n||0, fuera_servicio: fuera?.n||0,
      en_mantenimiento: mantto?.n||0, por_baja: baja?.n||0,
      mayores: mayores?.n||0, menores: menores?.n||0, alertas_activas: alertasActivas?.n||0,
    },
    proximos_mantenimientos: proximos,
    ultimas_bitacoras: ultimas,
  });
}

async function getEquipos(env, url) {
  const categoria = url.searchParams.get('categoria');
  const condicion = url.searchParams.get('condicion');
  const search = url.searchParams.get('search');
  let query = 'SELECT * FROM equipos WHERE 1=1';
  const params = [];
  if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }
  if (condicion) { query += ' AND condicion = ?'; params.push(condicion); }
  if (search) {
    query += ' AND (codigo LIKE ? OR marca LIKE ? OR modelo LIKE ? OR ubicacion LIKE ? OR numero_serie LIKE ?)';
    const s = `%${search}%`; params.push(s,s,s,s,s);
  }
  query += ' ORDER BY categoria, numero';
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results);
}

async function getEquipo(env, path) {
  const id = path.split('/').pop();
  const equipo = await env.DB.prepare('SELECT * FROM equipos WHERE id = ?').bind(id).first();
  if (!equipo) return errorResponse('Equipo no encontrado', 404);
  return jsonResponse(equipo);
}

async function crearEquipo(request, env) {
  const d = await request.json();
  if (!d.codigo || !d.marca) return errorResponse('Código y marca son requeridos');
  try {
    const result = await env.DB.prepare(`
      INSERT INTO equipos (codigo, numero, categoria, tipo, hfc, marca, modelo, numero_serie,
        ubicacion, condicion, fecha_instalacion, capacidad_btu, voltaje, amperaje,
        potencia_kw, empresa_mantenimiento, observaciones)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(d.codigo,d.numero,d.categoria,d.tipo,d.hfc,d.marca,d.modelo,d.numero_serie,
      d.ubicacion,d.condicion||'ACTIVO',d.fecha_instalacion,d.capacidad_btu,d.voltaje,
      d.amperaje,d.potencia_kw,d.empresa_mantenimiento,d.observaciones).run();
    return jsonResponse({ id: result.meta.last_row_id, mensaje: 'Equipo creado' }, 201);
  } catch(e) { return errorResponse('Código ya existe: ' + e.message); }
}

async function actualizarEquipo(request, env, path) {
  const id = path.split('/').pop();
  const d = await request.json();
  await env.DB.prepare(`
    UPDATE equipos SET tipo=?,hfc=?,marca=?,modelo=?,numero_serie=?,ubicacion=?,condicion=?,
      fecha_instalacion=?,capacidad_btu=?,voltaje=?,amperaje=?,potencia_kw=?,
      empresa_mantenimiento=?,observaciones=?,actualizado_en=datetime('now') WHERE id=?
  `).bind(d.tipo,d.hfc,d.marca,d.modelo,d.numero_serie,d.ubicacion,d.condicion,
    d.fecha_instalacion,d.capacidad_btu,d.voltaje,d.amperaje,d.potencia_kw,
    d.empresa_mantenimiento,d.observaciones,id).run();
  return jsonResponse({ mensaje: 'Equipo actualizado' });
}

async function eliminarEquipo(env, path) {
  const id = path.split('/').pop();
  await env.DB.prepare("UPDATE equipos SET condicion='POR_BAJA',actualizado_en=datetime('now') WHERE id=?").bind(id).run();
  return jsonResponse({ mensaje: 'Equipo dado de baja' });
}

async function getBitacora(env, path, url) {
  const equipo_id = path.split('/')[3];
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');
  let query = 'SELECT * FROM bitacora_mantenimiento WHERE equipo_id = ?';
  const params = [equipo_id];
  if (desde) { query += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { query += ' AND fecha <= ?'; params.push(hasta); }
  query += ' ORDER BY fecha DESC, creado_en DESC LIMIT 200';
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results);
}

async function getBitacoraGeneral(env, url) {
  const limite = parseInt(url.searchParams.get('limite') || '50');
  const tipo = url.searchParams.get('tipo');
  let query = `SELECT b.*, e.codigo, e.ubicacion, e.marca, e.modelo, e.categoria
    FROM bitacora_mantenimiento b JOIN equipos e ON b.equipo_id = e.id WHERE 1=1`;
  const params = [];
  if (tipo) { query += ' AND b.tipo_servicio = ?'; params.push(tipo); }
  query += ` ORDER BY b.fecha DESC, b.creado_en DESC LIMIT ${Math.min(limite,200)}`;
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(results);
}

async function crearBitacora(request, env) {
  const d = await request.json();
  if (!d.equipo_id||!d.fecha||!d.tecnico||!d.tipo_servicio||!d.descripcion_trabajo)
    return errorResponse('Campos obligatorios faltantes');
  const result = await env.DB.prepare(`
    INSERT INTO bitacora_mantenimiento
      (equipo_id,fecha,tecnico,tipo_servicio,descripcion_trabajo,
       repuestos_utilizados,costo,proximo_mantenimiento,observaciones)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).bind(d.equipo_id,d.fecha,d.tecnico,d.tipo_servicio,d.descripcion_trabajo,
    d.repuestos_utilizados,d.costo||0,d.proximo_mantenimiento,d.observaciones).run();
  if (d.proximo_mantenimiento) {
    const dias = Math.ceil((new Date(d.proximo_mantenimiento)-new Date())/86400000);
    if (dias<=30) {
      const eq = await env.DB.prepare('SELECT codigo,ubicacion FROM equipos WHERE id=?').bind(d.equipo_id).first();
      await env.DB.prepare(`INSERT INTO alertas (equipo_id,tipo,mensaje,criticidad) VALUES (?,'PROXIMO_MANTENIMIENTO',?,?)`)
        .bind(d.equipo_id,`${eq?.codigo} — ${eq?.ubicacion}: mantenimiento ${d.proximo_mantenimiento}`,dias<=7?'alta':'media').run();
    }
  }
  return jsonResponse({ id: result.meta.last_row_id, mensaje: 'Registro creado' }, 201);
}

async function actualizarBitacora(request, env, path) {
  const id = path.split('/').pop();
  const d = await request.json();
  await env.DB.prepare(`UPDATE bitacora_mantenimiento SET fecha=?,tecnico=?,tipo_servicio=?,
    descripcion_trabajo=?,repuestos_utilizados=?,costo=?,proximo_mantenimiento=?,observaciones=? WHERE id=?`)
    .bind(d.fecha,d.tecnico,d.tipo_servicio,d.descripcion_trabajo,d.repuestos_utilizados,d.costo||0,d.proximo_mantenimiento,d.observaciones,id).run();
  return jsonResponse({ mensaje: 'Registro actualizado' });
}

async function eliminarBitacora(env, path) {
  const id = path.split('/').pop();
  await env.DB.prepare('DELETE FROM bitacora_mantenimiento WHERE id=?').bind(id).run();
  return jsonResponse({ mensaje: 'Registro eliminado' });
}

async function getProximosMantenimientos(env, url) {
  const hoy = new Date().toISOString().split('T')[0];
  const limite = parseInt(url.searchParams.get('limite')||'10');
  const { results } = await env.DB.prepare(`
    SELECT b.id,b.equipo_id,b.proximo_mantenimiento,b.tecnico,
           e.codigo,e.ubicacion,e.marca,e.modelo,e.categoria,e.condicion
    FROM bitacora_mantenimiento b JOIN equipos e ON b.equipo_id=e.id
    WHERE b.proximo_mantenimiento IS NOT NULL AND b.proximo_mantenimiento!=''
    ORDER BY b.proximo_mantenimiento ASC LIMIT ?
  `).bind(limite).all();
  return jsonResponse({
    vencidos: results.filter(r=>r.proximo_mantenimiento<hoy),
    proximos: results.filter(r=>r.proximo_mantenimiento>=hoy)
  });
}

async function getAlertas(env, url) {
  const estado = url.searchParams.get('estado')||'activa';
  const { results } = await env.DB.prepare(`
    SELECT a.*,e.codigo,e.ubicacion FROM alertas a
    LEFT JOIN equipos e ON a.equipo_id=e.id
    WHERE a.estado=? ORDER BY a.fecha_alerta DESC LIMIT 50
  `).bind(estado).all();
  return jsonResponse(results);
}

async function resolverAlerta(env, path) {
  const id = path.split('/')[3];
  await env.DB.prepare("UPDATE alertas SET estado='resuelta',fecha_resolucion=datetime('now') WHERE id=?").bind(id).run();
  return jsonResponse({ mensaje: 'Alerta resuelta' });
}

async function getInspecciones(env, path) {
  const equipo_id = path.split('/')[3];
  const { results } = await env.DB.prepare('SELECT * FROM inspecciones WHERE equipo_id=? ORDER BY fecha_inspeccion DESC').bind(equipo_id).all();
  return jsonResponse(results);
}

async function crearInspeccion(request, env) {
  const d = await request.json();
  const result = await env.DB.prepare(`
    INSERT INTO inspecciones (equipo_id,fecha_inspeccion,tipo_inspeccion,resultado,
      hallazgos,recomendaciones,condicion_general,proxima_inspeccion,inspector,empresa_externa,costo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(d.equipo_id,d.fecha_inspeccion,d.tipo_inspeccion,d.resultado,d.hallazgos,
    d.recomendaciones,d.condicion_general,d.proxima_inspeccion,d.inspector,d.empresa_externa,d.costo||0).run();
  return jsonResponse({ id: result.meta.last_row_id, mensaje: 'Inspección registrada' }, 201);
}

async function actualizarInspeccion(request, env, path) {
  const id = path.split('/').pop();
  const d = await request.json();
  await env.DB.prepare(`UPDATE inspecciones SET resultado=?,hallazgos=?,recomendaciones=?,
    condicion_general=?,proxima_inspeccion=?,empresa_externa=?,costo=? WHERE id=?`)
    .bind(d.resultado,d.hallazgos,d.recomendaciones,d.condicion_general,d.proxima_inspeccion,d.empresa_externa,d.costo||0,id).run();
  return jsonResponse({ mensaje: 'Inspección actualizada' });
}

async function getConfiguracion(env) {
  const { results } = await env.DB.prepare('SELECT clave,valor FROM configuracion').all();
  const config = {};
  results.forEach(r=>{ config[r.clave]=r.valor; });
  return jsonResponse(config);
}

async function actualizarConfiguracion(request, env) {
  const data = await request.json();
  for (const [clave,valor] of Object.entries(data)) {
    await env.DB.prepare("INSERT OR REPLACE INTO configuracion (clave,valor,actualizado_en) VALUES (?,?,datetime('now'))").bind(clave,valor).run();
  }
  return jsonResponse({ mensaje: 'Configuración actualizada' });
}
