import React, { useState, useEffect } from "react";

// Lấy URL từ biến môi trường Vite hoặc mặc định localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function FAQManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "Dịch vụ" });
  
  const [deleteId, setDeleteId] = useState(null);
  const [isClosingDeleteModal, setIsClosingDeleteModal] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("admin_jwt_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. GỌI API LẤY DANH SÁCH FAQ
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/faqs`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Không thể tải danh sách FAQ");
      const json = await res.json();
      // Hỗ trợ nhiều kiểu trả về của BE: mảng trực tiếp, { data: [...] }, hoặc { faqs: [...] }
      const list = Array.isArray(json) ? json : json.data || json.faqs || [];
      setFaqs(list);
    } catch (err) {
      console.error("Lỗi fetchFaqs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Mở Modal Thêm / Sửa
  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "Dịch vụ" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, category: faq.category || "Dịch vụ" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosingModal(false);
    }, 200);
  };

  // 2. GỌI API THÊM (POST) HOẶC SỬA (PUT)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) return;

    try {
      if (editingFaq) {
        const res = await fetch(`${API_BASE_URL}/faqs/${editingFaq.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Cập nhật FAQ thất bại");
        const updated = await res.json();
        const updatedItem = updated.data || updated;
        setFaqs(faqs.map((item) => (item.id === editingFaq.id ? { ...item, ...formData, ...updatedItem } : item)));
      } else {
        const res = await fetch(`${API_BASE_URL}/faqs`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Thêm mới FAQ thất bại");
        const created = await res.json();
        const newItem = created.data || created;
        setFaqs([{ id: newItem.id || Date.now(), ...formData, ...newItem, isNew: true }, ...faqs]);
      }
      handleCloseModal();
    } catch (err) {
      alert("Lỗi kết nối Backend: " + err.message);
    }
  };

  // Mở & Đóng Modal Xóa
  const handleCloseDeleteModal = () => {
    setIsClosingDeleteModal(true);
    setTimeout(() => {
      setDeleteId(null);
      setIsClosingDeleteModal(false);
    }, 200);
  };

  // 3. GỌI API XÓA (DELETE)
  const handleConfirmDelete = async () => {
    const targetId = deleteId;
    handleCloseDeleteModal();
    try {
      const res = await fetch(`${API_BASE_URL}/faqs/${targetId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Xóa FAQ thất bại");
      
      setDeletingRowId(targetId);
      setTimeout(() => {
        setFaqs((prev) => prev.filter((item) => item.id !== targetId));
        setDeletingRowId(null);
      }, 300);
    } catch (err) {
      alert("Lỗi khi xóa trên Backend: " + err.message);
    }
  };

  const filteredFaqs = faqs.filter(item => 
    (item.question || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.answer || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* INJECT ANIMATION STYLES */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalZoomIn { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalZoomOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.92) translateY(12px); } }
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes backdropFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes rowAdd { from { opacity: 0; background-color: #e0f2fe; transform: scaleY(0.8); } to { opacity: 1; background-color: transparent; transform: scaleY(1); } }
        @keyframes rowRemove { from { opacity: 1; transform: scale(1); background-color: #fef2f2; } to { opacity: 0; transform: scale(0.95); background-color: #fee2e2; height: 0; padding: 0; } }

        .animate-fade-in { animation: fadeIn 0.35s ease-out forwards; }
        .modal-backdrop-enter { animation: backdropFadeIn 0.2s ease-out forwards; }
        .modal-backdrop-exit { animation: backdropFadeOut 0.2s ease-in forwards; }
        .modal-box-enter { animation: modalZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-box-exit { animation: modalZoomOut 0.2s ease-in forwards; }
        .row-item-new { animation: rowAdd 0.5s ease-out forwards; }
        .row-item-delete { animation: rowRemove 0.3s ease-in forwards; }
        
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .btn-hover:active { transform: translateY(0); }
        .table-row-hover:hover { background-color: #f1f5f9 !important; }
        .text-wrap-fix { word-break: break-word; overflow-wrap: anywhere; }
      `}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: "260px", backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 12px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", backgroundColor: "#2563eb", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }}>IT</div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.3px" }}>IT-Global Admin</span>
        </div>

        <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <a href="/admin/faq" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
            <span>❓</span> Quản Lý FAQ 
          </a>
          <a href="/admin/sessions" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#94a3b8", borderRadius: "10px", textDecoration: "none", fontWeight: "500", fontSize: "14px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1e293b"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <span>💬</span> Quản Lý Hội Thoại 
          </a>
        </nav>

        <div style={{ marginTop: "auto", padding: "20px", borderTop: "1px solid #1e293b", fontSize: "12px", color: "#64748b" }}>
          IT-Global Chatbot System v1.0
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: "64px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Dashboard / <span style={{ color: "#0f172a", fontWeight: "600" }}>Quản Lý FAQ</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#334155", fontWeight: "600" }}>Lê Nhất Sinh</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#2563eb" }}>S</div>
          </div>
        </header>

        <div className="animate-fade-in" style={{ padding: "32px", flex: 1 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Danh Sách Câu Hỏi Thường Gặp</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Cấu hình các câu hỏi FAQ xuất hiện trên widget chat dành cho khách hàng.</p>
            </div>
            <button onClick={handleOpenAddModal} className="btn-hover" style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "11px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Thêm câu hỏi mới
            </button>
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fff" }}>
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm câu hỏi hoặc nội dung trả lời..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "340px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 24px", width: "60px", textAlign: "center" }}>STT</th>
                  <th style={{ padding: "16px 24px", width: "30%" }}>Câu hỏi</th>
                  <th style={{ padding: "16px 24px" }}>Nội dung câu trả lời</th>
                  <th style={{ padding: "16px 24px", width: "130px", textAlign: "center" }}>Phân loại</th>
                  <th style={{ padding: "16px 24px", width: "140px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu từ Backend...</td></tr>
                ) : filteredFaqs.length > 0 ? (
                  filteredFaqs.map((item, idx) => {
                    const isDeleting = deletingRowId === item.id;
                    const isNew = item.isNew;
                    return (
                      <tr key={item.id || idx} className={`table-row-hover ${isDeleting ? "row-item-delete" : isNew ? "row-item-new" : ""}`} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" }}>
                        <td style={{ padding: "16px 24px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>{idx + 1}</td>
                        <td className="text-wrap-fix" style={{ padding: "16px 24px", fontWeight: "600", color: "#0f172a", lineHeight: "1.4" }}>{item.question}</td>
                        <td className="text-wrap-fix" style={{ padding: "16px 24px", color: "#475569", lineHeight: "1.5" }}>{item.answer}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#eff6ff", color: "#2563eb", display: "inline-block", border: "1px solid #dbeafe" }}>
                            {item.category || "Dịch vụ"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ padding: "6px 14px", backgroundColor: "#fff", color: "#2563eb", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Sửa</button>
                            <button onClick={() => setDeleteId(item.id)} style={{ padding: "6px 14px", backgroundColor: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Chưa có dữ liệu FAQ từ Server!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* POPUP MODAL THÊM / SỬA */}
      {isModalOpen && (
        <div className={isClosingModal ? "modal-backdrop-exit" : "modal-backdrop-enter"} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className={isClosingModal ? "modal-box-exit" : "modal-box-enter"} style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "20px", width: "480px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#0f172a" }}>{editingFaq ? "Chỉnh Sửa Câu Hỏi FAQ" : "Thêm Câu Hỏi FAQ Mới"}</h3>
              <button onClick={handleCloseModal} style={{ border: "none", background: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>Câu hỏi (Question):</label>
                <input style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }} value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} required />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>Nội dung trả lời (Answer):</label>
                <textarea style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" }} rows={4} value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} required />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontWeight: "600" }}>Hủy</button>
                <button type="submit" className="btn-hover" style={{ padding: "10px 22px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL XÁC NHẬN XÓA */}
      {deleteId && (
        <div className={isClosingDeleteModal ? "modal-backdrop-exit" : "modal-backdrop-enter"} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className={isClosingDeleteModal ? "modal-box-exit" : "modal-box-enter"} style={{ backgroundColor: "#fff", padding: "28px", borderRadius: "20px", width: "360px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ width: "52px", height: "52px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "24px" }}>⚠️</div>
            <h3 style={{ marginTop: 0, color: "#0f172a", fontSize: "18px", fontWeight: "700" }}>Xác Nhận Xóa FAQ</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>Bạn có chắc chắn muốn xóa câu hỏi này khỏi hệ thống không?</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button onClick={handleCloseDeleteModal} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontWeight: "600" }}>Hủy</button>
              <button onClick={handleConfirmDelete} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", backgroundColor: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}