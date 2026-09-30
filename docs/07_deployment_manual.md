# คู่มือนำ E-Portfolio ไปใช้งานจริงทีละขั้นตอน

คู่มือนี้ใช้กับชุดโค้ดปัจจุบัน โดยแยกเว็บไซต์สาธารณะ (`index.html`), ระบบหลังบ้าน (`admin.html`) และ Google Apps Script API (`apps_script/`) ออกจากกัน ห้ามนำรหัสผ่านหรือ Token ไปใส่ในไฟล์ HTML

## 1. สำรองและเตรียมไฟล์

1. แตก ZIP ไปยังโฟลเดอร์ใหม่และเก็บ ZIP ต้นฉบับไว้สำหรับย้อนกลับ
2. ตรวจว่ามี `index.html`, `admin.html`, `3. Kitti.png`, `LOGO-DOAE.png`, `field-impact-story.mp4`, `field-impact-story-poster.jpg`, โฟลเดอร์ `assets/` และ `apps_script/`
3. เปิด `index.html` ผ่าน local web server เพื่อตรวจรูปแบบก่อนเชื่อมฐานข้อมูล ห้ามใช้การดับเบิลคลิกไฟล์เป็นวิธีทดสอบสุดท้าย เพราะนโยบายเบราว์เซอร์บางตัวต่างจากเว็บจริง
4. ถ้าอัปเกรดระบบเดิม ให้ทำสำเนา Google Sheet และดาวน์โหลดข้อมูลสำคัญเป็น XLSX ก่อนทุกครั้ง

## 2. สร้างฐานข้อมูล Google Sheets

### ติดตั้งใหม่

1. สร้าง Google Sheet ใหม่ชื่อ `EPortfolio_Database`
2. เปิด `ส่วนขยาย` > `Apps Script`
3. สร้างไฟล์ `SheetSetup.gs` และคัดลอกโค้ดจาก `apps_script/SheetSetup.gs`
4. สร้างไฟล์ `Code.gs` และคัดลอกโค้ดจาก `apps_script/Code.gs`
5. กด Save แล้วเลือก `setupAllSheets` > Run > อนุญาตสิทธิ์
6. เลือก `setupDriveFolders` > Run หนึ่งครั้ง
7. กลับไปที่ Sheet และตรวจว่ามีทุกแท็บ รวมถึง `Blog` และ `EvidenceImages`

หาก `setupDriveFolders()` ถูกหยุดด้วยข้อความ `Exceeded maximum execution time` ให้วาง
`SheetSetup.gs` เวอร์ชันล่าสุดแล้วรันฟังก์ชันเดิมซ้ำตามข้อความแจ้งเตือน ฟังก์ชันเวอร์ชันนี้
สร้างครั้งละหนึ่งโฟลเดอร์และบันทึก Folder ID ทันที ใช้ทั้งหมดไม่เกิน 6 รอบ และทำงานต่อจาก
รายการที่บันทึกสำเร็จแล้วโดยไม่สร้างรายการนั้นซ้ำ

`setupAllSheets()` รุ่นล่าสุดเป็นแบบ additive: เติมเฉพาะ Sheet/หัวคอลัมน์/ค่าตั้งต้นที่ขาด
และไม่ล้างข้อมูลเดิม ทั้งนี้ยังควรสำรอง Google Sheet ก่อนอัปเกรดทุกครั้ง

### อัปเกรดฐานข้อมูลเดิม

1. สำรอง Google Sheet เดิม
2. แทนที่ `SheetSetup.gs` และ `Code.gs` ด้วยเวอร์ชันล่าสุด
3. รัน `setupAllSheets()` รุ่นล่าสุดได้เพื่อเติมโครงสร้างที่ขาดโดยไม่ล้างข้อมูล
4. รันตามลำดับ: `migrateRelationalPortfolioSchema()`, `migrateDashboardStatisticLinks()`, `migrateBlogKnowledgeHub()`, `migrateStoryEvidenceImages()`
5. ตรวจว่าข้อมูลเดิมยังอยู่และมีแท็บ `EvidenceImages` ซึ่งเชื่อมภาพหลายภาพกับเรื่องเล่าผ่าน `BlogID`

## 3. ตั้งค่าความปลอดภัยใน Script Properties

1. ใน Apps Script เปิด `Project Settings` > `Script Properties`
2. เพิ่ม `API_TOKEN` เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร
3. ไม่ต้องพิมพ์รหัสผ่านจริงหรือค่า hash เอง ให้ตั้งบัญชีด้วยฟังก์ชันในขั้นตอนถัดไป
4. สร้างฟังก์ชันชั่วคราวใน Apps Script เช่น

```js
function configureAdminOnce() {
  setAdminCredentials_('ชื่อผู้ใช้ที่ต้องการ', 'รหัสผ่านใหม่ที่ไม่เคยเปิดเผย');
}
```

