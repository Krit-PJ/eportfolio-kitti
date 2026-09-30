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
  Publications: ['ID','Title','Type','Authors','Source','Year','DOI_URL','Tags','Status','CreatedAt','UpdatedAt'],
  Projects: ['ID','Title','Description','Category','YearStart','YearEnd','CoverImageFileID','IsInnovation','Problem','Hypothesis','Prototype','TestMethod','Results','NextStep','Role','Area','EvidenceURL','Status','CreatedAt','UpdatedAt'],
  Training: ['ID','Title','Type','Role','Date','Organizer','CertificateFileID','SourceURL','Status','CreatedAt','UpdatedAt'],
  Blog: ['ID','Title','Slug','Excerpt','Content','ContentType','SourceType','SourceURL','Author','CoverImageFileID','CoverImageURL','Category','Tags','PublishDate','ReadTime','Featured','Status','CreatedAt','UpdatedAt'],
  EvidenceImages: ['ID','BlogID','Header','Body','ImageFileID','ImageURL','Caption','SortOrder','Status','CreatedAt','UpdatedAt'],
  Career: ['ID','Title','Organization','StartDate','EndDate','EvidenceURL','Status','CreatedAt','UpdatedAt'],
  Gallery: ['ID','ImageFileID','ImageURL','Caption','Album','EventDate','SortOrder','CreatedAt','UpdatedAt'],
  Contact: ['ID','Label','Value','Icon','LinkURL','SortOrder','CreatedAt','UpdatedAt'],
  References: ['ID','WorkType','WorkID','Title','EventDate','Category','Role','Summary','SourceName','SourceURL','Citation','ImageURL','Status','SortOrder','CreatedAt','UpdatedAt'],
  Settings: ['ID','Key','Value','CreatedAt','UpdatedAt']
};

function setupAllSheets() {
  const ss = getPortfolioSpreadsheet_();
  Object.keys(SHEET_SCHEMA).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    ensureSheetHeaders_(sheet, SHEET_SCHEMA[name]);
  });

  // ลบแท็บตั้งต้นเฉพาะเมื่อว่างจริง ไม่แตะข้อมูลผู้ใช้
  ['Sheet1', 'ชีต1'].forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() === 0 && sheet.getLastColumn() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet);
    }
  });

  // เติมค่าที่ขาดเท่านั้น รันซ้ำแล้วไม่ทับค่าเดิม
  const settings = ss.getSheetByName('Settings');
  const defaults = {
    SiteTitle: 'E-Portfolio | Dr. Kitti Phojuang',
    DefaultTheme: 'light',
    DriveParentFolderID: PORTFOLIO_PARENT_FOLDER_ID,
    DriveRootFolderID: '',
    ApiTokenHint: 'ตั้งค่าจริงที่ Project Settings > Script Properties key: API_TOKEN'
  };
  Object.keys(defaults).forEach(function (key) {
    if (!getSetupSettingValue_(settings, key)) upsertSetting_(settings, key, defaults[key]);
  });

  notifyPortfolio_(ss, 'ตรวจและเติมโครงสร้าง Sheet สำเร็จโดยไม่ล้างข้อมูลเดิม');
}

/**
 * เพิ่ม Sheet References ให้ระบบเดิมโดยไม่ล้างข้อมูล Sheet อื่น
 * ใช้ฟังก์ชันนี้แทน setupAllSheets() เมื่อติดตั้งบนระบบที่มีข้อมูลอยู่แล้ว
 */
function migrateAddReferencesSheet() {
  const ss = getPortfolioSpreadsheet_();
  let sheet = ss.getSheetByName('References');
  if (!sheet) sheet = ss.insertSheet('References');
  const headers = SHEET_SCHEMA.References;
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1B5E20').setFontColor('#FFFFFF');
  }
  notifyPortfolio_(ss, 'เพิ่ม Sheet References สำเร็จโดยไม่กระทบข้อมูลเดิม');
}

