# PART 6 — วิธีฝัง E-Portfolio ลงใน Google Sites

Google Sites ไม่อนุญาตให้วาง `<script>`/`<style>` ของเราตรงๆ ลงในหน้า ต้อง
**Host ไฟล์ `index.html` ไว้ที่อื่นก่อน แล้วฝังด้วย Embed/iframe** วิธีที่แนะนำมี
3 แบบ เลือกแบบเดียวก็พอ

---

## วิธีที่ 1 (แนะนำ) — Host บน GitHub Pages

1. สร้าง repository ใหม่ (public) เช่น `eportfolio-kitti`
2. อัปโหลด `index.html` ขึ้น branch `main`
3. ไปที่ Settings → Pages → Source: `main` / root → Save
4. จะได้ URL เช่น `https://yourname.github.io/eportfolio-kitti/`
5. ไปที่ Google Sites → แทรก (Insert) → **Embed** → **By URL**
   → วาง URL ด้านบน → Insert
6. ปรับขนาด iframe ให้เต็มความกว้างหน้า (Full width) และสูงพอสมควร
   (แนะนำ ≥ 1200px เพราะเป็น SPA ที่มีหลายหน้าซ้อนอยู่ใน iframe เดียว)

ข้อดี: ฟรี, อัปเดตไฟล์ง่ายด้วย git push, รองรับ custom domain ได้

## วิธีที่ 2 — Host ด้วย Apps Script HtmlService (อยู่ในระบบ Google เดียวกัน)

1. เปิด Apps Script Project เดียวกันกับ Backend (Code.gs)
2. สร้างไฟล์ HTML ใหม่ชื่อ `Index` แล้ว copy เนื้อหา `index.html` ทั้งหมดวาง
3. เพิ่มฟังก์ชันนี้ใน `Code.gs`:
   ```js
   function doGetPage() {
     return HtmlService.createHtmlOutputFromFile('Index')
       .setTitle('E-Portfolio')
       .addMetaTag('viewport', 'width=device-width, initial-scale=1');
   }
   ```
   > หมายเหตุ: ถ้าใช้ไฟล์ Apps Script เดียวกับ REST API ให้แยก Deployment เป็น
   > 2 deployment (Web App คนละตัว) เพราะ `doGet` ของ REST API กับของหน้าเว็บ
   > ชนกัน — แนะนำสร้างเป็น Apps Script Project แยกสำหรับ Frontend โดยเฉพาะ
   > แล้วให้ `Code.gs` (REST API) เป็นอีก Deployment หนึ่ง
4. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
5. จะได้ URL `https://script.google.com/macros/s/XXXX/exec`
6. นำ URL ไปฝังที่ Google Sites ด้วย Embed → By URL เหมือนวิธีที่ 1

ข้อดี: อยู่ใน ecosystem Google ทั้งหมด ไม่ต้องพึ่ง GitHub

## วิธีที่ 3 — Host บน Google Drive (Publish to Web)

1. อัปโหลด `index.html` ขึ้น Google Drive
2. เปิดไฟล์ด้วย Google Drive Viewer ไม่เหมาะกับ SPA ที่มี JS ซับซ้อน
   (Drive จะ render เป็น preview ไม่ execute JS เต็มรูปแบบ) — **ไม่แนะนำ**
   ใช้วิธีที่ 1 หรือ 2 แทน

---

## การฝังหน้า Admin CMS (admin.html)

**ห้ามฝัง `admin.html` ไว้ใน Google Sites** เพราะเป็นหน้าหลังบ้านที่ต้อง
ป้องกันการเข้าถึง ให้ host ไว้คนละ URL จากหน้า public (เช่นอีก repository
GitHub แบบ private, หรือ Apps Script deployment คนละตัว) แล้วแชร์ลิงก์ตรง
ให้แอดมินเข้าใช้งานเองนอกหน้า Sites

## CORS

Apps Script Web App (`doGet`/`doPost` ที่คืนค่าด้วย `ContentService`)
อนุญาต CORS โดยอัตโนมัติสำหรับ `fetch()` แบบ GET/POST ทั่วไปอยู่แล้ว
ไม่ต้องตั้งค่าเพิ่ม แต่ถ้าพบ error CORS ให้ตรวจสอบว่า Deploy เป็น
**"New deployment"** ทุกครั้งที่แก้โค้ด (Apps Script ใช้ URL เดิมได้ถ้า
Manage deployments → แก้ deployment เดิม → Version: New)

## การทดสอบก่อนฝังจริง

เปิด `index.html` ตรงในเบราว์เซอร์ (ปรับ `CONFIG.API_URL` ให้ถูกต้องก่อน)
ตรวจสอบว่าทุก section โหลดข้อมูลจาก Sheet ได้ถูกต้อง ก่อนนำไปฝังใน
Google Sites จริง เพื่อแยกปัญหาระหว่าง "โค้ดผิด" กับ "ฝังผิดวิธี"