5. Run `configureAdminOnce` หนึ่งครั้ง แล้วลบฟังก์ชันชั่วคราวและ Save
6. ตรวจใน Script Properties ว่ามี `ADMIN_USERNAME` และ `ADMIN_PASSWORD_HASH` ห้ามมีรหัสผ่านจริง

หน้า Login จะไม่แสดงชื่อบัญชีล่วงหน้า ผู้ดูแลต้องกรอกชื่อผู้ใช้และรหัสผ่านเอง

## 4. Deploy Google Apps Script API

1. เลือก `Deploy` > `New deployment` > `Web app`
2. Description ใช้ชื่อที่ระบุเวอร์ชัน เช่น `E-Portfolio API 2026-09`
3. Execute as เลือก `Me`
4. Who has access เลือก `Anyone`
5. กด Deploy และอนุญาตสิทธิ์
6. คัดลอก URL รูปแบบ `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
7. เปิด URL ในหน้าต่างใหม่เพื่อยืนยันว่า endpoint ตอบกลับ ไม่ใช่หน้า 404 หรือ permission denied

เมื่อแก้ Apps Script ภายหลัง ต้องใช้ `Deploy` > `Manage deployments` > Edit > `New version` > Deploy การกด Save อย่างเดียวไม่เปลี่ยน Web App ที่ใช้งานจริง

## 5. ใส่ API URL ในเว็บไซต์

1. เปิด `index.html` ค้นหา `const CONFIG` แล้วแทน `YOUR_DEPLOYMENT_ID` ด้วย URL จากขั้นตอน 4 โดยคง `EDIT_PASSWORD: ''`
2. เปิด `admin.html` และแทน `CONFIG.API_URL` ด้วย URL เดียวกัน
3. ตรวจว่าไม่มี `YOUR_DEPLOYMENT_ID` เหลืออยู่ และไม่มี `API_TOKEN`, รหัสผ่าน หรือ password hash อยู่ใน HTML

## 6. ทดสอบก่อนเผยแพร่

1. เปิดเว็บไซต์ผ่าน local web server บนเดสก์ท็อปและมือถือ
2. ตรวจ Hero ว่าภาพฉากหลังจางแต่ยังเห็นบริบท ข้อความอ่านง่าย และรูปบุคคลหลักเด่นกว่า
3. เปิดหน้าอื่น ตรวจว่าปุ่ม `หน้าแรก` ยังอยู่และใช้ hover/active แบบเดียวกับเมนูอื่น
4. เปิด Inline Edit และ `admin.html` ตรวจว่าช่องชื่อผู้ใช้ว่าง
5. Login แล้วทดสอบเพิ่ม แก้ไข และลบรายการทดสอบหนึ่งรายการ
6. เพิ่ม Blog หนึ่งเรื่องและเพิ่ม `EvidenceImages` อย่างน้อยสองภาพโดยใช้ `BlogID` เดียวกัน ตรวจ Slider และภาพเต็ม
7. ตรวจใบประกาศในหน้าวิทยากร/R2R และ Snapshot ของผลงานดิจิทัล
8. ตรวจ console ของเบราว์เซอร์ว่าไม่มี error และทดสอบ Theme สว่าง มืด และไว้ทุกข์

### อัปเกรดฐานข้อมูลเดิมเป็น V4 (ไม่ล้างข้อมูล)

1. สำรอง Google Sheet ก่อนเสมอ แล้ววาง `SheetSetup.gs` เวอร์ชันใหม่ใน Apps Script
2. จาก Apps Script editor เลือกและรัน `migratePortfolioV4()` หนึ่งครั้ง อนุญาตสิทธิ์เมื่อระบบถาม
3. ฟังก์ชันจะเพิ่มหัวคอลัมน์ที่ขาดเท่านั้น และสร้าง `Career` หากยังไม่มี จึงไม่ลบหรือเขียนทับแถวเดิม
4. ค่า `Status` ว่างของ Publications และ Training เดิมจะกลายเป็น `published` เพื่อรักษาการแสดงผลเดิม
5. วาง `Code.gs` และ deploy **New version** จากนั้นทดสอบว่า `draft` ไม่แสดงผ่าน public API ทั้ง `list` และ `get` แต่ยังเห็นได้หลังเข้าสู่ Admin

การลบข้อมูลที่ยังถูกอ้างอิงจะถูกป้องกัน เช่น Blog ที่มี EvidenceImages, ผลงานที่ยังเชื่อม ExpertiseRelations หรือ References. ลบ/ย้ายความสัมพันธ์เหล่านั้นก่อนจึงจะลบรายการหลักได้.

## 7. เผยแพร่ GitHub Pages

1. สร้างหรือเปิด repository `eportfolio-kitti`
2. อัปโหลดไฟล์เว็บไซต์ทั้งหมดโดยรักษาชื่อ ตัวพิมพ์เล็ก/ใหญ่ และโครงสร้าง `assets/`
3. ไม่จำเป็นต้องเผยแพร่ `apps_script/` บน GitHub Pages
4. Commit ไปยัง branch `main`
5. เปิด `Settings` > `Pages` > Source: `Deploy from a branch` > Branch: `main` > Folder: `/ (root)` > Save
6. รอ workflow สำเร็จ แล้วเปิด `https://USERNAME.github.io/eportfolio-kitti/`
7. เปิด `https://USERNAME.github.io/eportfolio-kitti/admin.html` และทดสอบ Login/CRUD อีกครั้ง
8. กด `Ctrl+F5` หรือเปิดหน้าต่างไม่ระบุตัวตน เพื่อป้องกัน cache เก่าในการตรวจรอบสุดท้าย

