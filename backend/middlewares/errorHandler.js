
export function errorHandler(error, req, res, next) {
    console.error("[BACKEND ERROR]", {
        method: req.method,
        path: req.originalUrl,
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    // Nếu response đã được gửi, chuyển cho Express xử lý
    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        status: "error",
        message: "Internal Server Error"
    });
}
