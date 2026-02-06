"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Don't leak internal details in production
    const response = {
        error: message,
    };
    if (process.env.NODE_ENV === 'development' && err.details) {
        response.details = err.details;
    }
    res.status(statusCode).json(response);
}
//# sourceMappingURL=errorHandler.js.map