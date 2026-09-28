import dotenv from 'dotenv';
dotenv.config();

async function listAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔍 Đang dò tìm các mô hình khả dụng với API Key của bạn...\n');
    
    // Gửi request trực tiếp đến API của Google để xin danh sách model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Lỗi từ hệ thống Google:', data.error.message);
      return;
    }

    console.log('✅ CÁC MÃ MODEL CHÍNH XÁC MÀ BẠN CÓ THỂ SỬ DỤNG LÀ:');
    data.models.forEach(model => {
      // Chỉ lọc ra các model hỗ trợ chat/tạo văn bản (generateContent)
      if (model.supportedGenerationMethods.includes('generateContent')) {
        const exactName = model.name.replace('models/', '');
        console.log(`👉 ${exactName}`);
      }
    });
    console.log('\n💡 Hướng dẫn: Hãy copy tên model nào có chữ "flash" ở trên và dán vào file poc_test.js!');
  } catch (error) {
    console.error('❌ Lỗi hệ thống:', error.message);
  }
}

listAvailableModels();