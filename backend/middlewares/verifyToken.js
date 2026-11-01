
import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
        return res.status(401).json({
            success: false,
            message: "Thiếu hoặc sai định dạng Bearer token",
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: "Lỗi cấu hình hệ thống",
        });
    }

    const token = authorization.replace(/^Bearer\s+/i, "");

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        req.user = {
            id: payload.sub,
            role: payload.role,
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
}
