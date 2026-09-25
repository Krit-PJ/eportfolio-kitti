# คู่มือติดตั้ง E-Portfolio ฉบับพร้อมใช้งาน

เอกสารนี้ครอบคลุมการเผยแพร่เว็บไซต์ด้วย GitHub Pages การสร้างฐานข้อมูล Google Sheets การติดตั้ง Google Apps Script API การตั้งค่า Google Login และการฝังเว็บไซต์ใน Google Sites

## 1. โครงสร้างระบบ

ระบบแบ่งเป็น 3 ส่วน

1. `index.html` คือเว็บไซต์สาธารณะ
2. `admin.html` คือระบบจัดการข้อมูลสำหรับผู้ดูแล
3. `apps_script/` คือ Backend API ที่อ่านและเขียนข้อมูลใน Google Sheets

ไฟล์สื่อที่เว็บไซต์ใช้งานอยู่ใน `assets/` รวมถึงวิดีโอเรื่องเล่าและภาพปกวิดีโอ

## 2. ไฟล์ที่ต้องเผยแพร่บน GitHub Pages

อัปโหลดไฟล์และโฟลเดอร์ต่อไปนี้ โดยรักษาชื่อและโครงสร้างเดิม

```text
index.html
admin.html
3. Kitti.png
LOGO-DOAE.png
assets/
  field-impact-story.mp4
  field-impact-story-poster.jpg
```

ไม่ต้องอัปโหลดไฟล์ CV ไฟล์สำรอง รูปต้นฉบับ หรือโฟลเดอร์ `apps_script/` ไปยัง GitHub Pages โฟลเดอร์ `apps_script/` ใช้คัดลอกเข้า Google Apps Script เท่านั้น

## 3. สร้าง Google Sheets สำหรับฐานข้อมูล

### 3.1 การติดตั้งใหม่

