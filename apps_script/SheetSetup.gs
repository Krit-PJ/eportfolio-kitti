/**
 * SheetSetup.gs
 * รันฟังก์ชัน setupAllSheets() ครั้งเดียวจาก Apps Script Editor
 * เพื่อสร้าง Sheet พร้อม Header ใน Spreadsheet ที่ผูกกับสคริปต์นี้
 * (ดู PART 7 วิธีรัน)
 */

const SHEET_SCHEMA = {
  Profile: ['ID','NameEN','NameTH','Position','OrgLine1','OrgLine2','OrgLine3',
    'ProfessionalIdentity','ProfileImageFileID','LogoFileID','Phone','Email','Line',
    'GoogleScholarURL','ResearchGateURL','OrcidURL','MapEmbedURL','CreatedAt','UpdatedAt'],
  Hero: ['ID','TitleEN','TitleTH','Subtitle','TypingPhrases','ReflectionText','CreatedAt','UpdatedAt'],
  DashboardStatistics: ['ID','Label','Value','Suffix','Icon','LinkTarget','SortOrder','CreatedAt','UpdatedAt'],
  Education: ['ID','UniversityName','UniversityLogoFileID','Degree','FieldOfStudy','YearStart','YearEnd','SortOrder','CreatedAt','UpdatedAt'],
  Mindmap: ['ID','NodeLabel','LinkTarget','Icon','Color','SortOrder','CreatedAt','UpdatedAt'],
  Expertise: ['ID','Name','ParentID','Level','Category','Description','Icon','Color','LinkTarget','SortOrder','Status','CreatedAt','UpdatedAt'],
  ExpertiseRelations: ['ID','ExpertiseID','WorkType','WorkID','Weight','Note','Status','CreatedAt','UpdatedAt'],
  ExpertiseLinks: ['ID','SourceExpertiseID','TargetExpertiseID','RelationType','Weight','Note','Status','CreatedAt','UpdatedAt'],
  Dashboards: ['ID','Title','Description','CoverImageFileID','EmbedURL','Category','Tags','Featured','AccessNote','SortOrder','Status','CreatedAt','UpdatedAt'],
  Research: ['ID','Title','Abstract','Year','Field','Authors','FileURL','Tags','Status','CreatedAt','UpdatedAt'],
  Publications: ['ID','Title','Type','Authors','Source','Year','DOI_URL','Tags','CreatedAt','UpdatedAt'],
  Projects: ['ID','Title','Description','Category','YearStart','YearEnd','CoverImageFileID','Status','CreatedAt','UpdatedAt'],
  Training: ['ID','Title','Type','Role','Date','Organizer','CertificateFileID','SourceURL','CreatedAt','UpdatedAt'],
  Blog: ['ID','Title','Slug','Excerpt','Content','ContentType','SourceType','SourceURL','Author','CoverImageFileID','CoverImageURL','Category','Tags','PublishDate','ReadTime','Featured','Status','CreatedAt','UpdatedAt'],
  Gallery: ['ID','ImageFileID','ImageURL','Caption','Album','EventDate','SortOrder','CreatedAt','UpdatedAt'],
  Contact: ['ID','Label','Value','Icon','LinkURL','SortOrder','CreatedAt','UpdatedAt'],
  References: ['ID','WorkType','WorkID','Title','EventDate','Category','Role','Summary','SourceName','SourceURL','Citation','ImageURL','Status','SortOrder','CreatedAt','UpdatedAt'],
  Settings: ['ID','Key','Value','CreatedAt','UpdatedAt']
};

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_SCHEMA).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEET_SCHEMA[name];
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1B5E20').setFontColor('#FFFFFF');
  });

  // ลบ Sheet1 ตั้งต้นถ้ามีและไม่ได้ใช้
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

  // ใส่ค่าตั้งต้นใน Settings
  const settings = ss.getSheetByName('Settings');
  const now = new Date().toISOString();
  settings.getRange(2, 1, 5, 5).setValues([
    [Utilities.getUuid(), 'AdminEmails', Session.getActiveUser().getEmail(), now, now],
    [Utilities.getUuid(), 'SiteTitle', 'E-Portfolio | Dr. Kitti Phojuang', now, now],
    [Utilities.getUuid(), 'DefaultTheme', 'light', now, now],
    [Utilities.getUuid(), 'DriveRootFolderID', '', now, now],
    [Utilities.getUuid(), 'ApiTokenHint', 'ตั้งค่าจริงที่ Project Settings > Script Properties key: API_TOKEN', now, now]
  ]);

  SpreadsheetApp.getUi().alert('สร้างโครงสร้าง Sheet สำเร็จ! อย่าลืมตั้งค่า Script Properties: API_TOKEN, INLINE_EDIT_PASSWORD และสร้างโฟลเดอร์ Drive (ดู PART 7)');
}

