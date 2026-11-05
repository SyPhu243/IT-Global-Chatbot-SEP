import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import FAQManager from "./FAQManager";
import SessionList from "./SessionList";
import ChatWidget from "./ChatWidget";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ hiển thị Widget Chat dành cho Khách */}
        <Route path="/" element={<ChatWidget />} />
        
        {/* Trang Đăng nhập Admin */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Các trang Admin Dashboard được bảo vệ */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/faq" element={<FAQManager />} />
          <Route path="/admin/sessions" element={<SessionList />} />
        </Route>

        {/* Chuyển hướng mặc định về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}