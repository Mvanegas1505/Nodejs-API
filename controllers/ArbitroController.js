const CabaProApi = require('../services/CabaProApi')

function isStream(obj) {
    return obj && typeof obj === 'object' && (typeof obj.pipe === 'function' || obj.readable === true)
}

function jsonOrError(res, err) {
    const status = err?.status || 500
    let payload = err?.data
    // Evitar enviar streams u objetos con referencias circulares
    if (!payload || isStream(payload)) {
        payload = { success: false, message: err?.message || 'Error' }
    }
    try {
        return res.status(status).json(payload)
    } catch (e) {
        return res.status(status).json({ success: false, message: err?.message || e?.message || 'Error' })
    }
}

exports.getProfile = async (req, res) => {
    try {
        const data = await CabaProApi.getProfile(req.token)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const data = await CabaProApi.updateProfile(req.token, req.body)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.listAsignaciones = async (req, res) => {
    try {
        const data = await CabaProApi.listAsignaciones(req.token, req.query.estado)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.aceptarAsignacion = async (req, res) => {
    try {
        const data = await CabaProApi.aceptarAsignacion(req.token, req.params.id)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.rechazarAsignacion = async (req, res) => {
    try {
        const data = await CabaProApi.rechazarAsignacion(req.token, req.params.id)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.listLiquidaciones = async (req, res) => {
    try {
        const data = await CabaProApi.listLiquidaciones(req.token)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.getLiquidacion = async (req, res) => {
    try {
        const data = await CabaProApi.getLiquidacion(req.token, req.params.id)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.downloadLiquidacionPdf = async (req, res) => {
    try {
        const { stream, headers } = await CabaProApi.downloadLiquidacionPdf(req.token, req.params.id)
        // Propagar encabezados útiles
        if (headers['content-type']) res.setHeader('Content-Type', headers['content-type'])
        else res.setHeader('Content-Type', 'application/pdf')
        if (headers['content-disposition']) res.setHeader('Content-Disposition', headers['content-disposition'])
        else res.setHeader('Content-Disposition', `attachment; filename="liquidacion_${req.params.id}.pdf"`)
        stream.on('error', (e) => {
            console.error('Error en stream PDF:', e)
            if (!res.headersSent) res.status(500)
            res.end()
        })
        stream.pipe(res)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.listPartidos = async (req, res) => {
    try {
        const data = await CabaProApi.listPartidos(req.token, { page: req.query.page ? Number(req.query.page) : undefined, size: req.query.size ? Number(req.query.size) : undefined })
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.getPartido = async (req, res) => {
    try {
        const data = await CabaProApi.getPartido(req.token, req.params.id)
        res.json(data)
    } catch (err) {
        jsonOrError(res, err)
    }
}

exports.dashboard = async (req, res) => {
    try {
        // Por defecto: proxy (más amigable en navegador, evita problemas de Authorization en redirecciones)
        if (!req.query.mode || (req.query.mode || '').toLowerCase() === 'proxy') {
            const { html, headers } = await CabaProApi.getDashboardHtml(req.token)
            res.setHeader('Content-Type', headers['content-type'] || 'text/html; charset=utf-8')
            return res.send(html)
        }
        // Redirección 302 al dashboard en Spring (opción por defecto)
        return res.redirect(302, CabaProApi.dashboardRedirectUrl())
    } catch (err) {
        jsonOrError(res, err)
    }
}