/**
 * อัปเกรดฐานข้อมูลเดิมเป็นโครงสร้างสัมพันธ์โดยไม่ล้างข้อมูล
 * - สร้าง Expertise และ ExpertiseRelations
 * - เติม WorkType/WorkID ใน References
 * รันได้ซ้ำอย่างปลอดภัย
 */
function migrateRelationalPortfolioSchema() {
  const ss = getPortfolioSpreadsheet_();
  ['Expertise','ExpertiseRelations','ExpertiseLinks','References','Dashboards','Training','Gallery'].forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    ensureSheetHeaders_(sheet, SHEET_SCHEMA[name]);
  });
  notifyPortfolio_(ss, 'อัปเกรดโครงสร้างสัมพันธ์สำเร็จโดยไม่กระทบข้อมูลเดิม');
}

/**
 * เพิ่มหน้าปลายทางให้การ์ดสถิติหน้าแรกโดยไม่ล้างข้อมูลเดิม
 * รันครั้งเดียวหลังอัปเดตเวอร์ชันนี้
 */
function migrateDashboardStatisticLinks() {
  const ss = getPortfolioSpreadsheet_();
  let sheet = ss.getSheetByName('DashboardStatistics');
  if (!sheet) sheet = ss.insertSheet('DashboardStatistics');
  ensureSheetHeaders_(sheet, SHEET_SCHEMA.DashboardStatistics);
  notifyPortfolio_(ss, 'เพิ่ม LinkTarget ให้การ์ดสถิติเรียบร้อยแล้ว');
}

/**
 * เพิ่มคอลัมน์สำหรับศูนย์รวมเรื่องเล่าและองค์ความรู้โดยไม่ล้างบทความเดิม
 * รันครั้งเดียวเมื่อนำเวอร์ชันนี้ไปใช้กับ Google Sheet เดิม
 */
function migrateBlogKnowledgeHub() {
  const ss = getPortfolioSpreadsheet_();
  let sheet = ss.getSheetByName('Blog');
  if (!sheet) sheet = ss.insertSheet('Blog');
  ensureSheetHeaders_(sheet, SHEET_SCHEMA.Blog);
  notifyPortfolio_(ss, 'อัปเกรด Blog เป็นศูนย์รวมเรื่องเล่าและองค์ความรู้เรียบร้อยแล้ว');
}

/** เพิ่มภาพหลักฐานแบบสัมพันธ์กับ Blog โดยไม่แตะข้อมูลเดิม */
function migrateStoryEvidenceImages() {
  const ss = getPortfolioSpreadsheet_();
  let sheet = ss.getSheetByName('EvidenceImages');
  if (!sheet) sheet = ss.insertSheet('EvidenceImages');
  ensureSheetHeaders_(sheet, SHEET_SCHEMA.EvidenceImages);
  notifyPortfolio_(ss, 'เพิ่ม EvidenceImages สำหรับ “เรื่องเล่า ย้อนรอย” เรียบร้อยแล้ว');
}

/**
 * อัปเกรด V4 โดยไม่ล้างข้อมูล: เพิ่มฟิลด์โครงการ/ประสบการณ์ และสถานะเผยแพร่
 * รายการ Publications และ Training เดิมที่ไม่มีสถานะจะถูกกำหนดเป็น published เพื่อคงการแสดงผลเดิม
 */
function migratePortfolioV4() {
  const ss = getPortfolioSpreadsheet_();
  ['Publications','Projects','Training','Career','EvidenceImages','Blog'].forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    ensureSheetHeaders_(sheet, SHEET_SCHEMA[name]);
  });
  ['Publications','Training'].forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusColumn = headers.indexOf('Status') + 1;
    if (statusColumn && sheet.getLastRow() > 1) {
      const range = sheet.getRange(2, statusColumn, sheet.getLastRow() - 1, 1);
      const values = range.getValues().map(function (row) { return [String(row[0] || '').trim() || 'published']; });
      range.setValues(values);
    }
  });
  notifyPortfolio_(ss, 'อัปเกรด Portfolio V4 สำเร็จ: เพิ่มฟิลด์ใหม่โดยไม่ล้างข้อมูลเดิม');
}

