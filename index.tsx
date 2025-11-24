
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'uuid'; // Import ไลบรารีสำหรับสร้าง ID ไม่ซ้ำกัน

// --- ENTRY POINT (จุดเริ่มต้นของแอป) ---

// ค้นหา Element ที่มี id="root" ใน index.html เพื่อเป็นที่สิงสถิตของ React App
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// สร้าง Root ของ React และ Render component หลัก (App) เข้าไป
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* App คือ Component หลักที่เป็นแม่ของทุกหน้า */}
    <App />
  </React.StrictMode>
);
