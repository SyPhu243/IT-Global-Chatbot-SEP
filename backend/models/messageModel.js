import pool from "../db.js";

export async function createMessage({ sessionId, sender, content }) {
    const { rows } = await pool.query(
        `INSERT INTO messages (session_id, sender, content)
         VALUES ($1, $2, $3)
         RETURNING id, session_id, sender, content, created_at`,
        [sessionId, sender, content]
    );
    return rows[0];
}

export async function getMessagesBySession(sessionId) {
    const { rows } = await pool.query(
        `SELECT id, session_id, sender, content, created_at
         FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC, id ASC`,
        [sessionId]
    );
    return rows;
}

export async function findMessageById(id) {
    const { rows } = await pool.query(
        `SELECT id, sender, rating
         FROM messages
         WHERE id = $1`,
        [id]
    );

    return rows[0] ?? null;
}

export async function updateMessageRating(id, rating) {
    const { rows } = await pool.query(
        `UPDATE messages
         SET rating = $1
         WHERE id = $2 AND sender = 'bot'
         RETURNING id, session_id, sender, rating`,
        [rating, id]
    );

    return rows[0] ?? null;
}
