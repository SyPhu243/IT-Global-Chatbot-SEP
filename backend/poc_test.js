import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Nạp biến môi trường từ file .env
dotenv.config();

// Kịch bản bảo vệ: Kiểm tra xem API Key đã được cấu hình chưa
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('nhap_key_cua')) {
  console.error('\n❌ LỖI NGHIÊM TRỌNG: Chưa tìm thấy GEMINI_API_KEY hợp lệ.');
  console.error('👉 Hướng dẫn khắc phục:');
  console.error('1. Tạo một file tên là ".env" ở thư mục gốc của backend.');
  console.error('2. Mở file ".env.example" copy nội dung sang file ".env".');
  console.error('3. Thay thế đoạn text bằng mã API Key thật của công ty/cá nhân.\n');
  process.exit(1); // Dừng chương trình để bảo vệ hệ thống
}

// Khởi tạo client khi đã có Key hợp lệ
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testChatbotAI() {
  try {
    console.log('⏳ Đang kết nối tới hệ thống AI của Google...');
    
    // Sử dụng gemini-1.5-flash với tốc độ phản hồi < 3 giây
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

    // Giả lập luồng ngữ cảnh truyền vào cho AI
    const prompt = `
      Bạn là trợ lý ảo của công ty phần mềm IT-Global. 
      Thông tin công ty: IT-Global chuyên cung cấp dịch vụ gia công phần mềm và xây dựng website doanh nghiệp.
      Câu hỏi của khách hàng: "Bên bạn có làm website tích hợp AI không?"
    `;

    // Gọi API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log('\n--- 🤖 CHATBOT IT-GLOBAL TRẢ LỜI ---');
    console.log(response.text());
    console.log('-------------------------------------\n');
    console.log('✅ PoC kết nối AI thành công!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình gọi API AI:', error.message);
  }
}

testChatbotAI();