# แผนการทำ Dark Mode

## เป้าหมาย
เพิ่มความสามารถในการสลับธีม (Light/Dark) เพื่อถนอมสายตาและเพิ่มความทันสมัยให้กับ Dashboard

## แนวทางการแก้ไข (Solution)
เราจะใช้ความสามารถของ **Tailwind CSS** (`darkMode: 'class'`) ร่วมกับ **React State**

### ขั้นตอนการดำเนินงาน
1.  **ตั้งค่า Tailwind**: เปิดใช้งาน `darkMode: 'class'` ใน `tailwind.config.js`
2.  **จัดการ State**:
    - สร้าง State `theme` ('light' | 'dark') ใน `App.jsx`
    - เก็บค่าลง `localStorage` เพื่อให้เว็บจำค่าเดิมไว้เสมอ
    - เขียน Logic เพื่อเติม Class `dark` ลงใน Tag `<html>` หรือ `div` หลัก
3.  **UI Components**:
    - ไล่เพิ่ม Class `dark:...` ให้กับทุก Element
    - พื้นหลัง: `bg-slate-50` -> `dark:bg-slate-900`
    - การ์ด: `bg-white` -> `dark:bg-slate-800`
    - ตัวหนังสือ: `text-slate-800` -> `dark:text-slate-100`
4.  **Charts (กราฟ)**:
    - เนื่องจาก Recharts เป็น SVG ต้องเขียน Logic ให้เปลี่ยนสี Fill/Stroke ตาม State `theme`

## ผลลัพธ์ที่คาดหวัง
- มีปุ่มรูป พระอาทิตย์/พระจันทร์ มุมขวาบน
- เมื่อกดแล้ว สีของทั้งหน้าเปลี่ยนทันที
- สีกราฟอ่านรู้เรื่องทั้ง 2 โหมด
