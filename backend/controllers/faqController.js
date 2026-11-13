import pool from "../db.js";
import { updateFaqEmbedding } from "../services/faqService.js";
import { loadFAQsToCache } from "../services/chatService.js";

function triggerEmbedding(faq) {
    setImmediate(() => {
        Promise.resolve()
            .then(() => updateFaqEmbedding(
                faq.id,
                faq.question,
                faq.answer
            ))
            .catch((error) => {
                console.error(
                    `Lỗi embedding FAQ ${faq.id}:`,
                    error
                );
            });
    });
}

function isValidId(value) {
    return /^\d+$/.test(String(value)) &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0;
}

function validateFaq(body) {
    const { question, answer, category = null } = body ?? {};

    if (
        typeof question !== "string" ||
        !question.trim() ||
        typeof answer !== "string" ||
        !answer.trim()
    ) {
        return {
            error: "question và answer phải là chuỗi không rỗng"
        };
    }

    if (
        category !== null &&
        (typeof category !== "string" ||
            category.length > 100)
    ) {
        return {
            error: "category phải là chuỗi tối đa 100 ký tự hoặc null"
        };
    }

    return {
        value: {
            question: question.trim(),
            answer: answer.trim(),
            category: category === null
                ? null
                : category.trim()
        }
    };
}

// GET /api/faqs
export async function getFaqs(req, res, next) {
    try {
        const result = await pool.query(`
            SELECT id, question, answer, category, created_at
            FROM faqs
            ORDER BY id DESC
        `);

        return res.status(200).json({
            success: true,
            total: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/faqs
export async function createFaq(req, res) { // Xóa bỏ tham số 'next'
    try {
        const validation = validateFaq(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { question, answer, category } = validation.value;

        const result = await pool.query(`
            INSERT INTO faqs (question, answer, category)
            VALUES ($1, $2, $3)
            RETURNING id, question, answer, category, created_at
        `, [question, answer, category]);

        const faq = result.rows[0];

        // ⚡ GỌI ĐỒNG BỘ RAM NGAY LẬP TỨC
        await loadFAQsToCache();

        res.status(201).json({
            success: true,
            message: "Thêm FAQ thành công",
            data: faq
        });

        triggerEmbedding(faq);
    } catch (error) {
        // IN LỖI RA CONSOLE ĐỂ KIỂM TRA
        console.error("❌ Lỗi khi thêm FAQ:", error); 
        
        // TRẢ VỀ JSON LỖI RÕ RÀNG CHO FRONTEND
        res.status(500).json({ 
            success: false, 
            message: "Lỗi máy chủ khi thêm FAQ", 
            error: error.message 
        });
    }
}

// PUT /api/faqs/:id
export async function updateFaq(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID FAQ không hợp lệ"
            });
        }

        const validation = validateFaq(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { question, answer, category } = validation.value;

        const result = await pool.query(`
            UPDATE faqs
            SET question = $1,
                answer = $2,
                category = $3,
                updated_at = CURRENT_TIMESTAMP,
                embedding = NULL
            WHERE id = $4
            RETURNING id, question, answer, category, created_at
        `, [
            question,
            answer,
            category,
            Number(req.params.id)
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy FAQ"
            });
        }

        const faq = result.rows[0];

        // ⚡ GỌI ĐỒNG BỘ RAM NGAY LẬP TỨC
        await loadFAQsToCache();

        res.status(200).json({
            success: true,
            message: "Cập nhật FAQ thành công",
            data: faq
        });

        triggerEmbedding(faq);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/faqs/:id
export async function deleteFaq(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "ID FAQ không hợp lệ"
            });
        }

        const result = await pool.query(`
            DELETE FROM faqs
            WHERE id = $1
            RETURNING id
        `, [Number(req.params.id)]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy FAQ"
            });
        }

        // ⚡ GỌI ĐỒNG BỘ RAM NGAY LẬP TỨC
        await loadFAQsToCache();

        return res.status(200).json({
            success: true,
            message: "Xóa FAQ thành công",
            deletedId: result.rows[0].id
        });
    } catch (error) {
        next(error);
    }
}