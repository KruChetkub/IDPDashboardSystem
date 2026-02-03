# การเริ่มต้นใช้งาน Project (Walkthrough)

เนื่องจากไม่สามารถแก้ไขไฟล์ `index.html` เดิมได้โดยตรง (เนื่องจากไฟล์ถูกเปิดใช้งานอยู่) ทางเราจึงได้สร้างโฟลเดอร์โปรเจกต์ใหม่ชื่อ `IDP-Dashboard-Vite` ขึ้นมาแทน

## สิ่งที่ทำไปแล้ว (Changes Made)
1.  **สร้างโปรเจกต์ใหม่**: ในโฟลเดอร์ `IDP-Dashboard-Vite`
2.  **ตั้งค่า Configuration**: สร้าง `package.json`, `vite.config.js`, `tailwind.config.js` ให้รองรับ React + Tailwind
3.  **ย้ายโค้ด**: แปลงโค้ดจาก `index.html` เดิม มาเป็น `src/App.jsx` ที่ถูกต้องตามหลัก React Component
4.  **ตกแต่ง**: ตั้งค่า CSS และนำฟังก์ชัน Helper ต่างๆ เข้ามาให้ครบถ้วน
5.  **เพิ่มฟีเจอร์ Dark Mode**:
    - เพิ่มปุ่มสลับธีม (Toggle) ที่มุมบนขวา
    - ปรับปรุง UI (สีพื้นหลัง, ตัวหนังสือ, กราฟ, modal) ให้รองรับโหมดมืด
    - บันทึกค่าธีมล่าสุดของผู้ใช้

## วิธีการรันโปรเจกต์ (How to Run)

1.  เปิด Terminal (Command Line)
2.  เข้าไปที่โฟลเดอร์โปรเจกต์:
    ```bash
    cd IDP-Dashboard-Vite
    ```
3.  ตรวจสอบการติดตั้ง (หากยังไม่เสร็จ):
    ```bash
    npm install
    ```
4.  เริ่มรัน Server:
    ```bash
    npm run dev
    ```
5.  เปิด Browser ไปที่ลิงก์ที่แสดง (ปกติคือ `http://localhost:5173`)

## การตรวจสอบ (Verification Results)
- [x] โครงสร้างไฟล์ถูกต้อง
- [x] โค้ดถูกย้ายมายัง `App.jsx` ครบถ้วน
- [ ] ทดสอบการรันและใช้งานจริง (User Verification)
