import React, { useState } from "react";

const MOCK_SESSIONS = [
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    ipAddress: "113.161.72.10",
    createdAt: "2026-11-05 14:20:15",
    messageCount: 4,
    status: "Đã kết thúc",
    userGroup: "Khách hàng doanh nghiệp",
    messages: [
      { sender: "user", text: "Xin chào, IT-Global có tư vấn thiết kế Website không?", time: "14:20:15" },
      { sender: "bot", text: "Dạ chào bạn! IT-Global chuyên cung cấp dịch vụ thiết kế Website doanh nghiệp chuẩn SEO ạ.", time: "14:20:18" },
      { sender: "user", text: "Chi phí gói thiết kế Web tầm bao nhiêu?", time: "14:21:05" },
      { sender: "bot", text: "Chi phí tùy thuộc vào tính năng, gói cơ bản bắt đầu từ 10.000.000 VNĐ ạ.", time: "14:21:10" }
    ]
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    ipAddress: "14.241.225.88",
    createdAt: "2026-11-05 14:05:00",
    messageCount: 2,
    status: "Đang hoạt động",
    userGroup: "Khách vãng lai",
    messages: [
      { sender: "user", text: "Cho mình hỏi ứng dụng di động phát triển trong bao lâu?", time: "14:05:00" },
      { sender: "bot", text: "Thời gian trung bình từ 4 đến 8 tuần tùy quy mô dự án ạ.", time: "14:05:04" }
    ]
  },
  {
    id: "c83a12bf-712e-4b91-91a0-31e9c2b92110",
    ipAddress: "27.68.210.45",
    createdAt: "2026-11-05 13:42:10",
    messageCount: 6,
    status: "Đã kết thúc",
    userGroup: "Khách hàng cá nhân",
    messages: [
      { sender: "user", text: "Bên bạn có hỗ trợ xuất hóa đơn VAT không?", time: "13:42:10" },
      { sender: "bot", text: "Dạ có ạ, IT-Global cung cấp đầy đủ hóa đơn VAT hợp lệ.", time: "13:42:15" },
      { sender: "user", text: "Cảm ơn nhé!", time: "13:43:00" },
      { sender: "bot", text: "Dạ không có gì ạ, chúc bạn một ngày tốt lành!", time: "13:43:02" }
    ]
  }
];

