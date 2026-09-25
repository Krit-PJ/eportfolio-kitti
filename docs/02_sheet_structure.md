# PART 2 — Google Sheet Database Structure

สร้าง Google Spreadsheet 1 ไฟล์ ชื่อแนะนำ: `EPortfolio_Database`
ภายในมี 17 Sheet (แท็บ) ตามด้านล่าง — แถวที่ 1 ของทุก sheet คือ Header
(ชื่อคอลัมน์ภาษาอังกฤษ ใช้เป็น key คุยกับ Apps Script/JSON)

> ทุก Sheet มีคอลัมน์ร่วม 3 คอลัมน์เสมอ: `ID`, `CreatedAt`, `UpdatedAt`
> เพื่อให้ CRUD/sort/audit ทำงานสม่ำเสมอ — ระบุเฉพาะคอลัมน์ "เนื้อหา"
> เพิ่มเติมของแต่ละ Sheet ด้านล่าง

---

## 1. Profile
ข้อมูลตัวบุคคล/หน่วยงานคงที่ ใช้ 1 แถวเท่านั้น (singleton)

| คอลัมน์ | ประเภท | ตัวอย่าง |
|---|---|---|
| ID | text | profile-001 |
| NameEN | text | Dr. Kitti Phojuang |
| NameTH | text | ดร.กิตติ โพธิ์จวง |
| Position | text | นักวิชาการส่งเสริมการเกษตรชำนาญการพิเศษ |
| OrgLine1 | text | สำนักงานเกษตรจังหวัดกำแพงเพชร |
| OrgLine2 | text | กรมส่งเสริมการเกษตร |
| OrgLine3 | text | กระทรวงเกษตรและสหกรณ์ |
| ProfessionalIdentity | text (comma sep) | Agricultural Data Scientist,Agri-Tech Researcher,Digital Innovation Specialist |
| ProfileImageFileID | text (Drive ID) | 1AbC... |
| LogoFileID | text (Drive ID) | 1XyZ... |
| Phone | text | 08x-xxx-xxxx |
| Email | text | kitti@doae.go.th |
| Line | text | @kittiphojuang |
| GoogleScholarURL | url | |
| ResearchGateURL | url | |
| OrcidURL | url | |
| MapEmbedURL | url | |

## 2. Hero
ข้อความหน้าแรกส่วน Hero — 1 แถว (singleton) รองรับหลายภาษา/หลาย quote

| คอลัมน์ | ประเภท |
|---|---|
| TitleEN | text |
| TitleTH | text |
| Subtitle | text |
| TypingPhrases | text (คั่นด้วย `\|`) — ใช้ทำ Typing Animation |
| ReflectionText | long text |

## 3. DashboardStatistics
5 การ์ดสถิติหน้าแรก — 1 แถวต่อ 1 การ์ด (เพิ่ม/ลดได้)

| คอลัมน์ | ประเภท | ตัวอย่าง |
|---|---|---|
| Label | text | จำนวนผลงานวิจัยตีพิมพ์ |
| Value | number | 28 |
| Suffix | text | ชิ้น |
| Icon | text (FontAwesome class) | fa-solid fa-flask |
| SortOrder | number | 1 |

## 4. Education
3D Education Timeline

| คอลัมน์ | ประเภท |
|---|---|
| UniversityName | text |
| UniversityLogoFileID | text (Drive ID) |
| Degree | text |
| FieldOfStudy | text |
| YearStart | number |
| YearEnd | number |
| SortOrder | number |

## 5. Mindmap
Interactive Mindmap node ย่อย (node กลางเป็นค่าคงที่ในโค้ด/Profile)

| คอลัมน์ | ประเภท |
|---|---|
| NodeLabel | text |
| LinkTarget | text (page id เช่น `research`, `projects`) |
| Icon | text |
| Color | text (hex, optional override) |
| SortOrder | number |

> `Mindmap` คงไว้เพื่อรองรับข้อมูลจากระบบเวอร์ชันเดิม ระบบใหม่ใช้ `Expertise`,
> `ExpertiseRelations` และ `ExpertiseLinks` เป็นฐานข้อมูลหลักของเครือข่ายความเชี่ยวชาญ

## 6. Expertise
ทะเบียนกลางของสาขาความเชี่ยวชาญและทักษะย่อย ใช้ ID ถาวรแทนการเชื่อมด้วยชื่อ

| คอลัมน์ | ประเภท |
|---|---|
| Name | text |
| ParentID | text (อ้างถึง `Expertise.ID`; ว่างสำหรับกลุ่มหลัก) |
| Level | number (`2` กลุ่มหลัก, `3` ทักษะย่อย) |
| Category | text |
| Description | long text |
| Icon | text |
| Color | text (hex) |
| LinkTarget | text (page id) |
| SortOrder | number |
| Status | text (`published`/`draft`) |

## 7. ExpertiseRelations
ตารางกลางสำหรับเชื่อมความเชี่ยวชาญกับผลงานทุกประเภท

| คอลัมน์ | ประเภท |
|---|---|
| ExpertiseID | text (อ้างถึง `Expertise.ID`) |
| WorkType | text (`Dashboards`/`Research`/`Publications`/`Projects`/`Training`/`Blog`/`References`) |
| WorkID | text (อ้างถึง `ID` ใน Sheet ตาม `WorkType`) |
| Weight | number (1-5) |
| Note | long text |
| Status | text (`published`/`draft`) |

## 7.1 ExpertiseLinks
ตารางเชื่อมโหนดความรู้แบบ Knowledge Graph ซึ่งแยกจากความสัมพันธ์ระหว่างโหนดกับผลงาน

