import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Sau mỗi lần deploy, file chunk cũ (hash cũ) không còn tồn tại -> tự tải lại 1 lần để lấy bản mới
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('chunk_reload')) {
    sessionStorage.setItem('chunk_reload', '1');
    window.location.reload();
  }
});
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('chunk_reload'), 5000));

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);