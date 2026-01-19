// Middleware para capturar errores 500 y personalizados
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Para que tú veas el error en la consola

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: true,
        message: err.message || "Error interno del servidor",
        // Solo mostrar el stack en desarrollo si quisieras
    });
};

// Middleware para capturar errores 404 (Rutas no encontradas)
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: true,
        message: `La ruta ${req.originalUrl} no existe`
    });
};

module.exports = { errorHandler, notFoundHandler };