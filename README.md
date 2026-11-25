🤖 IT Global - AI Chatbot ProjectHệ thống AI Chatbot thông minh được phát triển bởi IT Global, hỗ trợ tự động hóa tương tác, giải đáp thắc mắc dựa trên tri thức nội bộ (RAG) và tối ưu hóa quy trình vận hành doanh nghiệp.📑 Mục lục
Giới thiệu dự án
Tính năng nổi bật
Kiến trúc & Công nghệ sử dụng
Cấu trúc thư mụcYêu cầu hệ thống
Hướng dẫn cài đặt & Chạy dự án
Cấu hình biến môi trường
API Endpoints cơ bảnQuy trình Git & Đóng góp
Kiểm thử (Testing)Lộ trình phát triển (Roadmap)
Liên hệ & Bản quyền
🎯 Giới thiệu dự án
Dự án IT Global AI Chatbot được xây dựng nhằm cung cấp một trợ lý ảo thông minh có khả năng hiểu ngôn ngữ tự nhiên (NLP), truy xuất thông tin chính xác từ cơ sở dữ liệu doanh nghiệp và phản hồi theo thời gian thực.
Mục tiêu chính:
Giảm tải công việc cho đội ngũ CSKH và hỗ trợ kỹ thuật nội bộ.
Cung cấp phản hồi chính xác, nhất quán 24/7.
Dễ dàng mở rộng và tích hợp lên Website, ứng dụng nội bộ hoặc các nền tảng nhắn tin (Zalo, Messenger, Telegram, Slack...).
✨ Tính năng nổi bật
💬 Hội thoại thông minh (Conversational AI): Hiểu ngữ cảnh cuộc trò chuyện, hỗ trợ đa lượt hỏi đáp tự nhiên (tiếng Việt & tiếng Anh).
📚 Truy xuất tri thức nội bộ (RAG - Retrieval-Augmented Generation): Nạp tài liệu (PDF, DOCX, TXT, URL) để bot trả lời chính xác theo dữ liệu riêng của IT Global.
⚡ Phản hồi Streaming: Hiển thị câu trả lời theo thời gian thực, tăng trải nghiệm người dùng.🛠️ Trang quản trị (Admin Dashboard): Quản lý tài liệu huấn luyện, lịch sử hội thoại, cấu hình prompt và theo dõi hiệu suất.
🔐 Bảo mật & Phân quyền: Xác thực người dùng (JWT/OAuth2), phân quyền Admin/User và giới hạn tần suất gọi API (Rate Limiting).
🔌 Tích hợp đa kênh: Hỗ trợ nhúng Chat Widget lên website hoặc kết nối qua Webhook/REST API.
🏗️ Kiến trúc & Công nghệ sử dụng
Luồng xử lý tổng quan
[Người dùng / Chat Widget]
           │
           ▼
    [Frontend UI] ──(REST / WebSocket / SSE)──▶ [Backend API Server]
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
               [Database (SQL/NoSQL)]           [Vector Database]                [LLM Provider]
            (Users, Chat History, Logs)      (Embeddings / Knowledge)      (Gemini / OpenAI / Local)
Tech Stack (Cập nhật lại theo công nghệ thực tế của team)
Thành phần: Frontend, Backend, AI/LLM, Database, VectorDB, Cache/Queue, Devops
Công nghệ sử dụng:React / Next.js, TypeScript, Tailwind CSS, Python (FastAPI) hoặc Node.js (NestJS / Express)AI / LLMGoogle Gemini API / OpenAI API, LangChain / LlamaIndexDatabasePostgreSQL / MongoDBVector DBQdrant / Pinecone / pgvector / ChromaDBCache / QueueRedisDevOpsDocker, Docker Compose, GitHub Actions / GitLab CI
📂 Cấu trúc thư mụcit-global-ai-chatbot/
├── frontend/                 # Mã nguồn giao diện người dùng & Chat Widget
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                  # Mã nguồn API Server & AI Pipeline
│   ├── app/
│   │   ├── api/              # Các route/controller API
│   │   ├── core/             # Cấu hình hệ thống, bảo mật, logging
│   │   ├── models/           # Database models & schemas
│   │   ├── services/         # Logic nghiệp vụ, RAG, LLM integration
│   │   └── main.py           # Entry point
│   ├── tests/                # Unit tests & Integration tests
│   └── requirements.txt
├── docs/                     # Tài liệu thiết kế, sơ đồ kiến trúc, API spec
├── scripts/                  # Scripts hỗ trợ deploy, seed data, backup
├── docker-compose.yml        # Cấu hình chạy toàn bộ hệ thống bằng Docker
├── .env.example              # File mẫu biến môi trường
├── .gitignore
└── README.md
💻 Yêu cầu hệ thống
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
Git >= 2.30
Docker & Docker Compose >= 24.0 (Khuyên dùng)
Node.js >= 18.x & npm/yarn/pnpm (Nếu chạy Frontend thủ công)
Python >= 3.10 (Nếu chạy Backend Python thủ công)
🚀 Hướng dẫn cài đặt & Chạy dự án
Bước 1: Clone repositorygit clone <URL_REPOSITORY_CUA_IT_GLOBAL>
cd <TEN_THU_MUC_DU_AN>
Bước 2: Tạo file biến môi trường
Sao chép file .env.example thành .env và điền đầy đủ thông tin cấu hình:cp .env.example .env
Bước 3: Khởi chạy dự án
Cách 1: Chạy bằng Docker Compose (Khuyên dùng)docker compose up -d --build
Sau khi chạy xong, truy cập:Frontend: http://localhost:3000Backend API Docs (Swagger): http://localhost:8000/docs
Cách 2: Chạy thủ công (Local Development)
1. Khởi chạy Backend:
cd backend
python -m venv venv

