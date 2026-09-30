# PART 1 — System Architecture

ระบบ E-Portfolio และ Agricultural Digital Innovation Portal ของ ดร.กิตติ โพธิ์จวง
สำนักงานเกษตรจังหวัดกำแพงเพชร กรมส่งเสริมการเกษตร

## 1. ภาพรวมสถาปัตยกรรม (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — PRESENTATION (Google Sites)                          │
│  - หน้า Google Sites ฝัง "Embed" / iframe                        │
│  - ใช้แค่เป็น "กรอบ" host ให้ HTML App ทำงานอยู่ภายใน             │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ iframe src=
┌───────────────────────────────▼───────────────────────────────────┐
│  LAYER 2 — EMBEDDED HTML APPLICATION (index.html / admin.html)   │
│  - Single Page App, Vanilla JS + CSS (Theme 3 แบบ: Light/Dark/   │
│    Mourning) เก็บค่าธีมที่ localStorage                          │
│  - โหลดข้อมูลจริงผ่าน API; มี fallback สำหรับ Preview ก่อน Deploy │
│  - Hosted แยกบน GitHub Pages / Google Drive "Publish to Web" /   │
│    Apps Script HtmlService (เลือกได้ ดู PART 6)                  │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS fetch (GET/POST/PUT/DELETE)
┌───────────────────────────────▼───────────────────────────────────┐
│  LAYER 3 — GOOGLE APPS SCRIPT (REST API) — Code.gs                │
│  - Web App deployment (doGet / doPost) ทำหน้าที่เป็น REST router  │
│  - Endpoint รูปแบบ: ?sheet=Research&action=list|get|create|...   │
│  - ตรวจสอบ token/secret สำหรับ POST/PUT/DELETE (เขียนข้อมูล)      │
│  - แปลงแถวใน Sheet ↔ JSON                                         │
│  - จัดการอัปโหลดไฟล์ไป Google Drive และคืน fileId                 │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ SpreadsheetApp / DriveApp
┌───────────────────────────────▼───────────────────────────────────┐
│  LAYER 4 — GOOGLE SHEETS (DATABASE)                                │
│  - 1 Spreadsheet, 17 Sheet (ตาราง) ตาม PART 2                     │
│  - แต่ละแถว = 1 record, แถวแรก = header/schema                   │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ DriveApp.getFileById(fileId)
┌───────────────────────────────▼───────────────────────────────────┐
│  LAYER 5 — GOOGLE DRIVE (MEDIA STORAGE)                            │
│  - โฟลเดอร์แยกตามประเภท: Profile/, Dashboards/, Gallery/,         │
│    University/, Activities/                                       │
│  - Sheet เก็บเฉพาะ Drive File ID ไม่เก็บไฟล์ตรง                  │
│  - Frontend แสดงรูปผ่าน URL:                                      │
│    https://drive.google.com/uc?export=view&id=FILE_ID            │
└─────────────────────────────────────────────────────────────────┘
```

## 2. การไหลของข้อมูล (Data Flow) — ตัวอย่าง "โหลดหน้าแรก"

1. ผู้ใช้เปิดหน้า Google Sites → iframe โหลด `index.html`
2. `index.html` รัน `App.init()` → เรียก
   `fetch(`${API_URL}?sheet=Hero&action=list`)`
   `fetch(`${API_URL}?sheet=DashboardStatistics&action=list`)`
   `fetch(`${API_URL}?sheet=Education&action=list`)` ... (parallel)
3. Apps Script `doGet(e)` อ่านค่า `sheet` + `action` จาก query string
   → เปิด Sheet ที่ระบุ → แปลงเป็น Array of Object → ส่งกลับเป็น JSON
4. Frontend รับ JSON → render DOM (Hero, Cards, Timeline, Mindmap ฯลฯ)
5. รูปภาพ: ทุก record ที่มีคอลัมน์ `ImageFileID` → frontend ต่อ URL
   Google Drive direct-view เอง ไม่ต้องผ่าน API ซ้ำ

## 3. การไหลของข้อมูล — ตัวอย่าง "แอดมินเพิ่มงานวิจัยใหม่"

1. แอดมิน Login ด้วยชื่อผู้ใช้และรหัสผ่านที่หน้า `admin.html`
   (Apps Script เปรียบเทียบชื่อผู้ใช้และ SHA-256 hash กับ Script Properties)
2. กรอกฟอร์ม "เพิ่มงานวิจัย" → แนบไฟล์ปก (ถ้ามี)
3. ถ้ามีไฟล์: frontend ส่ง base64 ไป
   `POST ${API_URL}` body: `{action:"uploadFile", sheet:"Research", file...}`
   → Apps Script เซฟไฟล์ลง Drive โฟลเดอร์ `Research/` → คืน `fileId`
4. Frontend ส่ง `POST ${API_URL}` body:
   `{action:"create", sheet:"Research", token:"...", data:{...,ImageFileID:fileId}}`
5. Apps Script ตรวจ token → `appendRow()` ลง Sheet `Research`
6. ส่ง response `{status:"ok", id: newId}` กลับ → frontend อัปเดตตาราง
   ทันทีโดยไม่ reload

## 4. การเชื่อมโยงความเชี่ยวชาญกับผลงาน

1. `Expertise` เก็บกลุ่มความเชี่ยวชาญและทักษะย่อยด้วย ID ถาวร
2. `ExpertiseRelations` เชื่อม `ExpertiseID` กับ `WorkType + WorkID`
3. Admin เลือกทั้งสองด้านจากรายการ ไม่พิมพ์ ID เอง
4. API ตรวจว่า ID มีอยู่จริง ป้องกันข้อมูลซ้ำ วงจร Parent และการลบรายการที่ถูกอ้างอิง
5. Frontend อ่านความสัมพันธ์เพื่อแสดงจำนวนและรายการผลงานใน 2.5D Focus Graph
6. จอเดสก์ท็อปแสดงเส้นโค้งแบบเคลื่อนไหวและเปิดทักษะย่อยเฉพาะกลุ่มที่เลือก
   ส่วนจอมือถือเปลี่ยนเป็นแถบเลือกกลุ่มแนวนอนเพื่อรักษาขนาดตัวอักษรและพื้นที่สัมผัส
7. รายการผลงานที่เชื่อมจากหลายทักษะจะถูกรวมด้วย `WorkType + WorkID`
   ก่อนแสดงผล เพื่อไม่ให้ผลงานเดียวกันซ้ำในแผงรายละเอียด
8. `ExpertiseLinks` เชื่อมโหนดความรู้เข้าหากันด้วยต้นทาง ปลายทาง ประเภท และ
   น้ำหนักความสัมพันธ์ โดย Frontend เน้นโหนดเพื่อนบ้านและลิงก์ที่เกี่ยวข้องเมื่อเลือกโหนด
9. แนวทางนี้นำแกนของ LLM Wiki มาใช้เฉพาะส่วน Knowledge Graph และ source
   traceability โดยยังคงสถาปัตยกรรม HTML + Google Sheets ที่ดูแลและฝังใน Google Sites ได้ง่าย

## 5. ระบบนำเข้าข้อมูล

- ทุก Sheet ใน Admin รองรับ CSV Template, Export CSV และ Import CSV
- หมวดเนื้อหารองรับ Import URL ผ่าน `previewUrl` โดยอ่าน Open Graph metadata
- Admin ต้องตรวจตัวอย่างก่อนบันทึก ระบบจึงสร้างรายการปลายทางและ `References`
  ที่เชื่อมด้วย `WorkType + WorkID` เพื่อรักษาที่มาของข้อมูล
- URL ภายในเครือข่ายและ URL ที่ไม่ใช่ HTTP/HTTPS ถูกปฏิเสธที่ Backend

## 6. หลักการสำคัญที่ต้องคงไว้ตลอดการพัฒนา

- **ข้อมูลจริงมาจาก Sheet** ส่วนข้อมูลใน HTML/JS เป็น fallback สำหรับ Preview
  ก่อน Deploy เท่านั้น เมื่อ API มีข้อมูล ระบบให้ข้อมูลจากฐานจริงมีลำดับความสำคัญสูงกว่า
- **Sheet ID และ Apps Script URL** ต้องตั้งเป็นตัวแปร config ตำแหน่งเดียว
  ดูจุดที่ต้องแก้ในแต่ละไฟล์ที่ PART 7
- **Idempotent ID**: ทุกแถวมีคอลัมน์ `ID` (UUID หรือ running number)
  ใช้สำหรับ GET-by-id / PUT / DELETE
- **Scalability**: ฟังก์ชัน list รองรับ paging (`?page=&limit=`) และ
  filter/search (`?q=&category=`) ทำในระดับ Apps Script ก่อนส่ง JSON
  ออกไป เพื่อไม่ให้ frontend โหลดข้อมูล 1,000+ แถวมาทั้งหมดทีเดียว
- **Security**: endpoint ที่เขียนข้อมูล (create/update/delete/upload)
  ต้องส่ง `token` ที่ตรงกับค่าใน `PropertiesService` ของ Apps Script
  (ตั้งจาก Script Properties ไม่ฝังในโค้ดที่เผยแพร่)

## 7. รายชื่อไฟล์ในระบบ

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | Frontend หลักที่ฝังใน Google Sites |
| `admin.html` | ระบบหลังบ้าน (CMS) แยกไฟล์ ไม่ฝังใน Sites |
| `apps_script/Code.gs` | REST API + Drive upload + Auth |
| `apps_script/SheetSetup.gs` | สคริปต์สร้าง 17 sheet + migration แบบไม่ล้างข้อมูล |
| `docs/02_sheet_structure.md` | โครงสร้างฐานข้อมูล 17 ตาราง |
| `docs/06_google_sites_embed_guide.md` | วิธีฝังลง Google Sites |
| `docs/07_deployment_manual.md` | ขั้นตอน deploy ทั้งระบบ |
