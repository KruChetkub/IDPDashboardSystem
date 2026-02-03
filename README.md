# IDP Dashboard System

ระบบ Dashboard แสดงผลแผนพัฒนาบุคลากรรายบุคคล (Individual Development Plan - IDP) พัฒนาด้วย **React + Vite** และ **Tailwind CSS** เชื่อมต่อข้อมูลจาก Google Sheets ผ่าน Vercel Serverless Functions

## เอกสารประกอบ (Documentation)

คุณสามารถอ่านรายละเอียดการพัฒนาและคู่มือการใช้งานได้ในโฟลเดอร์ `docs/`:

- **[คู่มือการ Deploy (Deployment Guide)](docs/deployment_guide.md)**: วิธีการนำเว็บขึ้น Vercel และการอัปเดตเว็บไซต์
- **[บันทึกการทำงาน (Work Log)](docs/task.md)**: รายการสิ่งที่ทำไปแล้วและสถานะของแต่ละงาน
- **[ขั้นตอนการใช้งานเบื้องต้น (Walkthrough)](docs/walkthrough.md)**: วิธีการรันโปรเจกต์ในเครื่อง
- **[แผนความปลอดภัย (Security Plan)](docs/security_plan.md)**: รายละเอียดสถาปัตยกรรมการดึงข้อมูล
- **[แผนการทำ Dark Mode](docs/implementation_plan.md)**: รายละเอียดการพัฒนาธีมสีเข้ม
- **[แผนพัฒนาในอนาคต (Roadmap)](docs/future_roadmap.md)**: ข้อเสนอแนะสำหรับการพัฒนาต่อยอด

## Quick Start

1.  ติดตั้ง Dependencies:
    ```bash
    npm install
    ```
2.  รันโปรเจกต์ (Local):
    ```bash
    npm run dev
    ```
3.  สร้าง Production Build:
    ```bash
    npm run build
    ```
