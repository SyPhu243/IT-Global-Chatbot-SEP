import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    setLoading(true);
    
    // Giả lập lưu token để vượt qua ProtectedRoute
    localStorage.setItem("admin_jwt_token", "fake_admin_token_123");
    
    setTimeout(() => {
      setLoading(false);
      // Chuyển hướng thẳng đến trang Quản lý FAQ
      navigate("/admin/faq");
    }, 500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng nhập Hệ thống IT-Global</h2>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tên đăng nhập (Username):</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập..."
              {...register("username", {
                required: "Vui lòng nhập tên đăng nhập!",
              })}
              style={styles.input}
            />
            {errors.username && (
              <span style={styles.fieldError}>{errors.username.message}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Mật khẩu (Password):</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu..."
              {...register("password", {
                required: "Vui lòng nhập mật khẩu!",
              })}
              style={styles.input}
            />
            {errors.password && (
              <span style={styles.fieldError}>{errors.password.message}</span>
            )}
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
    color: "#1f2937",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
  },
  fieldError: {
    color: "#dc2626",
    fontSize: "12px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};