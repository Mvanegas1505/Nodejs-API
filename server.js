const { createApp } = require('./app')

const PORT = Number(process.env.PORT) || 3000
const app = createApp()

app.listen(PORT, () => {
    const base = process.env.SPRING_API_URL || process.env.CABAPRO_API_URL || 'http://localhost:8080'
    console.log(`Servicio API CABA PRO escuchando en el puerto ${PORT}`)
    console.log(`Consumiendo API CabaPro en ${base}`)
})