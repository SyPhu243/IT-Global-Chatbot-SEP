import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");

    const username = data.username.trim();
    const password = data.password;

    // 1. CHẶN NGAY TỪ FRONTEND: Chỉ duy nhất tài khoản "admin" được phép đăng nhập trang này
    if (username.toLowerCase() !== "admin") {
      setApiError("Truy cập bị từ chối! Chỉ tài khoản Quản trị viên (admin) mới có quyền đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Sai tài khoản hoặc mật khẩu Admin!");
      }

      // Kiểm tra role nếu BE có trả về
      const role = result.role || result.user?.role || result.data?.role || "admin";
      if (role.toLowerCase() !== "admin") {
        throw new Error("Tài khoản không có quyền Quản trị viên (Admin)!");
      }

      const token =
        result.accessToken ||
        result.token ||
        result.data?.accessToken ||
        result.data?.token;

      if (!token) {
        throw new Error("Server không trả về token xác thực!");
      }

      localStorage.setItem("admin_jwt_token", token);
      if (!localStorage.getItem("admin_profile")) {
        localStorage.setItem(
          "admin_profile",
          JSON.stringify({ displayName: "Admin", email: "admin@it-global.net" })
        );
      }
      navigate("/admin/faq", { replace: true });
    } catch (err) {
      // Fallback khi BE chưa bật server nhưng nhập đúng duy nhất admin / Admin@123
      if (username === "admin" && password === "Admin@123" && err.message.includes("fetch")) {
        localStorage.setItem("admin_jwt_token", "dev_fallback_admin_token");
        if (!localStorage.getItem("admin_profile")) {
          localStorage.setItem(
            "admin_profile",
            JSON.stringify({ displayName: "Admin", email: "admin@it-global.net" })
          );
        }
        navigate("/admin/faq", { replace: true });
        return;
      }
      setApiError(err.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng nhập Hệ thống IT-Global</h2>
        <p style={styles.subtitle}>Khu vực dành riêng cho Quản trị viên (Admin)</p>

        {apiError && <div style={styles.errorBox}>{apiError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tên đăng nhập (Username):</label>
            <input
              type="text"
              placeholder="admin"
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
              placeholder="••••••••"
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
    margin: "0 0 6px 0",
    textAlign: "center",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: "12.5px",
    color: "#6b7280",
    textAlign: "center",
    margin: "0 0 20px 0",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "15px",
    border: "1px solid #fecaca",
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