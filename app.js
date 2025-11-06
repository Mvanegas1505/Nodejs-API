const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const os = require('os')
const path = require('path')
const swaggerUi = require('swagger-ui-express')
require('dotenv').config()

function createApp() {
    const app = express()

    // MIDDLEWARES
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cors())
    app.use(cookieParser())

    // RUTAS base
    app.get('/', (req, res) => {
        res.json({
            message: 'Servidor Node.js consumiendo API CABA PRO',
            endpoints: {
                auth: '/api/auth',
                arbitros: '/api/arbitros',
                docs: '/docs',
            }
        })
    })

    // Swagger UI (documentación de esta API Node)
    // Intentamos cargar primero docs/openapi.json; si no existe, usamos docs/openapi-fixed.json (mejorada)
    try {
        // Try loading multiple possible OpenAPI specs: prefer openapi.json, then openapi-clean.json, then openapi-fixed.json
        let spec = null
        const candidates = [
            path.join(__dirname, 'docs', 'openapi.json'),
            path.join(__dirname, 'docs', 'openapi-clean.json'),
            path.join(__dirname, 'docs', 'openapi-fixed.json')
        ]
        for (const p of candidates) {
            try {
                // use require so Node will parse JSON
                spec = require(p)
                if (spec) break
            } catch (err) {
                // ignore and try next
            }
        }
        if (spec) app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
    } catch (e) {
        // don't block startup if swagger fails
        console.warn('Swagger UI could not be initialized:', e && e.message)
    }

    // Importar rutas
    const arbitrosRoutes = require('./routes/arbitros')
    const authRoutes = require('./routes/auth')

    // Usar rutas
    app.use('/api/arbitros', arbitrosRoutes)
    app.use('/api/auth', authRoutes)

    // Healthcheck
    app.get('/health', (req, res) => res.json({ ok: true }))

    // WhoAmI (útil para verificar replicas/containers en Swarm)
    app.get('/whoami', (req, res) => {
        res.json({ hostname: os.hostname(), pid: process.pid, env: process.env.NODE_ENV || 'dev' })
    })

    // Ruta no encontrada
    app.use((req, res, next) => {
        res.status(404).json({ error: 'Ruta no encontrada' })
    })

    // Manejador de errores general
    app.use((err, req, res, next) => {
        console.error('Error', err)
        const status = err.status || 500
        const payload = err.data || { error: 'Error interno del servidor', mensaje: err.message }
        res.status(status).json(payload)
    })

    return app
}

module.exports = { createApp }