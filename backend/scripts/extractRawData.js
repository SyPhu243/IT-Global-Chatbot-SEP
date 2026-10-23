
import "dotenv/config";
import pool from "../db.js";

export async function extractRawData() {
    try {
        const { rows } = await pool.query(
            `SELECT id, message, source, status, created_at
             FROM contacts
             WHERE status = $1
             ORDER BY created_at ASC, id ASC`,
            ["new"]
        );

        console.log(
            `[Extractor] Tìm thấy ${rows.length} bản ghi mới`
        );

        return rows;
    } catch (error) {
        console.error(
            "[Extractor] Lỗi trích xuất:",
            error.message
        );
        throw error;
    }
}