| คอลัมน์ | ประเภท |
|---|---|
| SourceExpertiseID | text (อ้างถึง `Expertise.ID`) |
| TargetExpertiseID | text (อ้างถึง `Expertise.ID`) |
| RelationType | text (`supports`/`applies`/`extends`/`evidence`/`related`) |
| Weight | number (1-5) |
| Note | long text |
| Status | text (`published`/`draft`) |

## 8. Dashboards
ผลงานดิจิทัล / Dashboard Portfolio (รองรับ 500+ รายการ)

| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Description | long text |
| CoverImageFileID | text (Drive ID) |
| EmbedURL | url (Looker Studio / Power BI embed link) |
| Category | text เช่น สถิติพืชเศรษฐกิจ, รู้ดินรู้ปุ๋ย, โรคและแมลง |
| Tags | text (คั่นด้วย `,`) |
| Featured | boolean (`true` เพื่อแสดงในส่วนผลงานเด่นหน้าแรก) |
| AccessNote | text |
| SortOrder | number |
| Status | text (`published`/`draft`) |

## 9. Research
ฐานข้อมูลงานวิจัย (รองรับค้นหา/กรอง)

| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Abstract | long text |
| Year | number |
| Field | text |
| Authors | text |
| FileURL | url (PDF บน Drive) |
| Tags | text |
| Status | text |

## 10. Publications
ผลงานตีพิมพ์ (รองรับ 1,000+ รายการ, filter/search/sort)

| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Type | text (`Journal`/`Conference`/`Patent`/`Petty Patent`) |
| Authors | text |
| Source | text (ชื่อวารสาร/งานประชุม) |
| Year | number |
| DOI_URL | url |
| Tags | text |

## 11. Projects
| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Description | long text |
| Category | text (`Smart Farming`/`Precision Agriculture`/`Agricultural Extension`/`R2R`) |
| YearStart | number |
| YearEnd | number |
| CoverImageFileID | text |
| Status | text |

## 12. Training
| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Type | text (`Training`/`Workshop`/`Mentoring`/`Coaching`) |
| Role | text (วิทยากร/ผู้เข้าร่วม/พี่เลี้ยง) |
| Date | date |
| Organizer | text |
| CertificateFileID | text |

## 13. Blog
| คอลัมน์ | ประเภท |
|---|---|
| Title | text |
| Slug | text |
| Excerpt | text |
| Content | long text (HTML/Markdown) |
| CoverImageFileID | text |
| Category | text |
| Tags | text |
| PublishDate | date |
| Status | text (`published`/`draft`) |

## 14. Gallery
คลังภาพ (รองรับ 10,000+ รูป — เก็บแค่ FileID)

| คอลัมน์ | ประเภท |
|---|---|
| ImageFileID | text (Drive ID) |
| Caption | text |
| Album | text (ชื่ออัลบั้ม/กิจกรรม) |
| EventDate | date |
| SortOrder | number |

## 15. Contact
ใช้ร่วมกับข้อมูลใน Profile — เก็บ social/ลิงก์เพิ่มเติมแบบ list ได้

| คอลัมน์ | ประเภท |
|---|---|
| Label | text |
| Value | text |
| Icon | text |
| LinkURL | url |
| SortOrder | number |

## 16. References
หลักฐานผลงานจากเว็บไซต์ ข่าว และสื่อสังคมออนไลน์ ใช้แสดง Timeline พร้อมการอ้างอิง

| คอลัมน์ | ประเภท |
|---|---|
| WorkType | text (ประเภทผลงานที่หลักฐานนี้สนับสนุน) |
| WorkID | text (รหัสผลงานที่หลักฐานนี้สนับสนุน) |
| Title | text |
| EventDate | date (`YYYY-MM-DD`) |
| Category | text |
| Role | text |
| Summary | long text |
| SourceName | text |
| SourceURL | url |
| Citation | long text |
| ImageURL | url |
| Status | text (`published`/`draft`) |
| SortOrder | number |

หน้า Admin แบบ Inline สามารถวาง URL เพื่ออ่าน Open Graph Metadata แนะนำหมวดหมู่
และสร้างข้อความอ้างอิงให้ตรวจสอบก่อนบันทึกได้ หากเว็บไซต์ต้นทางปิดกั้นการอ่าน
Metadata ระบบจะเปิดแบบฟอร์มให้กรอกหรือแก้ไขด้วยตนเองแทน

## 17. Settings
ค่า config ของระบบ (key-value)

| คอลัมน์ | ประเภท | ตัวอย่าง |
|---|---|---|
| Key | text | AdminEmails |
| Value | text | kitti@doae.go.th,admin2@doae.go.th |

ตัวอย่าง Key ที่ต้องมี: `AdminEmails`, `ApiToken` (สำหรับยืนยันสิทธิ์เขียนข้อมูล,
แนะนำเก็บจริงใน Script Properties ไม่ใช่ใน Sheet), `SiteTitle`, `DefaultTheme`,
`DriveFolder_Profile`, `DriveFolder_Dashboards`, `DriveFolder_Gallery`,
`DriveFolder_University`, `DriveFolder_Activities`

---

## หมายเหตุการสร้างจริง

ไม่ต้องสร้างมือทีละ Sheet — ใช้สคริปต์ `apps_script/SheetSetup.gs`
(ฟังก์ชัน `setupAllSheets()`) รันครั้งเดียวจาก Apps Script Editor
จะสร้าง 17 sheet พร้อม header แถวแรกให้ทันที (ดู PART 3/7)

สำหรับฐานข้อมูลเดิมที่มีข้อมูลอยู่แล้ว ให้รัน `migrateRelationalPortfolioSchema()`
แทน `setupAllSheets()` เพื่อเพิ่ม `Expertise`, `ExpertiseRelations` และคอลัมน์เชื่อมโยง
ใน `References` โดยไม่ล้างข้อมูลเดิม
