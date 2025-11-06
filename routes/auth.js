const express = require('express')
const router = express.Router()
const CabaProApi = require('../services/CabaProApi')

// Ayuda cuando acceden por navegador con GET
router.get('/login', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Usa POST /api/auth/login con JSON { correo, contrasena }',
        example: {
            method: 'POST',
            url: '/api/auth/login',
            body: { correo: 'arbitro@example.com', contrasena: '123456' }
        }
    })
})

router.get('/register', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Usa POST /api/auth/register con JSON { correo, contrasena, nombre, especialidad, escalafon }'
    })
})

// Registro de árbitro
router.post('/register', async (req, res, next) => {
    try {
        const result = await CabaProApi.register(req.body)
        // Si viene token, guardarlo en cookie HttpOnly para facilitar flows en navegador
        if (result && result.data && result.data.token) {
            res.cookie('auth_token', result.data.token, {
                httpOnly: true,
                sameSite: 'Lax',
                secure: false, // poner true si usas HTTPS
                maxAge: 1000 * 60 * 60 * 8 // 8 horas
            })
        }
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
})

// Login de árbitro
router.post('/login', async (req, res, next) => {
    try {
        const result = await CabaProApi.login(req.body)
        if (result && result.data && result.data.token) {
            res.cookie('auth_token', result.data.token, {
                httpOnly: true,
                sameSite: 'Lax',
                secure: false,
                maxAge: 1000 * 60 * 60 * 8
            })
        }
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
})

// Logout: limpia cookie con el token (solo afecta a navegador)
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token')
    res.json({ success: true, message: 'Sesión cerrada' })
})

// Adjuntar token vía query para navegador (uso dev). PELIGRO: el token aparece en el historial.
router.get('/attach-token', (req, res) => {
    const token = req.query.token
    if (!token) return res.status(400).json({ success: false, message: 'Falta token' })
    res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 8
    })
    return res.redirect('/api/arbitros/dashboard')
})

module.exports = router
