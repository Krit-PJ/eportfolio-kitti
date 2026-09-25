# PART 7 — คู่มือ Deploy ทั้งระบบ (Step by Step)

## ขั้นตอนที่ 1 — สร้าง Google Sheet ฐานข้อมูล

1. ไปที่ [sheets.google.com](https://sheets.google.com) → สร้างไฟล์ใหม่
   ตั้งชื่อ `EPortfolio_Database`
2. เปิด **Extensions → Apps Script**
3. ลบโค้ดเดิมใน `Code.gs` ทั้งหมด แล้ว copy เนื้อหาจาก
   [`apps_script/SheetSetup.gs`](../apps_script/SheetSetup.gs) วางแทน
4. กด **Run** เลือกฟังก์ชัน `setupAllSheets` → ครั้งแรกจะขอ Authorize
   (เลือกบัญชี Google ของหน่วยงาน → Advanced → Go to project (unsafe) →
   Allow) — ทำตามได้เพราะเป็นสคริปต์ของเราเอง
5. รันอีกฟังก์ชัน `setupDriveFolders` (เลือกจาก dropdown ข้าง Run → Run)
   จะได้โฟลเดอร์ Drive `EPortfolio_Media` พร้อม subfolder อัตโนมัติ
6. กลับไปดู Spreadsheet จะเห็น Sheet ตามโครงสร้างล่าสุดพร้อม header ครบ

> **กรณีอัปเกรดจากเวอร์ชันเดิม:** ห้ามรัน `setupAllSheets()` เพราะฟังก์ชันนี้
> ใช้สำหรับติดตั้งใหม่และล้างข้อมูลเดิม ให้เพิ่มโค้ด `SheetSetup.gs` เวอร์ชันล่าสุด
> แล้วรัน `migrateRelationalPortfolioSchema()` เพื่อเพิ่ม `Expertise`,
> `ExpertiseRelations`, `ExpertiseLinks` และคอลัมน์ใหม่ของระบบ Import
> จากนั้นรัน `migrateDashboardStatisticLinks()` เพื่อเพิ่มคอลัมน์ `LinkTarget`
> ให้การ์ดผลกระทบและประสบการณ์วิชาชีพ
> และรัน `migrateBlogKnowledgeHub()` เพื่อเพิ่มคอลัมน์เรื่องเล่า ประเภทเนื้อหา
> แหล่งที่มา URL ต้นฉบับ ผู้เขียน รูปปก เวลาอ่าน และสถานะบทความเด่น

> **จุดที่ต้องจดไว้**: เปิดแถบ URL ของ Spreadsheet
> `https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID`**`/edit`
> คัดลอกค่า `SPREADSHEET_ID` ไว้ใช้อ้างอิง (จริงๆ Code.gs ใช้
> `SpreadsheetApp.getActiveSpreadsheet()` จึงไม่ต้องฝัง ID ตรงๆ
> ตราบใดที่ฝัง Apps Script ไว้ในไฟล์ Sheet นี้โดยตรง)

## ขั้นตอนที่ 2 — ติดตั้ง REST API (Code.gs)

1. ใน Apps Script Editor (โปรเจกต์เดียวกับขั้นตอนที่ 1) สร้างไฟล์ใหม่
   ชื่อ `API` (หรือเพิ่มต่อใน `Code.gs` เดิมก็ได้ เพราะแชร์ Sheet เดียวกัน)
2. Copy เนื้อหาทั้งหมดจาก [`apps_script/Code.gs`](../apps_script/Code.gs)
   วางลงไป
3. ตั้งค่า **Token สำหรับเขียนข้อมูล**: ไปที่ ⚙️ **Project Settings** →
   เลื่อนลงหา **Script Properties** → Add script property
   - Property: `API_TOKEN`
   - Value: สุ่มค่าความปลอดภัยสูง เช่น `openssl rand -hex 16` หรือพิมพ์
     อะไรก็ได้ที่คาดเดายาก (เก็บไว้ที่นี่เท่านั้น **ห้ามฝังในโค้ด Frontend**
     โดยตรง — ค่านี้จะถูกส่งกลับให้ Frontend หลัง login สำเร็จเท่านั้น
     ผ่าน `verifyAdmin`)
   - Property: `INLINE_EDIT_PASSWORD`
   - Value: รหัสผ่านสำหรับปุ่มเข้าสู่ระบบแก้ไขบนหน้า Portfolio
     (ระบบจริงตรวจรหัสที่ Apps Script และไม่ฝังรหัสจริงในหน้าเว็บ)
   - Property: `GOOGLE_CLIENT_ID`
   - Value: OAuth Client ID เดียวกับที่กำหนดใน `admin.html` ระบบใช้ตรวจ
     audience ของ Google ID Token ก่อนอนุญาตให้เข้าสู่ระบบ
4. แก้ `AdminEmails` ใน Sheet `Settings` ให้เป็นอีเมลแอดมินจริง
   (คั่นด้วย `,` ถ้ามีหลายคน)
5. **Deploy → New deployment**
   - Select type: **Web app**
   - Description: `EPortfolio API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy → Authorize อีกครั้งถ้าถูกขอ
6. คัดลอก **Web app URL** ที่ได้ รูปแบบ
   `https://script.google.com/macros/s/`**`DEPLOYMENT_ID`**`/exec`
   → นี่คือค่า **`API_URL`** ที่ต้องเอาไปแก้ในไฟล์ Frontend/Admin

> **ทุกครั้งที่แก้โค้ด `Code.gs`** ต้องไปที่ Deploy → Manage deployments →
> เลือก deployment เดิม → ไอคอนดินสอ → Version: **New version** → Deploy
> (ถ้าใช้ "Test deployments" URL จะเปลี่ยนทุกครั้ง ไม่ควรใช้ของจริง)

การใช้งานเมนู **Import URL** ครั้งแรก Apps Script อาจขอสิทธิ์เชื่อมต่อ
เว็บไซต์ภายนอก (`UrlFetchApp`) ให้ Authorize ด้วยบัญชีเจ้าของระบบ จากนั้นระบบจะ
อ่าน Open Graph Metadata, ชื่อแหล่งข้อมูล, วันที่เผยแพร่ และสร้างข้อความอ้างอิง
เพื่อให้ Admin ตรวจสอบก่อนบันทึก ระบบสามารถสร้างทั้งรายการปลายทางและแถว
`References` ที่เชื่อมกลับไปยังรายการนั้นโดยอัตโนมัติ

## ขั้นตอนที่ 3 — ตั้งค่า Google OAuth Client ID (สำหรับ Login หน้า Admin)

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
   → สร้างโปรเจกต์ใหม่ (หรือใช้โปรเจกต์เดียวกับ Apps Script ก็ได้ —
   ดูได้จาก Apps Script → Project Settings → Google Cloud Platform (GCP) Project)
2. ไปที่ **APIs & Services → OAuth consent screen** → ตั้งค่า App name,
   support email → Save
3. ไปที่ **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: ใส่ URL ที่จะ host `admin.html`
     เช่น `https://yourname.github.io`
4. คัดลอก **Client ID** (รูปแบบ `xxxxx.apps.googleusercontent.com`)

## ขั้นตอนที่ 4 — แก้ค่า Config ในไฟล์ Frontend

### ไฟล์ [`index.html`](../index.html)
ค้นหาคำว่า `CONFIG` ใกล้ปลายไฟล์ (ก่อน `</body>`) แก้บรรทัด:
```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec', // <-- แก้ตรงนี้
  EDIT_PASSWORD: '' // Production ต้องเว้นว่าง
};
```
แทนที่ด้วย Web app URL จากขั้นตอนที่ 2

### ไฟล์ [`admin.html`](../admin.html)
ค้นหาคำว่า `CONFIG` แก้ทั้ง 2 ค่า:
```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec', // <-- แก้ตรงนี้
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com' // <-- แก้ตรงนี้
};
```

## ขั้นตอนที่ 5 — Host ไฟล์ และฝังลง Google Sites

ดูรายละเอียดที่ [`06_google_sites_embed_guide.md`](06_google_sites_embed_guide.md)

## ขั้นตอนที่ 6 — กรอกข้อมูลจริงผ่านระบบหลังบ้าน

1. เปิด `admin.html` ที่ host ไว้ → Login ด้วย Gmail ที่อยู่ใน `AdminEmails`
2. กรอกข้อมูล **Profile** และ **Hero** ก่อน (เป็น singleton ต้องมี 1 แถว)
3. ใส่ **DashboardStatistics** 5 รายการ, **Education**, **Mindmap**
4. ทยอยเพิ่ม Dashboards / Research / Publications / Projects / Training /
   Blog / Gallery / Contact ตามจริง
5. ทุกเมนูใช้ปุ่ม **Template** เพื่อดาวน์โหลดหัวคอลัมน์ และ **Import CSV** เพื่อเพิ่มข้อมูลเป็นชุด
6. ใช้ **Import URL** สำหรับ Dashboards, Research, Publications, Projects, Training,
   Blog, Gallery และ References แล้วตรวจ Metadata ก่อนกดนำเข้า
   - หากเลือก `Blog` ระบบจะจำแนก Facebook เป็น `ข่าวและกิจกรรม` และเว็บไซต์ทั่วไปเป็น `องค์ความรู้` เบื้องต้น
   - หลังนำเข้าให้เปิดรายการในเมนู `เรื่องเล่า / องค์ความรู้` เพื่อตรวจแก้เนื้อหา ผู้เขียน ประเภท เวลาอ่าน และสถานะบทความเด่นก่อนเผยแพร่
7. เพิ่มรายการใน `Expertise` แล้วใช้ `ExpertiseRelations` เลือกความเชี่ยวชาญและ
   ผลงานที่ต้องการเชื่อม ระบบจะตรวจสอบ ID และป้องกันความสัมพันธ์ซ้ำอัตโนมัติ
8. ใช้ `ExpertiseLinks` เชื่อมโหนดต้นทางและปลายทาง พร้อมระบุประเภทและน้ำหนัก
9. กลับไปเปิด `index.html` รีเฟรชหน้า ตรวจสอบว่าข้อมูลแสดงถูกต้อง

## Checklist ก่อนเผยแพร่จริง

- [ ] `setupAllSheets()` และ `setupDriveFolders()` รันสำเร็จ
- [ ] ระบบเดิมรัน `migrateRelationalPortfolioSchema()` และมี Sheet ความสัมพันธ์ครบ
- [ ] Script Property `API_TOKEN` ตั้งค่าแล้ว
- [ ] Script Property `INLINE_EDIT_PASSWORD` ตั้งค่าแล้ว
- [ ] Script Property `GOOGLE_CLIENT_ID` ตรงกับ `admin.html`
- [ ] `Settings.AdminEmails` มีอีเมลแอดมินถูกต้อง
- [ ] Apps Script deploy เป็น Web app, Execute as Me, Anyone เข้าถึงได้
- [ ] แก้ `CONFIG.API_URL` ใน `index.html` และ `admin.html` แล้ว
- [ ] แก้ `CONFIG.GOOGLE_CLIENT_ID` ใน `admin.html` แล้ว
- [ ] ทดสอบ Login เข้า Admin สำเร็จ และ CRUD ได้จริงทุกเมนู
- [ ] ทดสอบวาง URL, ตรวจ Metadata/การอ้างอิง และบันทึกลง Timeline สำเร็จ
- [ ] ทดสอบเลือก Node แล้วพบผลงานที่เชื่อมโยง และระบบปฏิเสธ WorkID ที่ไม่มีจริง
- [ ] ทดสอบ Knowledge Links เน้นโหนดเพื่อนบ้านและแสดงคำอธิบายในแผงรายละเอียด
- [ ] ทดสอบเปิด `index.html` ตรงๆ ในเบราว์เซอร์ ข้อมูลขึ้นครบ
- [ ] ฝัง Embed ใน Google Sites แล้วแสดงผลถูกต้องบนมือถือ/เดสก์ท็อป
- [ ] ทดสอบสลับ Theme กลางวัน/กลางคืน/ไว้ทุกข์ ค่าจำได้หลัง reload
