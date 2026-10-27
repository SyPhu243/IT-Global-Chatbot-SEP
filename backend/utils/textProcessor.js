import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const readDocument = (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error("Lỗi đọc file:", error);
        return "";
    }
};

const chunkText = (text, maxChunkSize = 500, overlap = 50) => {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        let chunk = text.slice(i, i + maxChunkSize);
        chunks.push(chunk);
        i += (maxChunkSize - overlap);
    }
    return chunks;
};

const getEmbedding = async (textChunk) => {
    try {
        const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await embedModel.embedContent(textChunk);
        const vector = result.embedding.values.slice(0, 768);
        return vector; 
    } catch (error) {
        console.error("Lỗi lấy Embedding qua SDK:", error);
        throw error;
    }
};

const processAndSaveDocument = async (filePath, dbClient) => {
    const text = readDocument(filePath);
    const chunks = chunkText(text, 500, 50); 
    
    for (const chunk of chunks) {
        const vector = await getEmbedding(chunk);
        const query = `INSERT INTO knowledge_chunks (content, embedding) VALUES ($1, $2)`;
        await dbClient.query(query, [chunk, JSON.stringify(vector)]);
    }
    console.log("Đã lưu xong tài liệu vào Vector DB! Tối đa 500 ký tự.");
};

export { processAndSaveDocument, getEmbedding, chunkText };