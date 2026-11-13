import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SessionList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const getHeaders = () => {
    const token = localStorage.getItem("admin_jwt_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. GỌI API LẤY DANH SÁCH SESSIONS
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/sessions`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Không thể tải danh sách Session");
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || json.sessions || [];
      setSessions(list);
    } catch (err) {
      console.error("Lỗi fetchSessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 2. GỌI API LẤY CHI TIẾT TIN NHẮN KHI MỞ DRAWER
  const handleOpenDetail = async (session) => {
    setSelectedSession(session);
    // Nếu object session từ API đã nhúng sẵn mảng messages thì dùng luôn, không thì gọi API chi tiết
    if (Array.isArray(session.messages) && session.messages.length > 0) {
      setSessionMessages(session.messages);
      return;
    }

    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${session.id}/messages`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Không thể tải lịch sử tin nhắn");
      const json = await res.json();
      const msgs = Array.isArray(json) ? json : json.data || json.messages || [];
      setSessionMessages(msgs);
    } catch (err) {
      console.error("Lỗi fetchMessages:", err);
      setSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedSession(null);
      setSessionMessages([]);
      setIsClosingModal(false);
    }, 200);
  };

  const filteredSessions = sessions.filter((s) => {
    const idStr = String(s.id || "");
    const ipStr = String(s.ipAddress || s.ip_address || "");
    const statusStr = s.status || "Đang hoạt động";
    const matchSearch = idStr.toLowerCase().includes(searchTerm.toLowerCase()) || ipStr.includes(searchTerm);
    const matchStatus = filterStatus === "ALL" || statusStr === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drawerSlideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes drawerSlideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(30px); } }
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes backdropFadeOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-fade-in { animation: fadeIn 0.35s ease-out forwards; }
        .backdrop-enter { animation: backdropFadeIn 0.2s ease-out forwards; }
        .backdrop-exit { animation: backdropFadeOut 0.2s ease-in forwards; }
        .drawer-enter { animation: drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .drawer-exit { animation: drawerSlideOut 0.2s ease-in forwards; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .table-row-hover:hover { background-color: #f1f5f9 !important; }
        .msg-wrap { word-break: break-word; overflow-wrap: anywhere; white-space: pre-wrap; }
      `}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: "260px", backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 12px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", backgroundColor: "#2563eb", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>IT</div>
          <span style={{ fontSize: "18px", fontWeight: "700" }}>IT-Global Admin</span>
        </div>

        <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <a href="/admin/faq" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#94a3b8", borderRadius: "10px", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
            <span>❓</span> Quản Lý FAQ 
          </a>
          <a href="/admin/sessions" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
            <span>💬</span> Quản Lý Hội Thoại 
          </a>
        </nav>

        <div style={{ marginTop: "auto", padding: "20px", borderTop: "1px solid #1e293b", fontSize: "12px", color: "#64748b" }}>
          IT-Global Chatbot System v1.0
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: "64px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Dashboard / <span style={{ color: "#0f172a", fontWeight: "600" }}>Quản Lý Session Hội Thoại</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#334155", fontWeight: "600" }}>Lê Nhất Sinh</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#2563eb" }}>S</div>
          </div>
        </header>

        <div className="animate-fade-in" style={{ padding: "32px", flex: 1 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Danh Sách Hội Thoại Chatbot</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Theo dõi danh sách các phiên chat thực tế giữa khách hàng và Chatbot/Nhân viên.</p>
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input 
                type="text" 
                placeholder="🔍 Tìm theo Session ID hoặc địa chỉ IP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "340px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", backgroundColor: "#fff", cursor: "pointer" }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase" }}>
                  <th style={{ padding: "16px 24px" }}>Mã Session ID</th>
                  <th style={{ padding: "16px 24px" }}>Địa chỉ IP</th>
                  <th style={{ padding: "16px 24px" }}>Thời gian khởi tạo</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Số tin nhắn</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Trạng thái</th>
                  <th style={{ padding: "16px 24px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu từ Backend...</td></tr>
                ) : filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => {
                    const idStr = String(session.id || "");
                    const statusStr = session.status || "Đang hoạt động";
                    return (
                      <tr key={idStr} className="table-row-hover" style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" }}>
                        <td style={{ padding: "16px 24px", fontFamily: "monospace", fontWeight: "600", color: "#2563eb" }}>
                          {idStr.length > 18 ? `${idStr.substring(0, 18)}...` : idStr}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#475569" }}>{session.ipAddress || session.ip_address || "N/A"}</td>
                        <td style={{ padding: "16px 24px", color: "#64748b" }}>{session.createdAt || session.created_at || "N/A"}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: "600" }}>{session.messageCount ?? session.message_count ?? 0}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span style={{ 
                            padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", 
                            backgroundColor: statusStr === "Đang hoạt động" ? "#dcfce7" : "#f1f5f9", 
                            color: statusStr === "Đang hoạt động" ? "#15803d" : "#64748b",
                            border: statusStr === "Đang hoạt động" ? "1px solid #bbf7d0" : "1px solid #e2e8f0"
                          }}>
                            {statusStr}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <button onClick={() => handleOpenDetail(session)} className="btn-hover" style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                            👁️ Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Chưa có phiên hội thoại nào từ Server!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* DRAWER XEM CHI TIẾT LỊCH SỬ TIN NHẮN */}
      {selectedSession && (
        <div className={isClosingModal ? "backdrop-exit" : "backdrop-enter"} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999 }}>
          <div className={isClosingModal ? "drawer-exit" : "drawer-enter"} style={{ backgroundColor: "#fff", width: "460px", height: "100%", boxShadow: "-10px 0 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>Chi Tiết Session Hội Thoại</h3>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b" }}>ID: {selectedSession.id}</span>
              </div>
              <button onClick={handleCloseModal} style={{ border: "none", background: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "16px 24px", backgroundColor: "#eff6ff", borderBottom: "1px solid #dbeafe", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <div><strong>IP:</strong> {selectedSession.ipAddress || selectedSession.ip_address || "N/A"}</div>
              <div><strong>Thời gian:</strong> {selectedSession.createdAt || selectedSession.created_at || "N/A"}</div>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1, backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "14px" }}>
              {loadingMessages ? (
                <div style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>Đang tải lịch sử tin nhắn...</div>
              ) : sessionMessages.length > 0 ? (
                sessionMessages.map((msg, idx) => {
                  const isUser = msg.sender === "user" || msg.role === "user";
                  return (
                    <div key={msg.id || idx} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                        {isUser ? "Khách hàng" : "Chatbot AI"} • {msg.time || msg.created_at || ""}
                      </span>
                      <div className="msg-wrap" style={{ 
                        padding: "10px 16px", 
                        borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px", 
                        backgroundColor: isUser ? "#2563eb" : "#fff", 
                        color: isUser ? "#fff" : "#1e293b", 
                        border: isUser ? "none" : "1px solid #e2e8f0",
                        maxWidth: "85%", fontSize: "13.5px", lineHeight: "1.4"
                      }}>
                        {msg.text || msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px" }}>Chưa có tin nhắn trong phiên này!</div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", backgroundColor: "#fff", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCloseModal} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontWeight: "600" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}