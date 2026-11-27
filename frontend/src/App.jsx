import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import FAQManager from './FAQManager';
import SessionList from './SessionList';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/faq" element={<FAQManager />} />
          <Route path="/admin/sessions" element={<SessionList />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);