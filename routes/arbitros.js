const express = require('express')
const router = express.Router()

const requireAuth = require('../middleware/auth')
const ArbitroController = require('../controllers/ArbitroController')

// Perfil
router.get('/me', requireAuth, ArbitroController.getProfile)
router.put('/me', requireAuth, ArbitroController.updateProfile)

// Asignaciones
router.get('/asignaciones', requireAuth, ArbitroController.listAsignaciones)
router.post('/asignaciones/:id/aceptar', requireAuth, ArbitroController.aceptarAsignacion)
router.post('/asignaciones/:id/rechazar', requireAuth, ArbitroController.rechazarAsignacion)

// Liquidaciones
router.get('/liquidaciones', requireAuth, ArbitroController.listLiquidaciones)
router.get('/liquidaciones/:id', requireAuth, ArbitroController.getLiquidacion)
router.get('/liquidaciones/:id/pdf', requireAuth, ArbitroController.downloadLiquidacionPdf)

// Partidos (para dashboard)
router.get('/partidos', requireAuth, ArbitroController.listPartidos)
router.get('/partidos/:id', requireAuth, ArbitroController.getPartido)

// Dashboard
router.get('/dashboard', requireAuth, ArbitroController.dashboard)

module.exports = router
