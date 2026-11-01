import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import ProtectedRoute from "./ProtectedRoute";

// Các trang Admin/QLDA cần bảo vệ (VD: Dashboard, Projects,...)
function Dashboard() {
  return <div style={{ padding: "20px" }}><h1>Trang Quản Trị Admin</h1></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các Route riêng tư được bảo vệ bởi ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Bạn có thể thêm các Route quản lý khác ở đây */}
        </Route>

        {/* Chuyển hướng mặc định */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}