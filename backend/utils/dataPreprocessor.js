import { chunkText } from './textProcessor.js'; 

const cleanData = (rawString) => {
    if (!rawString) return "";
    // Xóa thẻ HTML
    let cleanedString = rawString.replace(/<[^>]*>?/gm, '');
    // Giữ lại chữ cái Unicode (tiếng Việt), số, khoảng trắng và dấu câu cơ bản
    cleanedString = cleanedString.replace(/[^\p{L}\p{N}\s.,!?\-]/gu, '').replace(/\s+/g, ' ').trim();
    return cleanedString;
};

const preprocessDataPipeline = async (rawDataRecord, dbClient) => {
    try {
        const cleanedContent = cleanData(rawDataRecord.raw_content);
        const chunks500 = chunkText(cleanedContent, 500, 50);
        
        const structuredData = {
            id: rawDataRecord.id,
            source: rawDataRecord.source || "IT-Global",
            clean_content_chunks: chunks500,
            processed_at: new Date().toISOString()
        };

        const updateQuery = `
            UPDATE raw_data_table 
            SET status = 'processing', processed_data = $1 
            WHERE id = $2
        `;
        await dbClient.query(updateQuery, [JSON.stringify(structuredData), rawDataRecord.id]);
        
        console.log(`Tiền xử lý thành công record ID: ${rawDataRecord.id}. Đã chia thành ${chunks500.length} đoạn (max 500 ký tự).`);
        return structuredData;
    } catch (error) {
        console.error("Lỗi khi tiền xử lý dữ liệu:", error);
    }
};

export { preprocessDataPipeline };