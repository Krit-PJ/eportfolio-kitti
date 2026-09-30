# E-Portfolio Kitti — v4

เว็บไซต์ผลงานและประสบการณ์ พร้อมระบบจัดการข้อมูล Google Sheets / Apps Script

เริ่มต้นอ่าน `docs/07_deployment_manual.md` และ `README_DEPLOYMENT_TH.md`

## เปิดตัวอย่างในเครื่อง

เปิด Terminal ในโฟลเดอร์นี้ แล้วใช้ Python ที่ติดตั้งอยู่:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

เปิด http://127.0.0.1:4173/index.html

เมื่อยังไม่ได้ตั้ง API URL เว็บไซต์เป็นโหมดตัวอย่าง ข้อมูลในโหมดนี้ไม่ใช่ผลยืนยันจากฐานข้อมูลออนไลน์ การเข้าสู่ระบบและบันทึกข้อมูลจริงต้องติดตั้ง Apps Script และตั้งค่า API URL ใน HTML ทั้งสองไฟล์ก่อน

## ไฟล์หลัก

- `index.html` — เว็บไซต์สาธารณะ
- `admin.html` — ฟอร์มจัดการข้อมูล เพิ่ม แก้ไข ลบ และภาพหลักฐาน
- `apps_script/Code.gs` — API
- `apps_script/SheetSetup.gs` — สร้างฐานข้อมูลและอัปเกรดโครงสร้าง
- `assets/` — ภาพ Snapshot และวิดีโอ

ฐานข้อมูลเดิมต้องสำรองก่อนอัปเกรดและใช้ migration ตามคู่มือ ห้ามรัน `setupAllSheets()` บนฐานข้อมูลที่มีข้อมูลอยู่แล้ว

