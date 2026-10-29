import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './ChatWidget';
import './index.css';

// Custom Web Component để cô lập CSS bằng Shadow DOM
class ITGlobalChatbotElement extends HTMLElement {
  connectedCallback() {
    // 1. Tạo Shadow Root (mode: open)
    const shadowRoot = this.attachShadow({ mode: 'open' });

    // 2. Tạo container chứa App React
    const mountPoint = document.createElement('div');
    mountPoint.id = 'itglobal-chatbot-root';
    shadowRoot.appendChild(mountPoint);

    // 3. Mount React App vào bên trong Shadow Root
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <ChatWidget />
      </React.StrictMode>
    );
  }
}

// Đăng ký Custom Element tên là <itglobal-chatbot>
if (!customElements.get('itglobal-chatbot')) {
  customElements.define('itglobal-chatbot', ITGlobalChatbotElement);
}

// Tự động chèn thẻ <itglobal-chatbot> vào <body> nếu chưa có
if (!document.querySelector('itglobal-chatbot')) {
  const container = document.createElement('itglobal-chatbot');
  document.body.appendChild(container);
}