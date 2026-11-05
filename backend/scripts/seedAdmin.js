
import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../db.js";

async function seedAdmin() {
    try {
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;

        if (!username || !password) {
            throw new Error(
                "Thiếu ADMIN_USERNAME hoặc ADMIN_PASSWORD trong .env"
            );
        }

        if (password.length < 12) {
            throw new Error("Mật khẩu Admin phải có ít nhất 12 ký tự");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash, role)
             VALUES ($1, $2, 'admin')
             ON CONFLICT (username) DO NOTHING
             RETURNING id, username, role`,
            [username, passwordHash]
        );

        if (result.rowCount === 0) {
            console.log("Tài khoản Admin đã tồn tại.");
        } else {
            console.log("Tạo Admin thành công:", result.rows[0]);
        }
    } catch (error) {
        console.error("Lỗi tạo Admin:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seedAdmin();
