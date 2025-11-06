# CabaPro Node Gateway (Árbitros)

Servicio Express que consume la API de Spring Boot y expone solamente funcionalidades del rol **ÁRBITRO**: autenticación, registro, perfil, asignaciones (listar/aceptar/rechazar), liquidaciones (listar/detalle/PDF), partidos (listar/detalle) y acceso al dashboard.

## Requisitos
- Node.js >= 20
- API de Spring Boot corriendo (por defecto: `http://localhost:8080`)

## Configuración
Crea/edita `.env` en la carpeta `API/` (ya existe un ejemplo):

```
PORT=3000
# Puedes usar cualquiera de las dos, el servicio normaliza la URL (quita /api si lo traes ya incluido)
CABAPRO_API_URL=http://localhost:8080/api
# SPRING_API_URL=http://localhost:8080
```

> Nota: El cliente interno concatena rutas como `/api/...`. Si defines `CABAPRO_API_URL=http://localhost:8080/api` se normaliza a `http://localhost:8080` para evitar `/api/api` duplicado.

## Instalar dependencias
En PowerShell:

```powershell
npm.cmd install
```

## Ejecutar
```powershell
npm.cmd run dev   # recarga con nodemon
# o
npm.cmd start     # node server.js
```

Deberías ver:
```
Servicio API CABA PRO escuchando en el puerto 3000
Consumiendo API CabaPro en http://localhost:8080
```

Healthcheck:
```powershell
Invoke-RestMethod http://localhost:3000/health
```

## Probar endpoints (PowerShell)

### 1) Registro
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/register -ContentType application/json -Body '{
  "correo": "arbitro@example.com",
  "contrasena": "123456",
  "nombre": "Juan Perez",
  "especialidad": "PRINCIPAL",
  "escalafon": "PRIMERA"
}'
```

### 2) Login (capturar token)
```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType application/json -Body '{
  "correo": "arbitro@example.com",
  "contrasena": "123456"
}'
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }
$token
```

### 3) Perfil del árbitro
```powershell
Invoke-RestMethod -Headers $headers http://localhost:3000/api/arbitros/me
```

### 4) Actualizar perfil
```powershell
Invoke-RestMethod -Method Put -Headers $headers -Uri http://localhost:3000/api/arbitros/me -ContentType application/json -Body '{
  "nombre": "Juan P. Actualizado",
  "especialidad": "PRINCIPAL",
  "escalafon": "PRIMERA",
  "fotoPerfilUrl": "https://example.com/foto.jpg"
}'
```

### 5) Asignaciones
- Listar (pendientes por defecto):
```powershell
Invoke-RestMethod -Headers $headers 'http://localhost:3000/api/arbitros/asignaciones'
```
- Listar aceptadas:
```powershell
Invoke-RestMethod -Headers $headers 'http://localhost:3000/api/arbitros/asignaciones?estado=aceptada'
```
- Aceptar una asignación:
```powershell
Invoke-RestMethod -Method Post -Headers $headers http://localhost:3000/api/arbitros/asignaciones/123/aceptar
```
- Rechazar una asignación:
```powershell
Invoke-RestMethod -Method Post -Headers $headers http://localhost:3000/api/arbitros/asignaciones/123/rechazar
```

### 6) Liquidaciones
- Listar:
```powershell
Invoke-RestMethod -Headers $headers http://localhost:3000/api/arbitros/liquidaciones
```
- Detalle:
```powershell
Invoke-RestMethod -Headers $headers http://localhost:3000/api/arbitros/liquidaciones/55
```
- Descargar PDF:
```powershell
Invoke-WebRequest -Headers $headers -OutFile liq55.pdf http://localhost:3000/api/arbitros/liquidaciones/55/pdf
```

Nota: Actualmente NO hay endpoint para “generar” liquidaciones desde Node porque tu API de Spring no lo expone. Si más adelante lo agregas en Spring, podemos exponerlo aquí.

### 7) Partidos
- Listar paginado:
```powershell
Invoke-RestMethod -Headers $headers 'http://localhost:3000/api/arbitros/partidos?page=0&size=10'
```
- Detalle:
```powershell
Invoke-RestMethod -Headers $headers http://localhost:3000/api/arbitros/partidos/77
```

### 8) Dashboard del árbitro (sin front)
- Redirección directa (abre el dashboard servido por Spring en tu navegador):
```powershell
Start-Process "http://localhost:3000/api/arbitros/dashboard"
```
- Modo proxy (devuelve el HTML al cliente):
```powershell
Invoke-WebRequest -Headers $headers 'http://localhost:3000/api/arbitros/dashboard?mode=proxy' | Select-Object -ExpandProperty Content
```

## Notas
- Todas las rutas protegidas necesitan el header `Authorization: Bearer <token>` devuelto por el login/registro.
- Los errores de la API de Spring se propagan con su `status` y `data` para facilitar el debug.
- Si PowerShell bloquea `npm`, usa `npm.cmd` o ejecuta `powershell -ExecutionPolicy Bypass -NoProfile` temporalmente.

## Estructura relevante
```
API/
├─ app.js                # inicializa Express (createApp)
├─ server.js             # arranque del servidor
├─ services/
│  └─ CabaProApi.js      # cliente HTTP a Spring (solo ARBITRO)
├─ controllers/
│  └─ ArbitroController.js
├─ middleware/
│  └─ auth.js            # exige header Authorization
├─ routes/
│  ├─ auth.js            # /api/auth (register, login)
│  └─ arbitros.js        # /api/arbitros (...)
├─ apispring.json        # especificación OpenAPI (temporal)
├─ .env                  # config local
└─ package.json
```
