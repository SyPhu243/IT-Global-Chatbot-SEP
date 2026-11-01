import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // Kiểm tra sự tồn tại của JWT Token trong localStorage
  const token = localStorage.getItem("admin_jwt_token");

  // Nếu chưa đăng nhập (không có token), tự động chuyển hướng về /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã có token, cho phép truy cập các Route con bên trong
  return <Outlet />;
}