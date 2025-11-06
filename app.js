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
    try {
        const spec = require(path.join(__dirname, 'docs', 'openapi.json'))
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
    } catch (e) {
        // opcional: no bloquear si aún no existe el spec
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