/**
 * เพิ่ม Sheet References ให้ระบบเดิมโดยไม่ล้างข้อมูล Sheet อื่น
 * ใช้ฟังก์ชันนี้แทน setupAllSheets() เมื่อติดตั้งบนระบบที่มีข้อมูลอยู่แล้ว
 */
function migrateAddReferencesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('References');
  if (!sheet) sheet = ss.insertSheet('References');
  const headers = SHEET_SCHEMA.References;
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1B5E20').setFontColor('#FFFFFF');
  }
  SpreadsheetApp.getUi().alert('เพิ่ม Sheet References สำเร็จโดยไม่กระทบข้อมูลเดิม');
}

/**
 * อัปเกรดฐานข้อมูลเดิมเป็นโครงสร้างสัมพันธ์โดยไม่ล้างข้อมูล
 * - สร้าง Expertise และ ExpertiseRelations
 * - เติม WorkType/WorkID ใน References
 * รันได้ซ้ำอย่างปลอดภัย
 */
function migrateRelationalPortfolioSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Expertise','ExpertiseRelations','ExpertiseLinks','References','Dashboards','Training','Gallery'].forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    ensureSheetHeaders_(sheet, SHEET_SCHEMA[name]);
  });
  SpreadsheetApp.getUi().alert('อัปเกรดโครงสร้างสัมพันธ์สำเร็จโดยไม่กระทบข้อมูลเดิม');
}

/**
 * เพิ่มหน้าปลายทางให้การ์ดสถิติหน้าแรกโดยไม่ล้างข้อมูลเดิม
 * รันครั้งเดียวหลังอัปเดตเวอร์ชันนี้
 */
function migrateDashboardStatisticLinks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DashboardStatistics');
  if (!sheet) sheet = ss.insertSheet('DashboardStatistics');
  ensureSheetHeaders_(sheet, SHEET_SCHEMA.DashboardStatistics);
  SpreadsheetApp.getUi().alert('เพิ่ม LinkTarget ให้การ์ดสถิติเรียบร้อยแล้ว');
}

/**
 * เพิ่มคอลัมน์สำหรับศูนย์รวมเรื่องเล่าและองค์ความรู้โดยไม่ล้างบทความเดิม
 * รันครั้งเดียวเมื่อนำเวอร์ชันนี้ไปใช้กับ Google Sheet เดิม
 */
function migrateBlogKnowledgeHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Blog');
  if (!sheet) sheet = ss.insertSheet('Blog');
  ensureSheetHeaders_(sheet, SHEET_SCHEMA.Blog);
  SpreadsheetApp.getUi().alert('อัปเกรด Blog เป็นศูนย์รวมเรื่องเล่าและองค์ความรู้เรียบร้อยแล้ว');
}

function ensureSheetHeaders_(sheet, requiredHeaders) {
  const lastColumn = sheet.getLastColumn();
  const current = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String) : [];
  if (!current.length) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    const missing = requiredHeaders.filter(function (header) { return current.indexOf(header) === -1; });
    if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#1B5E20').setFontColor('#FFFFFF');
}

/**
 * สร้างโฟลเดอร์ Drive สำหรับเก็บสื่อแต่ละประเภท แล้วบันทึก Folder ID ไว้ใน Settings
 * รันครั้งเดียวหลัง setupAllSheets()
 */
function setupDriveFolders() {
  const root = DriveApp.createFolder('EPortfolio_Media');
  const sub = ['Profile', 'Dashboards', 'Gallery', 'University', 'Activities'].map(function (n) {
    return { name: n, folder: root.createFolder(n) };
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const now = new Date().toISOString();
  let row = settings.getLastRow() + 1;
  settings.getRange(row, 1, 1, 5).setValues([[Utilities.getUuid(), 'DriveRootFolderID', root.getId(), now, now]]);
  row++;
  sub.forEach(function (s) {
    settings.getRange(row, 1, 1, 5).setValues([[Utilities.getUuid(), 'DriveFolder_' + s.name, s.folder.getId(), now, now]]);
    row++;
  });

  SpreadsheetApp.getUi().alert('สร้างโฟลเดอร์ Drive สำเร็จ: ' + root.getUrl());
}
