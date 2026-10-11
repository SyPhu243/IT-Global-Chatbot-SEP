import pool from "../db.js";

export async function createSession(ipAddress) {
    const { rows } = await pool.query(
        "INSERT INTO sessions (ip_address) VALUES ($1) RETURNING id, ip_address, created_at",
        [ipAddress]
    );
    return rows[0];
}

export async function findSessionById(id) {
    const { rows } = await pool.query(
        "SELECT id, ip_address, created_at FROM sessions WHERE id = $1",
        [id]
    );
    return rows[0] ?? null;
}