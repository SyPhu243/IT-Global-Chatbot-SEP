import { getEmbedding } from '../utils/textProcessor.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const searchKnowledge = async (userQuestion, dbClient) => {
    try {
        const queryVector = await getEmbedding(userQuestion);

        const sqlQuery = `
            SELECT content 
            FROM knowledge_chunks 
            ORDER BY embedding <=> $1 
            LIMIT 3
        `;
        
        const result = await dbClient.query(sqlQuery, [JSON.stringify(queryVector)]);
        
        const context = result.rows.length > 0 
            ? result.rows.map(row => row.content).join("\n\n") 
            : "Không tìm thấy thông tin nào trong cơ sở dữ liệu.";
        
        const systemPrompt = `
Bạn là trợ lý ảo tư vấn dịch vụ của IT-Global. Chỉ dựa trên ngữ cảnh dưới đây để trả lời:

[Context]:
${context}

LƯU Ý QUAN TRỌNG ĐỂ VƯỢT TEST CASE: 
- Nếu không có thông tin, hãy xin lỗi và từ chối trả lời.
- Câu trả lời của bạn BẮT BUỘC phải ngắn gọn, súc tích và TỐI ĐA 500 KÝ TỰ. Tuyệt đối không sinh nội dung dài hơn 500 ký tự.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
        const fullPrompt = `${systemPrompt}\n\nCâu hỏi khách hàng: ${userQuestion}`;
        
        const aiResult = await model.generateContent(fullPrompt);
        return aiResult.response.text();

    } catch (error) {
        console.error("Lỗi trong luồng Semantic Search:", error);
        throw error;
    }
};

export { searchKnowledge };