function ensureSheetHeaders_(sheet, requiredHeaders) {
  const lastColumn = sheet.getLastColumn();
  // Keep the physical column position: a blank legacy header must not make us overwrite data to its right.
  const current = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  const currentNames = current.filter(String);
  if (!currentNames.length) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    const missing = requiredHeaders.filter(function (header) { return currentNames.indexOf(header) === -1; });
    if (missing.length) sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#1B5E20').setFontColor('#FFFFFF');
}

/**
 * สร้าง/กู้คืนโฟลเดอร์ Drive สำหรับเก็บสื่อแต่ละประเภท
 * รันซ้ำได้อย่างปลอดภัย: หนึ่งการรันจะสร้างไม่เกินหนึ่งโฟลเดอร์แล้วบันทึก ID ทันที
 * วิธีนี้หลีกเลี่ยงการค้นหาทั่ว Google Drive ซึ่งอาจเกินเวลาสูงสุดในบัญชีที่มีไฟล์จำนวนมาก
 */
function setupDriveFolders() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = getPortfolioSpreadsheet_();
    const settings = ss.getSheetByName('Settings');
    if (!settings) throw new Error('ไม่พบ Sheet "Settings" — ให้สร้างโครงสร้าง Sheet ก่อน');

    let root = tryGetDriveFolder_(getSetupSettingValue_(settings, 'DriveRootFolderID'));
    if (!root) {
      const parentId = getSetupSettingValue_(settings, 'DriveParentFolderID') || PORTFOLIO_PARENT_FOLDER_ID;
      const parent = DriveApp.getFolderById(parentId);
      root = parent.createFolder('EPortfolio_Media');
      upsertSetting_(settings, 'DriveRootFolderID', root.getId());
      SpreadsheetApp.flush();
      ss.toast('ขั้นที่ 1/6 สำเร็จ: EPortfolio_Media', 'E-Portfolio', 8);
      return '1/6';
    }

    const names = ['Profile', 'Dashboards', 'Gallery', 'University', 'Activities'];
    for (let i = 0; i < names.length; i++) {
      const key = 'DriveFolder_' + names[i];
      const savedFolder = tryGetDriveFolder_(getSetupSettingValue_(settings, key));
      if (savedFolder) continue;

      const folder = root.createFolder(names[i]);
      upsertSetting_(settings, key, folder.getId());
      SpreadsheetApp.flush();
      ss.toast('ขั้นที่ ' + (i + 2) + '/6 สำเร็จ: ' + names[i], 'E-Portfolio', 8);
      return (i + 2) + '/6';
    }

    ss.toast('ติดตั้งโฟลเดอร์ Drive ครบแล้ว', 'E-Portfolio', 8);
    return 'complete: ' + root.getUrl();
  } finally {
    lock.releaseLock();
  }
}

function tryGetDriveFolder_(id) {
  if (!id) return null;
  try {
    return DriveApp.getFolderById(String(id));
  } catch (error) {
    return null;
  }
}

function getSetupSettingValue_(settings, key) {
  const lastRow = settings.getLastRow();
  if (lastRow < 2) return '';
  const rows = settings.getRange(2, 1, lastRow - 1, 5).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === key) return String(rows[i][2] || '').trim();
  }
  return '';
}

function upsertSetting_(settings, key, value) {
  const now = new Date().toISOString();
  const lastRow = settings.getLastRow();
  if (lastRow >= 2) {
    const keys = settings.getRange(2, 2, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) {
        const createdAt = settings.getRange(i + 2, 4).getValue() || now;
        settings.getRange(i + 2, 3, 1, 3).setValues([[value, createdAt, now]]);
        return;
      }
    }
  }
  settings.getRange(lastRow + 1, 1, 1, 5).setValues([[Utilities.getUuid(), key, value, now, now]]);
}

function notifyPortfolio_(ss, message) {
  console.log(message);
  try {
    ss.toast(message, 'E-Portfolio', 8);
  } catch (error) {
    // Console output is sufficient when no spreadsheet UI is attached.
  }
  return message;
}