## 8. ฝังใน Google Sites (ถ้าต้องการ)

1. ใน Google Sites เลือก `Insert` > `Embed` > `By URL`
2. วาง URL หน้าเว็บไซต์สาธารณะจาก GitHub Pages
3. ขยายกรอบเต็มความกว้างและสูงประมาณ 900–1,200 px
4. Publish และทดสอบทั้งมือถือ/เดสก์ท็อป
5. ไม่ฝัง `admin.html`; ให้ผู้ดูแลเปิด URL Admin โดยตรง

## 9. Checklist เปิดใช้งานจริง

- [ ] สำรอง Sheet และ ZIP เวอร์ชันก่อนหน้าแล้ว
- [ ] Sheet และ migrations ครบโดยไม่สูญเสียข้อมูลเดิม
- [ ] `API_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` อยู่ใน Script Properties เท่านั้น
- [ ] Apps Script deploy เป็น Web app / Execute as Me / Anyone
- [ ] `API_URL` ใน HTML สองไฟล์ตรงกับ deployment ปัจจุบัน
- [ ] ไม่มี placeholder, token, รหัสผ่าน หรือ hash ในไฟล์สาธารณะ
- [ ] Login, CRUD, Upload, Blog และ Evidence Slider ทำงาน
- [ ] หน้าแรก เมนู Hero ใบประกาศ และผลงานดิจิทัลผ่านการตรวจ
- [ ] GitHub Pages และ Google Sites (ถ้ามี) แสดงผลบนมือถือ/เดสก์ท็อป

## 10. Rollback

### เว็บไซต์มีปัญหา

1. อย่าลบ repository หรือข้อมูลใน Sheet
2. ใน GitHub เปิด commit เวอร์ชันที่ใช้งานได้ล่าสุด แล้ว revert commit ที่มีปัญหา หรืออัปโหลดไฟล์จาก ZIP สำรอง
3. รอ Pages deploy แล้วตรวจด้วยหน้าต่างไม่ระบุตัวตน

### API มีปัญหา

1. เปิด Apps Script > `Deploy` > `Manage deployments`
2. เลือก deployment เดิม แล้วเลือกเวอร์ชันโค้ดที่ใช้งานได้ล่าสุดและ Deploy
3. คง deployment เดิมเพื่อไม่ต้องเปลี่ยน `API_URL`

### Migration หรือข้อมูลมีปัญหา

1. หยุดการแก้ข้อมูลผ่าน Admin
2. ใช้ `File` > `Version history` ใน Google Sheets หรือสำเนาที่ทำไว้ก่อน migration เพื่อกู้คืน
3. ตรวจหัวคอลัมน์กับ `docs/02_sheet_structure.md` ก่อนเปิดระบบอีกครั้ง

## 11. แก้ปัญหาที่พบบ่อย

- ขึ้นข้อมูลตัวอย่าง: ตรวจ `CONFIG.API_URL`, สิทธิ์ `Anyone` และ Web App เวอร์ชันล่าสุด
- Login ไม่ผ่าน: ตรวจ `API_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`; ตั้งบัญชีใหม่ด้วย `setAdminCredentials_` และ deploy New version
- แก้ Apps Script แล้วผลไม่เปลี่ยน: Save ไม่พอ ต้อง deploy New version
- รูป/วิดีโอหายบน GitHub Pages: ตรวจชื่อไฟล์ ตัวพิมพ์เล็ก/ใหญ่ path และว่าไฟล์ถูก commit จริง
- หน้าเว็บยังเป็นเวอร์ชันเก่า: ใช้ `Ctrl+F5`, หน้าต่างไม่ระบุตัวตน หรือรอ Pages workflow ให้จบ
- Slider ไม่มีภาพ: ตรวจ `EvidenceImages.BlogID`, `Status=published`, File ID/URL และลำดับ `SortOrder`
- Google Sites มีพื้นที่ไม่พอ: เพิ่มความสูง Embed; ไม่ต้องสร้างหน้า Sites แยกสำหรับแต่ละหน้า SPA
