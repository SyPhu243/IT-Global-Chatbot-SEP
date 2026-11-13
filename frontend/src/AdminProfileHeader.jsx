import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminProfileHeader({ breadcrumb }) {
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_profile")) || {
        displayName: "Admin",
        email: "admin@it-global.net",
      };
    } catch {
      return { displayName: "Admin", email: "admin@it-global.net" };
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    email: profile.email,
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleOpen = () => {
    setFormData({
      displayName: profile.displayName,
      email: profile.email,
      newPassword: "",
    });
    setMsg("");
    setIsOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    const updatedProfile = {
      displayName: formData.displayName.trim() || "Admin",
      email: formData.email.trim() || "admin@it-global.net",
    };

    try {
      const token = localStorage.getItem("admin_jwt_token");
      await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...updatedProfile,
          ...(formData.newPassword ? { password: formData.newPassword } : {}),
        }),
      }).catch(() => {});

      localStorage.setItem("admin_profile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setMsg("✅ Đã cập nhật thông tin Admin!");
      setTimeout(() => setIsOpen(false), 900);
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (profile.displayName || "Admin").charAt(0).toUpperCase();

  return (
    <>
      <header
        style={{
          height: "64px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
          Dashboard / <span style={{ color: "#0f172a", fontWeight: "600" }}>{breadcrumb}</span>
        </div>

        {/* GÓC TRÊN BÊN PHẢI: TÊN ADMIN + BẤM ĐỂ CHỈNH SỬA */}
        <button
          type="button"
          onClick={handleOpen}
          title="Bấm để chỉnh sửa thông tin Admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "transparent",
            border: "1px solid transparent",
            padding: "6px 12px",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
            {profile.displayName}
          </span>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#2563eb",
            }}
          >
            {avatarLetter}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>⚙️</span>
        </button>
      </header>

      {/* MODAL CHỈNH SỬA THÔNG TIN ADMIN */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "28px 32px",
              borderRadius: "20px",
              width: "420px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                Thông Tin Tài Khoản Admin
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ border: "none", background: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {msg && (
              <div style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", fontWeight: "600" }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  Email quản trị:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  Mật khẩu mới (để trống nếu không đổi):
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontWeight: "600" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "9px 20px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: "600" }}
                >
                  {saving ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}