1. เปิด [Google Sheets](https://sheets.google.com) แล้วสร้าง Spreadsheet ใหม่
2. ตั้งชื่อไฟล์ เช่น `EPortfolio_Database`
3. เลือกเมนู `ส่วนขยาย` > `Apps Script`
4. ใน Apps Script สร้างไฟล์ Script จำนวน 2 ไฟล์
   - `SheetSetup.gs`
   - `Code.gs`
5. คัดลอกโค้ดจาก `apps_script/SheetSetup.gs` ไปวางในไฟล์ `SheetSetup.gs`
6. คัดลอกโค้ดจาก `apps_script/Code.gs` ไปวางในไฟล์ `Code.gs`
7. กด Save
8. เลือกฟังก์ชัน `setupAllSheets` แล้วกด Run
9. อนุญาตสิทธิ์ให้สคริปต์ด้วยบัญชีเจ้าของระบบ
10. เลือกฟังก์ชัน `setupDriveFolders` แล้วกด Run เพียงครั้งเดียว

คำเตือน: `setupAllSheets()` จะล้างข้อมูลเดิม ใช้เฉพาะ Spreadsheet ใหม่เท่านั้น

### 3.2 การอัปเกรดฐานข้อมูลเดิม

ห้ามรัน `setupAllSheets()` ให้แทนที่โค้ด Apps Script ด้วยเวอร์ชันล่าสุด แล้วรันตามลำดับ

1. `migrateRelationalPortfolioSchema()`
2. `migrateDashboardStatisticLinks()`
3. `migrateBlogKnowledgeHub()`

ทั้งสามฟังก์ชันเพิ่ม Sheet หรือคอลัมน์ที่ขาดโดยไม่ล้างข้อมูลเดิม ฟังก์ชันลำดับที่ 3 เพิ่มข้อมูลประเภทเนื้อหา แหล่งที่มา URL ต้นฉบับ ผู้เขียน รูปปก เวลาอ่าน และสถานะบทความเด่นให้ Sheet `Blog`

## 4. ตั้งค่า Script Properties

ใน Apps Script เปิด `Project Settings` > `Script Properties` แล้วเพิ่มค่าเหล่านี้

| Property | ค่า |
|---|---|
| `API_TOKEN` | Token แบบสุ่มและคาดเดายาก อย่างน้อย 32 ตัวอักษร |
| `INLINE_EDIT_PASSWORD` | รหัสผ่านสำหรับปุ่มแก้ไขข้อมูลบนหน้าเว็บไซต์ |
| `GOOGLE_CLIENT_ID` | OAuth Client ID เดียวกับที่ใส่ใน `admin.html` |

ห้ามเขียน `API_TOKEN` หรือ `INLINE_EDIT_PASSWORD` ลงใน `index.html`, `admin.html` หรือ GitHub

สร้าง Token บน PowerShell ได้ด้วยคำสั่ง

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 5. กำหนดอีเมลผู้ดูแล

1. กลับไปที่ Spreadsheet
2. เปิด Sheet ชื่อ `Settings`
3. ค้นหาแถวที่ `Key` เท่ากับ `AdminEmails`
4. ใส่อีเมล Google Account ของผู้ดูแลในคอลัมน์ `Value`
5. หากมีหลายบัญชี ให้คั่นด้วยเครื่องหมายจุลภาค

ตัวอย่าง

```text
admin1@gmail.com,admin2@doae.go.th
```

## 6. Deploy Google Apps Script เป็น API

1. ใน Apps Script เลือก `Deploy` > `New deployment`
2. เลือกประเภท `Web app`
3. ตั้ง Description เช่น `E-Portfolio API v1`
4. Execute as เลือก `Me`
5. Who has access เลือก `Anyone`
6. กด Deploy และอนุญาตสิทธิ์
7. คัดลอก Web app URL ซึ่งมีรูปแบบดังนี้

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

เมื่อแก้ `Code.gs` ในอนาคต ให้เลือก `Deploy` > `Manage deployments` > Edit > `New version` > Deploy เพื่อคง URL เดิม

## 7. สร้าง Google OAuth Client ID

1. เปิด [Google Cloud Console](https://console.cloud.google.com/)
2. เลือกหรือสร้าง Project ที่ใช้กับระบบ
3. เปิด `APIs & Services` > `OAuth consent screen`
4. กรอกชื่อแอป อีเมลสนับสนุน และข้อมูลที่ Google กำหนด
5. เปิด `Credentials` > `Create credentials` > `OAuth client ID`
6. Application type เลือก `Web application`
7. เพิ่ม Authorized JavaScript origins ดังนี้

```text
https://GITHUB_USERNAME.github.io
http://127.0.0.1:8765
```

Origin ต้องไม่มี path ต่อท้าย สำหรับ GitHub Pages ให้ใส่เฉพาะโดเมน `github.io`

8. คัดลอก Client ID รูปแบบ `xxxxx.apps.googleusercontent.com`
9. นำ Client ID เดียวกันไปใส่ใน Script Property `GOOGLE_CLIENT_ID`

## 8. ตั้งค่าเว็บไซต์ก่อนอัปโหลด

### 8.1 แก้ `index.html`

ค้นหา `const CONFIG` แล้วแทนที่ `API_URL`

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  EDIT_PASSWORD: ''
};
```

Production ต้องให้ `EDIT_PASSWORD` เป็นค่าว่างเสมอ รหัสจริงอยู่ใน Script Property `INLINE_EDIT_PASSWORD`

### 8.2 แก้ `admin.html`

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  GOOGLE_CLIENT_ID: 'xxxxx.apps.googleusercontent.com'
};
```

## 9. เผยแพร่ด้วย GitHub Pages ผ่านหน้าเว็บ

1. Login [GitHub](https://github.com)
2. กด `New repository`
3. ตั้งชื่อ เช่น `eportfolio-kitti`
4. เลือก Public แล้วสร้าง Repository
5. เลือก `Add file` > `Upload files`
6. อัปโหลดไฟล์ตามรายการในหัวข้อ 2 โดยรักษาโฟลเดอร์ `assets`
7. Commit ไปที่ branch `main`
8. เปิด `Settings` > `Pages`
9. Source เลือก `Deploy from a branch`
10. Branch เลือก `main` และ Folder เลือก `/ (root)`
11. กด Save แล้วรอประมาณ 1 ถึง 5 นาที

เว็บไซต์จะอยู่ที่

```text
https://GITHUB_USERNAME.github.io/eportfolio-kitti/
```

ระบบ Admin จะอยู่ที่

```text
https://GITHUB_USERNAME.github.io/eportfolio-kitti/admin.html
```

โค้ดหน้า Admin สามารถอยู่ใน Repository สาธารณะได้ เพราะสิทธิ์เขียนข้อมูลตรวจซ้ำที่ Apps Script ด้วย Google Login, รายชื่อ AdminEmails, OAuth Client ID และ API Token อย่างไรก็ตามห้ามใส่รหัสผ่านหรือ Token ลงในไฟล์ HTML

## 10. เผยแพร่ด้วย Git command

ใช้วิธีนี้เมื่อเครื่องติดตั้ง Git แล้ว

```bash
git init
git add index.html admin.html "3. Kitti.png" LOGO-DOAE.png assets
git commit -m "Publish E-Portfolio"
git branch -M main
git remote add origin https://github.com/GITHUB_USERNAME/eportfolio-kitti.git
git push -u origin main
```

จากนั้นเปิด GitHub Settings > Pages และเลือก branch `main` ตามหัวข้อ 9

## 11. ฝังลง Google Sites

1. เปิด Google Sites ที่ต้องการ
2. เลือก `Insert` > `Embed`
3. เลือก `By URL`
4. วาง URL ของ GitHub Pages
5. กด Insert
6. ขยายกรอบ Embed ให้เต็มความกว้าง
7. กำหนดความสูงอย่างน้อย 900 ถึง 1,200 พิกเซล
8. กด Publish

ไม่ควรฝัง `admin.html` ใน Google Sites ให้ผู้ดูแลเปิด URL ของ Admin โดยตรง

## 12. การใช้งานระบบ Admin

1. เปิด URL `admin.html`
2. Login ด้วย Google Account ที่อยู่ใน `Settings.AdminEmails`
3. เลือกหมวดข้อมูลจาก Sidebar
4. ใช้ `เพิ่มข้อมูล` สำหรับเพิ่มรายการทีละรายการ
5. ใช้ `Template` และ `Import CSV` สำหรับข้อมูลจำนวนมาก
6. ใช้ `นำเข้า Facebook / URL` เพื่ออ่าน Metadata จากเว็บภายนอก
7. ตรวจชื่อเรื่อง วันที่ รูปภาพ หมวดหมู่ และข้อความอ้างอิงก่อนบันทึก

### การเผยแพร่เรื่องเล่าและองค์ความรู้

**เขียนเอง:** เลือกเมนู `เรื่องเล่า / องค์ความรู้` > `เพิ่มข้อมูล` กรอกหัวข้อ สรุป เนื้อหา ประเภทเนื้อหา เลือกแหล่งที่มาเป็น `เขียนเอง` ใส่ผู้เขียน วันที่เผยแพร่ เวลาอ่าน และเลือก `published`

**นำเข้าจากข่าว เว็บไซต์ หรือ Facebook:** เปิด `นำเข้า Facebook / URL` วางลิงก์ เลือกปลายทางเป็น `Blog` ตรวจ Metadata แล้วกดนำเข้า ระบบจะเก็บ URL และภาพจากต้นฉบับไว้ในรายการ Blog ผู้ดูแลควรเปิดแก้ไขรายการอีกครั้งเพื่อเรียบเรียงเนื้อหา กำหนดประเภท และตรวจสิทธิ์การใช้ภาพก่อนเผยแพร่

ตั้ง `Featured` เป็น `true` ได้ครั้งละหนึ่งบทความเพื่อแสดงเป็นเรื่องเด่น หากตั้งหลายรายการ ระบบจะแสดงรายการล่าสุดตามวันที่เผยแพร่ก่อน

Facebook อนุญาตให้ดึง Metadata ได้เฉพาะโพสต์สาธารณะ หากโพสต์ต้อง Login หรือจำกัดผู้ชม ระบบจะแจ้งให้ผู้ดูแลกรอกข้อมูลที่ขาดเอง

## 13. การเชื่อมโยงข้อมูล

- `DashboardStatistics.LinkTarget` กำหนดหน้าที่เปิดเมื่อกดการ์ดสถิติ
- `Expertise.ParentID` กำหนดลำดับชั้นความเชี่ยวชาญ
- `ExpertiseRelations` เชื่อมความเชี่ยวชาญกับผลงาน
- `ExpertiseLinks` เชื่อมโหนดความเชี่ยวชาญเข้าหากัน
- `References.WorkType` และ `References.WorkID` เชื่อมหลักฐานกับผลงานต้นทาง

ค่า LinkTarget ที่ใช้ได้คือ `about`, `dashboards`, `innovation`, `research`, `publications`, `projects`, `training`, `blog`, `gallery` และ `contact`

## 14. การอัปเดตระบบ

### อัปเดตหน้าเว็บไซต์

1. แก้ไฟล์ในเครื่อง
2. อัปโหลดทับหรือ `git push`
3. รอ GitHub Pages Deploy
4. เปิดเว็บไซต์แล้วกด `Ctrl + F5`

### อัปเดต Backend

1. แก้ไฟล์ใน Apps Script
2. Save
3. Deploy > Manage deployments
4. เลือก Deployment เดิม
5. เลือก New version แล้ว Deploy

## 15. Checklist ก่อนเปิดใช้งาน

- [ ] ตั้งค่า `API_TOKEN`, `INLINE_EDIT_PASSWORD` และ `GOOGLE_CLIENT_ID`
- [ ] `Settings.AdminEmails` ถูกต้อง
- [ ] Apps Script Web App ใช้ Execute as Me และ Anyone
- [ ] `API_URL` ใน HTML ทั้งสองไฟล์ตรงกับ Deployment ล่าสุด
- [ ] OAuth Authorized JavaScript origins มี GitHub Pages origin
- [ ] Login Admin สำเร็จ
- [ ] เพิ่ม แก้ไข และลบข้อมูลได้
- [ ] Import URL และ Facebook สาธารณะได้
- [ ] รูปภาพและวิดีโอแสดงผลบน GitHub Pages
- [ ] ปุ่ม `ก+`, `ก++`, `ก+++` ทำงานและจดจำค่า
- [ ] Theme สว่าง มืด และไว้ทุกข์ทำงาน
- [ ] ทดสอบบนมือถือและเดสก์ท็อป
- [ ] Google Sites Embed แสดงเต็มความกว้าง

## 16. การแก้ปัญหาที่พบบ่อย

### หน้าเว็บแสดงข้อมูลตัวอย่างแทน Google Sheets

ตรวจว่า `CONFIG.API_URL` ไม่มี `YOUR_DEPLOYMENT_ID` และเปิด URL Apps Script ในเบราว์เซอร์ได้

### Login Admin ไม่สำเร็จ

ตรวจ 4 จุด ได้แก่ OAuth origin, Client ID ใน `admin.html`, Script Property `GOOGLE_CLIENT_ID` และอีเมลใน `Settings.AdminEmails`

### แก้ Code.gs แล้วเว็บไซต์ยังใช้โค้ดเก่า

Apps Script ต้องสร้าง New version ใน Manage deployments ทุกครั้ง การ Save อย่างเดียวไม่อัปเดต Web App

### GitHub Pages ไม่พบวิดีโอหรือรูปภาพ

ตรวจตัวพิมพ์เล็กและใหญ่ของชื่อไฟล์ รวมถึงต้องมีโฟลเดอร์ `assets` บน GitHub

### Google Sites แสดงพื้นที่ไม่พอ

เลือกกรอบ Embed แล้วลากเพิ่มความสูง เนื่องจากเว็บไซต์นี้เป็น Single Page Application ที่เปลี่ยนหน้าอยู่ภายใน iframe เดิม
