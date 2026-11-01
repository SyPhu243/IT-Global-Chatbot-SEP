
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export async function login(req, res) {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập username và password",
            });
        }

        const result = await pool.query(
            `SELECT id, username, password_hash, role
             FROM users
             WHERE username = $1`,
            [username.trim()]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng",
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("Thiếu JWT_SECRET trong Backend");
            return res.status(500).json({
                success: false,
                message: "Lỗi cấu hình hệ thống",
            });
        }

        const token = jwt.sign(
            {
                sub: String(user.id),
                role: user.role,
            },
            secret,
            {
                expiresIn: "1d",
                algorithm: "HS256",
            }
        );

        return res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            tokenType: "Bearer",
            expiresIn: "1d",
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống",
        });
    }
}