export default function SessionList() {
  const [sessions] = useState(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const handleOpenDetail = (session) => {
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedSession(null);
      setIsClosingModal(false);
    }, 200);
  };

  const filteredSessions = sessions.filter((s) => {
    const matchSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.ipAddress.includes(searchTerm);
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawerSlideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawerSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(30px); }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-in { animation: fadeIn 0.35s ease-out forwards; }
        .backdrop-enter { animation: backdropFadeIn 0.2s ease-out forwards; }
        .backdrop-exit { animation: backdropFadeOut 0.2s ease-in forwards; }
        .drawer-enter { animation: drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .drawer-exit { animation: drawerSlideOut 0.2s ease-in forwards; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .table-row-hover:hover { background-color: #f1f5f9 !important; }
      `}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: "260px", backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 12px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", backgroundColor: "#2563eb", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }}>IT</div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.3px" }}>IT-Global Admin</span>
        </div>

        <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <a href="/admin/faq" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#94a3b8", borderRadius: "10px", textDecoration: "none", fontWeight: "500", fontSize: "14px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1e293b"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <span>❓</span> Quản Lý FAQ 
          </a>
          <a href="/admin/sessions" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
            <span>💬</span> Quản Lý Hội Thoại 
          </a>
        </nav>

        <div style={{ marginTop: "auto", padding: "20px", borderTop: "1px solid #1e293b", fontSize: "12px", color: "#64748b" }}>
          IT-Global Chatbot System v1.0
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* TOPBAR HEADER */}
        <header style={{ height: "64px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Dashboard / <span style={{ color: "#0f172a", fontWeight: "600" }}>Quản Lý Session Hội Thoại</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#334155", fontWeight: "600" }}>Lê Nhất Sinh</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#2563eb" }}>S</div>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <div className="animate-fade-in" style={{ padding: "32px", flex: 1 }}>
          
          {/* HEADER ACTION CARD */}
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Danh Sách Hội Thoại Chatbot</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Theo dõi danh sách các phiên chat thực tế giữa khách hàng và Chatbot/Nhân viên.</p>
            </div>
          </div>

          {/* DATA TABLE CONTAINER */}
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            
            {/* SEARCH & FILTER BAR */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" }}>
              <input 
                type="text" 
                placeholder="🔍 Tìm theo Session ID hoặc địa chỉ IP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "340px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Đã kết thúc">Đã kết thúc</option>
                </select>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 24px" }}>Mã Session ID</th>
                  <th style={{ padding: "16px 24px" }}>Địa chỉ IP</th>
                  <th style={{ padding: "16px 24px" }}>Thời gian khởi tạo</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Số tin nhắn</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Trạng thái</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <tr 
                      key={session.id} 
                      className="table-row-hover"
                      style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" }}
                    >
                      <td style={{ padding: "16px 24px", fontFamily: "monospace", fontWeight: "600", color: "#2563eb" }}>
                        {session.id.substring(0, 18)}...
                      </td>
                      <td style={{ padding: "16px 24px", color: "#475569" }}>{session.ipAddress}</td>
                      <td style={{ padding: "16px 24px", color: "#64748b" }}>{session.createdAt}</td>
                      <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: "600" }}>{session.messageCount}</td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span style={{ 
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          fontWeight: "600", 
                          backgroundColor: session.status === "Đang hoạt động" ? "#dcfce7" : "#f1f5f9", 
                          color: session.status === "Đang hoạt động" ? "#15803d" : "#64748b",
                          border: session.status === "Đang hoạt động" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                          display: "inline-block" 
                        }}>
                          {session.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button 
                          onClick={() => handleOpenDetail(session)} 
                          className="btn-hover"
                          style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
                        >
                          👁️ Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy phiên hội thoại nào!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* DRAWER / MODAL XEM CHI TIẾT LỊCH SỬ TIN NHẮN */}
      {selectedSession && (
        <div 
          className={isClosingModal ? "backdrop-exit" : "backdrop-enter"}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999 }}
        >
          <div 
            className={isClosingModal ? "drawer-exit" : "drawer-enter"}
            style={{ backgroundColor: "#fff", width: "460px", height: "100%", boxShadow: "-10px 0 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}
          >
            {/* DRAWER HEADER */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>Chi Tiết Session Hội Thoại</h3>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b" }}>ID: {selectedSession.id}</span>
              </div>
              <button onClick={handleCloseModal} style={{ border: "none", background: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer", padding: "4px" }}>✕</button>
            </div>

            {/* SESSION INFO SUMMARY */}
            <div style={{ padding: "16px 24px", backgroundColor: "#eff6ff", borderBottom: "1px solid #dbeafe", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <div><strong>IP:</strong> {selectedSession.ipAddress}</div>
              <div><strong>Thời gian:</strong> {selectedSession.createdAt}</div>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "14px" }}>
              {selectedSession.messages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                      {isUser ? "Khách hàng" : "Chatbot AI"} • {msg.time}
                    </span>
                    <div style={{ 
                      padding: "10px 16px", 
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px", 
                      backgroundColor: isUser ? "#2563eb" : "#fff", 
                      color: isUser ? "#fff" : "#1e293b", 
                      boxShadow: isUser ? "0 2px 6px rgba(37,99,235,0.2)" : "0 2px 6px rgba(0,0,0,0.05)",
                      border: isUser ? "none" : "1px solid #e2e8f0",
                      maxWidth: "85%", 
                      fontSize: "13.5px",
                      lineHeight: "1.4"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DRAWER FOOTER */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", backgroundColor: "#fff", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCloseModal} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontWeight: "600", fontSize: "13.5px" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}