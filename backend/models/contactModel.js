import pool from "../db.js";

export async function createContact({ fullName, email, phone, message, source }) {
    const result = await pool.query(
        `INSERT INTO contacts (full_name, email, phone, message, source)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id,
                   full_name AS "fullName",
                   email, phone, message, source,
                   is_masked AS "isMasked",
                   status,
                   created_at AS "createdAt"`,
        [fullName, email, phone, message, source]
    );
    return result.rows[0];
}