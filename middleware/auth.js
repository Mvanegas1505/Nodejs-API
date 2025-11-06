module.exports = function requireAuth(req, res, next) {
    let token = req.get('Authorization')
    if (!token && req.cookies && req.cookies.auth_token) {
        token = `Bearer ${req.cookies.auth_token}`
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Falta token (Authorization: Bearer <token> o cookie auth_token)' })
    }
    req.token = token
    next()
}
