const jwt = require('jsonwebtoken');
// Usa la misma clave que definiste en el microservicio de Auth
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta';

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Guardamos los datos del usuario (id, email) en el objeto request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};