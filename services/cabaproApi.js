"use strict";

// Servicio de integración con la API de Spring Boot (solo funcionalidades de ARBITROS)
// Esta capa NO expone rutas HTTP; se usa desde tus controladores/routers Express.
//
// Base URL configurable por env:
//   SPRING_API_URL      (default: http://localhost:8080)
//   SPRING_API_TIMEOUT  (default: 10000 ms)

const axios = require("axios");

// Permitir CABAPRO_API_URL (compat) o SPRING_API_URL. Normalizamos para evitar /api duplicado
function normalizeBaseUrl(url) {
    if (!url) return "http://localhost:8080";
    let base = String(url).trim();
    // quitar trailing slash
    if (base.endsWith("/")) base = base.slice(0, -1);
    // si termina en /api quitarlo para que nuestras rutas /api/... no dupliquen
    const lower = base.toLowerCase();
    if (lower.endsWith("/api")) base = base.slice(0, -4);
    return base;
}

const SPRING_API_URL = normalizeBaseUrl(
    process.env.SPRING_API_URL || process.env.CABAPRO_API_URL || "http://localhost:8080"
);
const SPRING_API_TIMEOUT = Number(process.env.SPRING_API_TIMEOUT || 10000);

function createClient(token, extra = {}) {
    const headers = { 'Accept': 'application/json', ...extra.headers };
    if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;
    }

    return axios.create({
        baseURL: SPRING_API_URL,
        timeout: SPRING_API_TIMEOUT,
        headers,
        // Por defecto esperamos JSON; los métodos que necesiten otra cosa lo indicarán.
        responseType: extra.responseType || "json",
        validateStatus: (status) => status >= 200 && status < 300, // lanzar en catch si no
    });
}

function normalizeSuccess(resp) {
    // La API Spring usa esquema ApiResponse: { success, message, data, timestamp, statusCode }
    // Devolvemos el objeto completo para que el caller decida qué usar.
    return resp && resp.data !== undefined ? resp.data : resp;
}

function normalizeError(err) {
    // Uniformar errores para controllers
    if (err.response) {
        const { status, data, headers } = err.response;
        const e = new Error(
            (data && (data.message || data.error || JSON.stringify(data))) ||
            `HTTP ${status}`
        );
        e.status = status;
        e.data = data;
        e.headers = headers;
        return e;
    }
    if (err.request) {
        const e = new Error("Sin respuesta del servidor de Spring (timeout/red)");
        e.status = 503;
        e.data = { success: false, message: e.message };
        return e;
    }
    const e = new Error(err.message || "Error desconocido en cliente HTTP");
    e.status = 500;
    e.data = { success: false, message: e.message };
    return e;
}