# Kích hoạt môi trường ảo
# Trên Linux/macOS:
source venv/bin/activate
# Trên Windows:
venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
2. Khởi chạy Frontend:
cd frontend
npm install
npm run dev
⚙️ Cấu hình biến môi trường
Các biến môi trường quan trọng trong file .env:
# App Configuration
APP_ENV=development
APP_PORT=8000
SECRET_KEY=your_super_secret_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/itglobal_chatbot
REDIS_URL=redis://localhost:6379/0

# Vector Database
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_API_KEY=your_vector_db_key

# AI / LLM API Keys
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
# OPENAI_API_KEY=your_openai_api_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
⚠️ Lưu ý bảo mật: Tuyệt đối không commit file .env hoặc các khóa API thật lên Git repository.
📡 API Endpoints cơ bản
Phương thức: GET, POST, POST, GET, POST, DELETE
Endpoint: /api/v1/health, /api/v1/auth/login, /api/v1/chat/completions, /api/v1/chat/history/{session_id}, /api/v1/knowledge/upload, /api/v1/knowledge/{doc_id}
Mô tả: Kiểm tra trạng thái hoạt động của server, Đăng nhập và lấy JWT Access Token, Gửi tin nhắn và nhận phản hồi từ AI Chatbot, Lấy lịch sử hội thoại theo phiên, Tải lên tài liệu mới vào cơ sở tri thức (RAG), Xóa tài liệu khỏi cơ sở tri thức
🤝 Quy trình Git & Đóng góp
Để giữ cho mã nguồn sạch sẽ và dễ quản lý, tất cả thành viên IT Global vui lòng tuân thủ quy chuẩn sau:
1. Quy tắc đặt tên nhánh (Branching Strategy)
main: Mã nguồn ổn định đang chạy trên Production.
develop: Nhánh tích hợp các tính năng mới nhất cho môi trường Staging/Dev.
feature/<ten-tinh-nang>: Phát triển tính năng mới (VD: feature/rag-pdf-parser).
fix/<ten-loi>: Sửa lỗi (VD: fix/streaming-timeout).
docs/<noi-dung>: Cập nhật tài liệu (VD: docs/update-readme).

2. Quy tắc Commit (Conventional Commits)
Sử dụng tiền tố rõ ràng cho mỗi commit:
feat: Thêm tính năng mới
fix: Sửa lỗi
docs: Thay đổi liên quan đến tài liệu
refactor: Tái cấu trúc code (không đổi tính năng)
test: Thêm hoặc sửa bài kiểm thử
chore: Cập nhật cấu hình build, thư viện, CI/CD

Ví dụ: git commit -m "feat(chat): hỗ trợ streaming response qua SSE"
3. Quy trình tạo Pull Request (PR)
Tạo nhánh mới từ develop.
Code, tự kiểm thử và đảm bảo không có lỗi lint/format.
Push nhánh lên remote và tạo Pull Request vào develop.Gắn ít nhất 01 reviewer kiểm duyệt trước khi merge.
🧪 Kiểm thử (Testing)
Chạy bộ kiểm thử để đảm bảo hệ thống hoạt động ổn định trước khi tạo PR:
# Kiểm thử Backend
cd backend
pytest

# Kiểm thử Frontend
cd frontend
npm run test
🗺️ Lộ trình phát triển (Roadmap)[x] 
Khởi tạo kiến trúc dự án & thiết lập Git repository
[] Xây dựng luồng hội thoại cơ bản với LLM[ ] Tích hợp hệ thống RAG truy xuất tài liệu nội bộ
[] Phát triển Admin Dashboard quản lý tri thức & người dùng
[] Đóng gói Chat Widget nhúng lên Website IT Global
[] Tích hợp đa kênh (Zalo OA, Facebook Messenger, Telegram)
[] Triển khai CI/CD & Giám sát hệ thống (Monitoring/Logging)
📞 Liên hệ & Bản quyền      
Đơn vị phát triển: IT GlobalWebsite: [https://itglobal.vn] (Cập nhật link thực tế)
Email hỗ trợ / Tech Lead: [tech@itglobal.vn] (Cập nhật email thực tế)
© 2026 IT Global. All rights reserved. Mã nguồn thuộc quyền sở hữu nội bộ của IT Global, nghiêm cấm sao chép hoặc phát tán khi chưa có sự cho phép.
