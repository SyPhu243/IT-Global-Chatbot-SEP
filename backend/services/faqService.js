import pool from "../db.js";
import { getEmbedding } from "../utils/textProcessor.js";

export async function updateFaqEmbedding(faqId, question, answer) {
    try {
        // 1. Gom nội dung để tạo ngữ cảnh tốt nhất cho AI
        const combinedText = `Câu hỏi: ${question}\nTrả lời: ${answer}`;

        // 2. Gọi hàm getEmbedding sẵn có để lấy vector từ Gemini
        console.log(`⏳ Đang tạo vector cho FAQ ID: ${faqId}...`);
        const embeddingVector = await getEmbedding(combinedText);
        const embeddingString = `[${embeddingVector.join(",")}]`; 

        // 3. Cập nhật vào DB
        const query = `
            UPDATE faqs 
            SET embedding = $1 
            WHERE id = $2 
            RETURNING id;
        `;
        const result = await pool.query(query, [embeddingString, faqId]);

        if (result.rowCount === 0) {
            console.warn(`⚠️ Cảnh báo: Không tìm thấy FAQ ID ${faqId} để cập nhật vector.`);
            return false;
        }

        console.log(`✅ Cập nhật vector thành công cho FAQ ID: ${faqId}`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi khi cập nhật vector FAQ ID ${faqId}:`, error.message);
        return false;
    }
}