const CabaProApi = {
    // -------- Auth --------
    /**
     * Registro de árbitro
     * @param {Object} body { correo, contrasena, nombre, especialidad, escalafon }
     * @returns {Promise<ApiResponse<AuthResponse>>}
     */
    async register(body) {
        const client = createClient();
        try {
            const resp = await client.post("/api/auth/register", body, {
                headers: { 'Content-Type': 'application/json' }
            });
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Login de árbitro
     * @param {Object} body { correo, contrasena }
     * @returns {Promise<ApiResponse<AuthResponse>>}
     */
    async login(body) {
        const client = createClient();
        try {
            const resp = await client.post("/api/auth/login", body, {
                headers: { 'Content-Type': 'application/json' }
            });
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    // -------- Perfil árbitro --------
    /**
     * Obtiene el perfil del árbitro autenticado
     * @param {string} token Bearer token o token sin prefijo
     */
    async getProfile(token) {
        const client = createClient(token);
        try {
            const resp = await client.get("/api/arbitro/me");
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Actualiza el perfil del árbitro autenticado
     * @param {string} token
     * @param {Object} body ArbitroUpdateRequest { nombre, especialidad, escalafon, fotoPerfilUrl }
     */
    async updateProfile(token, body) {
        const client = createClient(token);
        try {
            const resp = await client.put("/api/arbitro/me", body);
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    // -------- Asignaciones --------
    /**
     * Lista las asignaciones del árbitro por estado (pendiente/aceptada)
     * @param {string} token
     * @param {"pendiente"|"aceptada"|string} [estado]
     */
    async listAsignaciones(token, estado) {
        const client = createClient(token);
        try {
            const resp = await client.get("/api/arbitro/asignaciones", {
                params: estado ? { estado } : undefined,
            });
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Acepta una asignación
     * @param {string} token
     * @param {number|string} idAsignacion
     */
    async aceptarAsignacion(token, idAsignacion) {
        const client = createClient(token);
        try {
            const resp = await client.post(
                `/api/arbitro/asignaciones/${encodeURIComponent(idAsignacion)}/aceptar`
            );
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Rechaza una asignación
     * @param {string} token
     * @param {number|string} idAsignacion
     */
    async rechazarAsignacion(token, idAsignacion) {
        const client = createClient(token);
        try {
            const resp = await client.post(
                `/api/arbitro/asignaciones/${encodeURIComponent(idAsignacion)}/rechazar`
            );
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    // -------- Liquidaciones --------
    /**
     * Lista liquidaciones del árbitro autenticado
     * @param {string} token
     */
    async listLiquidaciones(token) {
        const client = createClient(token);
        try {
            const resp = await client.get("/api/arbitro/liquidaciones");
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Obtiene detalle de una liquidación
     * @param {string} token
     * @param {number|string} idLiquidacion
     */
    async getLiquidacion(token, idLiquidacion) {
        const client = createClient(token);
        try {
            const resp = await client.get(
                `/api/arbitro/liquidaciones/${encodeURIComponent(idLiquidacion)}`
            );
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Descarga el PDF de una liquidación y retorna stream + headers para que el controller lo entregue sin copiar todo en memoria.
     * @param {string} token
     * @param {number|string} idLiquidacion
     * @returns {Promise<{ stream: import('stream').Readable, headers: any, status: number }>}
     */
    async downloadLiquidacionPdf(token, idLiquidacion) {
        // Nota: cambiamos responseType a 'stream'
        const client = createClient(token, { responseType: "stream" });
        try {
            const resp = await client.get(
                `/api/arbitro/liquidaciones/${encodeURIComponent(idLiquidacion)}/pdf`
            );
            return { stream: resp.data, headers: resp.headers, status: resp.status };
        } catch (err) {
            throw normalizeError(err);
        }
    },

    // -------- Partidos (para dashboard del árbitro) --------
    /**
     * Lista de partidos paginada
     * @param {string} token
     * @param {{page?: number, size?: number}} [opts]
     */
    async listPartidos(token, opts = {}) {
        const client = createClient(token);
        const params = {};
        if (typeof opts.page === "number") params.page = opts.page;
        if (typeof opts.size === "number") params.size = opts.size;
        try {
            const resp = await client.get("/api/partidos", { params: Object.keys(params).length ? params : undefined });
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    /**
     * Detalle de partido
     * @param {string} token
     * @param {number|string} idPartido
     */
    async getPartido(token, idPartido) {
        const client = createClient(token);
        try {
            const resp = await client.get(`/api/partidos/${encodeURIComponent(idPartido)}`);
            return normalizeSuccess(resp);
        } catch (err) {
            throw normalizeError(err);
        }
    },

    // -------- Dashboard (opciones) --------
    /**
     * URL de redirección directa al dashboard HTML servido por Spring (si tu API solo necesita redireccionar).
     * Útil si tu endpoint de Express responde con 302 a esta URL.
     */
    dashboardRedirectUrl() {
        return `${SPRING_API_URL}/arbitro/dashboard`;
    },

    /**
     * Obtiene el HTML del dashboard desde Spring (si prefieres proxyear el contenido desde Node).
     * @param {string} token
     * @returns {Promise<{ html: string, headers: any }>} HTML y headers para re-enviar al cliente.
     */
    async getDashboardHtml(token) {
        // Usamos arraybuffer para conservar bytes y convertir a UTF-8.
        const client = createClient(token, { responseType: "arraybuffer" });
        try {
            const resp = await client.get("/arbitro/dashboard", {
                headers: { Accept: "text/html,application/xhtml+xml" },
            });
            const buf = Buffer.from(resp.data);
            const html = buf.toString("utf8");
            return { html, headers: resp.headers };
        } catch (err) {
            throw normalizeError(err);
        }
    },
};

module.exports = CabaProApi;

// Tipos de referencia (documentación):
// ApiResponse<T> = { success: boolean, message: string, data: T, timestamp?: string, statusCode?: number }
// AuthResponse   = { token: string, profile: { correo, nombre, rol, especialidad, escalafon, fotoPerfilUrl } }

