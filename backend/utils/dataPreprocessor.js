import { chunkText } from './textProcessor.js'; 

const cleanData = (rawString) => {
    if (!rawString) return "";
    
    // 1. Xóa thẻ HTML
    let cleanedString = rawString.replace(/<[^>]*>?/gm, '');
    
    // 2. GIẢI PHÁP MASKING CÓ CHỌN LỌC (WHITELIST)
    // Danh sách thông tin chính thức của IT-Global (Tuyệt đối không che)
    const itGlobalPhones = ["+84 987.613.161", "0987613161", "+84987613161"]; // Khai báo nhiều định dạng phòng hờ
    const itGlobalEmails = ["info@it-global.net"];

    // Masking SĐT: Quét các số bắt đầu bằng 0 hoặc +84, có chứa dấu chấm hoặc khoảng trắng
    cleanedString = cleanedString.replace(/(?:\+84|0)[-\s.]?\d{3}[-\s.]?\d{3}[-\s.]?\d{3,4}\b/g, (match) => {
        // Làm sạch khoảng trắng/dấu chấm của chuỗi vừa tìm được để so sánh cho chắc chắn
        const normalizedMatch = match.replace(/[-\s.]/g, ''); 
        const normalizedWhitelist = itGlobalPhones.map(phone => phone.replace(/[-\s.]/g, ''));
        
        if (normalizedWhitelist.includes(normalizedMatch)) {
            return match; // Nếu đúng số IT Global -> Giữ nguyên
        }
        return "[SĐT KHÁCH HÀNG ĐÃ ẨN]"; // Số lạ -> Che đi
    });

    // Masking Email: Quét tất cả định dạng email
    cleanedString = cleanedString.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
        if (itGlobalEmails.includes(match.toLowerCase())) {
            return match; // Nếu đúng email IT Global -> Giữ nguyên
        }
        return "[EMAIL ĐÃ ẨN]"; // Email lạ -> Che đi
    });

    // 3. Giữ lại chữ cái Unicode (tiếng Việt), số, khoảng trắng và các dấu câu cơ bản
    cleanedString = cleanedString.replace(/[^\p{L}\p{N}\s.,!?\-@\[\]+]/gu, '').replace(/\s+/g, ' ').trim();
    
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