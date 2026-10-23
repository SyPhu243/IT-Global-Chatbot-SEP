
import "dotenv/config";
import pool from "../db.js";

const MODEL =
    process.env.EMBEDDING_MODEL || "gemini-embedding-001";

const DIMENSIONS = 768;


//  CHUYỂN TEXT THÀNH EMBEDDING VECTOR


async function createEmbedding(text) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Thiếu GEMINI_API_KEY");
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },

            body: JSON.stringify({
                model: `models/${MODEL}`,

                content: {
                    parts: [
                        {
                            text: text
                        }
                    ]
                },

                // Cấu hình trực tiếp tại cấp request
                taskType: "RETRIEVAL_DOCUMENT",
                outputDimensionality: DIMENSIONS
            }),

            signal: AbortSignal.timeout(30000)
        }
    );

    // Kiểm tra API response
    if (!response.ok) {
        const errorBody = await response.text();

        console.error(
            `[Embedding] HTTP ${response.status}:`,
            errorBody.slice(0, 500)
        );

        throw new Error(
            `Embedding API lỗi HTTP ${response.status}`
        );
    }

    const data = await response.json();
    const vector = data.embedding?.values;

    // Ghi log kiểm tra embedding
    console.log("[Embedding] Model:", MODEL);

    console.log(
        "[Embedding] Số chiều:",
        Array.isArray(vector)
            ? vector.length
            : "Không có vector"
    );

    // Kiểm tra vector hợp lệ
    if (
        !Array.isArray(vector) ||
        vector.length !== DIMENSIONS ||
        !vector.every(
            value => typeof value === "number" &&
                Number.isFinite(value)
        )
    ) {
        throw new Error(
            `Embedding không hợp lệ. Yêu cầu ${DIMENSIONS} chiều`
        );
    }

    return vector;
}


//  LẤY DỮ LIỆU MỚI TỪ POSTGRESQL


export async function runVectorPipeline() {
    console.log("[Pipeline] Bắt đầu xử lý dữ liệu");

    const { rows } = await pool.query(`
        SELECT id
        FROM contacts
        WHERE status = 'new'
        ORDER BY created_at ASC, id ASC
        LIMIT 20
    `);

    console.log(
        `[Pipeline] Tìm thấy ${rows.length} bản ghi mới`
    );

    let processed = 0;
    let failed = 0;


    //  XỬ LÝ TỪNG RECORD


    for (const { id } of rows) {
        // Đánh dấu đang xử lý
        const claim = await pool.query(`
            UPDATE contacts
            SET status = 'processing'
            WHERE id = $1 AND status = 'new'
            RETURNING id, message, source
        `, [id]);

        // Bỏ qua nếu đã được worker khác xử lý
        if (claim.rows.length === 0) {
            continue;
        }

        const contact = claim.rows[0];

        try {
            const content = contact.message?.trim();

            if (!content) {
                throw new Error(
                    "Nội dung message trống"
                );
            }

            console.log(
                `[Pipeline] Đang xử lý ID=${contact.id}`
            );

            // Gọi Gemini Embedding API
            const embedding = await createEmbedding(content);

            // Metadata lưu vào Vector DB
            const metadata = {
                source: "contacts",
                source_id: contact.id,
                record_source: contact.source,
                embedding_model: MODEL,
                embedding_dimensions: DIMENSIONS
            };


            // LƯU VÀO VECTOR DATABASE


            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                // Insert vector + metadata
                await client.query(`
                    INSERT INTO knowledge_chunks
                        (content, metadata, embedding)
                    VALUES ($1, $2::jsonb, $3::vector)
                `, [
                    content,
                    JSON.stringify(metadata),
                    JSON.stringify(embedding)
                ]);


                // UPDATE STATUS PROCESSED


                const updated = await client.query(`
                    UPDATE contacts
                    SET status = 'processed'
                    WHERE id = $1
                      AND status = 'processing'
                    RETURNING id
                `, [contact.id]);

                if (updated.rowCount !== 1) {
                    throw new Error(
                        "Không thể cập nhật status processed"
                    );
                }

                // Lưu transaction
                await client.query("COMMIT");

                processed++;

                console.log(
                    `[Pipeline] Processed ID=${contact.id}`
                );

                console.log(
                    `[Pipeline] Đã lưu vector ${DIMENSIONS} chiều`
                );

            } catch (error) {
                await client.query("ROLLBACK");
                throw error;

            } finally {
                client.release();
            }

        } catch (error) {
            failed++;

            console.error(
                `[Pipeline] Failed ID=${contact.id}: ${error.message}`
            );

            // Trả lại new nếu xử lý thất bại
            try {
                await pool.query(`
                    UPDATE contacts
                    SET status = 'new'
                    WHERE id = $1
                      AND status = 'processing'
                `, [contact.id]);
            } catch (resetError) {
                console.error(
                    `[Pipeline] Không thể reset ID=${contact.id}:`,
                    resetError.message
                );
            }
        }
    }


    // GHI LOG KẾT QUẢ


    console.log(
        `[Pipeline] Hoàn tất: ${processed} thành công, ${failed} thất bại`
    );

    return {
        processed,
        failed
    };
}
