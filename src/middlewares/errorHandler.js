const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: true,
        message: err.message || "Error interno del servidor",
    });
};

const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: true,
        message: `La ruta ${req.originalUrl} no existe`
    });
};

module.exports = { errorHandler, notFoundHandler };