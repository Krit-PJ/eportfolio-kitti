/**
 * Code.gs — REST API ของระบบ E-Portfolio
 * Deploy เป็น Web App (Execute as: Me, Who has access: Anyone)
 * ดูขั้นตอน deploy ที่ docs/07_deployment_manual.md
 *
 * Endpoint (GET):
 *   ?sheet=Research&action=list&page=1&limit=20&q=คำค้น&category=...
 *   ?sheet=Research&action=get&id=xxx
 *
 * Endpoint (POST) — body เป็น JSON, ต้องมี token ตรงกับ Script Property API_TOKEN:
 *   {action:"create", sheet:"Research", token:"...", data:{...}}
 *   {action:"update", sheet:"Research", token:"...", id:"...", data:{...}}
 *   {action:"delete", sheet:"Research", token:"...", id:"..."}
 *   {action:"uploadFile", token:"...", folderKey:"Gallery", filename:"a.jpg", mimeType:"image/jpeg", base64:"..."}
 *   {action:"previewUrl", token:"...", url:"https://example.com/article"}
 */

const LIST_SHEETS = ['Profile','Hero','DashboardStatistics','Education','Mindmap','Expertise','ExpertiseRelations','ExpertiseLinks',
  'Dashboards','Research','Publications','Projects','Training','Blog','Gallery','EvidenceImages',
  'Career','Contact','References','Settings'];

function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'list';
    const sheetName = params.sheet;
    if (!LIST_SHEETS.includes(sheetName)) return jsonOutput({ status: 'error', message: 'Unknown sheet: ' + sheetName });
    if (sheetName === 'Settings' && !checkToken(params.token)) return jsonOutput({ status:'error', message:'Unauthorized' });
    const sheet = getSheet(sheetName);

    if (action === 'get') {
      const row = findRowById(sheet, params.id);
      if (!row) return jsonOutput({ status: 'error', message: 'Not found' });
      if (isDraftRow_(row)) return jsonOutput({ status: 'error', message: 'Not found' });
      return jsonOutput({ status: 'ok', data: row });
    }

    // action === 'list'
    let rows = sheetToObjects(sheet);
    // Public endpoint never returns a draft, while legacy blank Status remains public.
    rows = rows.filter(function (row) { return !isDraftRow_(row); });

    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter(function (r) {
        return Object.values(r).some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; });
      });
    }
    if (params.category) rows = rows.filter(function (r) { return r.Category === params.category; });
    if (params.album) rows = rows.filter(function (r) { return r.Album === params.album; });
    if (params.type) rows = rows.filter(function (r) { return r.Type === params.type; });
    if (params.status) rows = rows.filter(function (r) { return r.Status === params.status; });

    if (rows[0] && 'SortOrder' in rows[0]) {
      rows.sort(function (a, b) { return (Number(a.SortOrder) || 0) - (Number(b.SortOrder) || 0); });
    }

    const total = rows.length;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Number(params.limit) || 50);
    const start = (page - 1) * limit;
    const pageRows = rows.slice(start, start + limit);

    return jsonOutput({ status: 'ok', total: total, page: page, limit: limit, data: pageRows });
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'uploadFile') {
      return jsonOutput(handleUploadFile(body));
    }

    if (action === 'verifyAdminCredentials') {
      return jsonOutput(handleVerifyAdminCredentials(body.username, body.password));
    }

    if (!checkToken(body.token)) return jsonOutput({ status: 'error', message: 'Unauthorized' });

    if (action === 'previewUrl') {
      return jsonOutput(handleUrlPreview(body.url));
    }

    if (action === 'adminList') {
      if (!LIST_SHEETS.includes(body.sheet)) return jsonOutput({ status:'error', message:'Unknown sheet: ' + body.sheet });
      return jsonOutput(handleAdminList(body.sheet, body));
    }

    const sheetName = body.sheet;
    if (!LIST_SHEETS.includes(sheetName)) return jsonOutput({ status: 'error', message: 'Unknown sheet: ' + sheetName });
    const sheet = getSheet(sheetName);

    if (action === 'create' || action === 'update') {
      // Updates may contain only changed fields; validate the resulting record, not an incomplete patch.
      const existing = action === 'update' ? findRowById(sheet, body.id) : null;
      if (action === 'update' && !existing) return jsonOutput({ status:'error', message:'Not found' });
      const candidate = Object.assign({}, existing || {}, body.data || {});
      const validationError = validateRelationalWrite(sheetName, candidate, body.id || '');
      if (validationError) return jsonOutput({ status:'error', message:validationError });
    }
    if (action === 'delete') {
      const deleteError = validateRelationalDelete(sheetName, body.id);
      if (deleteError) return jsonOutput({ status:'error', message:deleteError });
    }

    if (action === 'create') return jsonOutput(handleCreate(sheet, body.data));
    if (action === 'update') return jsonOutput(handleUpdate(sheet, body.id, body.data));
    if (action === 'delete') return jsonOutput(handleDelete(sheet, body.id));

    return jsonOutput({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

/* ---------- CRUD helpers ---------- */

function handleCreate(sheet, data) {
  const headers = getHeaders(sheet);
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  const row = headers.map(function (h) {
    if (h === 'ID') return id;
    if (h === 'CreatedAt' || h === 'UpdatedAt') return now;
    return data[h] !== undefined ? data[h] : '';
  });
  sheet.appendRow(row);
  return { status: 'ok', id: id };
}

function handleUpdate(sheet, id, data) {
  const headers = getHeaders(sheet);
  const rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) return { status: 'error', message: 'Not found' };
  const now = new Date().toISOString();
  headers.forEach(function (h, colIndex) {
    if (h === 'ID' || h === 'CreatedAt') return;
    if (h === 'UpdatedAt') { sheet.getRange(rowIndex, colIndex + 1).setValue(now); return; }
    if (data[h] !== undefined) sheet.getRange(rowIndex, colIndex + 1).setValue(data[h]);
  });
  return { status: 'ok', id: id };
}

function handleDelete(sheet, id) {
  const rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) return { status: 'error', message: 'Not found' };
  sheet.deleteRow(rowIndex);
  return { status: 'ok' };
}

function handleAdminList(sheetName, params) {
  let rows = sheetToObjects(getSheet(sheetName));
  if (params.q) {
    const q = String(params.q).toLowerCase();
    rows = rows.filter(function (row) {
      return Object.values(row).some(function (value) { return String(value).toLowerCase().indexOf(q) !== -1; });
    });
  }
  if (rows[0] && 'SortOrder' in rows[0]) rows.sort(function (a,b) { return (Number(a.SortOrder)||0)-(Number(b.SortOrder)||0); });
  const total = rows.length;
  const page = Math.max(1,Number(params.page)||1);
  const limit = Math.min(500,Number(params.limit)||50);
  return { status:'ok', total:total, page:page, limit:limit, data:rows.slice((page-1)*limit,page*limit) };
}

function handleUploadFile(body) {
  if (!checkToken(body.token)) return { status: 'error', message: 'Unauthorized' };
  const folderId = getDriveFolderId(body.folderKey);
  const folder = DriveApp.getFolderById(folderId);
  const blob = Utilities.newBlob(Utilities.base64Decode(body.base64), body.mimeType, body.filename);
  const file = folder.createFile(blob);
  return { status: 'ok', fileId: file.getId(), url: 'https://drive.google.com/uc?export=view&id=' + file.getId() };
}

function secureEquals_(left, right) {
  left = String(left || ''); right = String(right || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function isDraftRow_(row) {
  return Object.prototype.hasOwnProperty.call(row, 'Status') && String(row.Status || '').toLowerCase() === 'draft';
}

/** ADMIN_USERNAME/ADMIN_PASSWORD_HASH อยู่ใน Script Properties เท่านั้น */
function handleVerifyAdminCredentials(username, password) {
  const properties = PropertiesService.getScriptProperties();
  const expectedUser = properties.getProperty('ADMIN_USERNAME');
  const expectedHash = properties.getProperty('ADMIN_PASSWORD_HASH');
  if (!expectedUser || !expectedHash) return { status:'error', message:'ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลใน Script Properties' };
  const normalizedUser = String(username || '').trim();
  const cache = CacheService.getScriptCache();
  const keyDigest = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalizedUser || 'anonymous', Utilities.Charset.UTF_8)).slice(0, 36);
  const attemptKey = 'admin_auth_' + keyDigest;
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const now = Date.now();
    let attempts;
    try { attempts = JSON.parse(cache.get(attemptKey) || '{}'); } catch (error) { attempts = {}; }
    const failed = Number(attempts.failed || 0);
    const lockedUntil = Number(attempts.lockedUntil || 0);
    if (lockedUntil > now) return { status:'error', message:'บัญชีถูกพักชั่วคราว กรุณาลองใหม่ภายหลัง' };

    const actualHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password || ''), Utilities.Charset.UTF_8));
    const valid = secureEquals_(normalizedUser, expectedUser) && secureEquals_(actualHash, expectedHash);
    if (!valid) {
      const nextFailed = failed + 1;
      const nextState = nextFailed >= 5 ? { failed:nextFailed, lockedUntil:now + 10 * 60 * 1000 } : { failed:nextFailed, lockedUntil:0 };
      cache.put(attemptKey, JSON.stringify(nextState), nextFailed >= 5 ? 600 : 300);
      Utilities.sleep(350);
      return { status:'error', message:nextFailed >= 5 ? 'บัญชีถูกพักชั่วคราว กรุณาลองใหม่ภายหลัง' : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    cache.remove(attemptKey);
    const token = properties.getProperty('API_TOKEN');
    if (!token) return { status:'error', message:'ยังไม่ได้ตั้งค่า API_TOKEN' };
    return { status:'ok', username:expectedUser, token:token };
  } finally {
    lock.releaseLock();
  }
}

/** รันจาก Apps Script editor แล้วเปลี่ยนค่าตัวอย่างก่อนรัน; ไม่ commit รหัสจริงลง repository */
function setAdminCredentialsExample() {
  throw new Error('คัดลอกฟังก์ชันนี้ไปแก้ใน Apps Script editor และใช้ setAdminCredentials_(username, password) แทนการฝังรหัสในไฟล์');
}

function setAdminCredentials_(username, password) {
  if (!username || !password || String(password).length < 8) throw new Error('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password), Utilities.Charset.UTF_8));
  PropertiesService.getScriptProperties().setProperties({ ADMIN_USERNAME:String(username), ADMIN_PASSWORD_HASH:hash });
}

/* ---------- Referential integrity ---------- */

const RELATION_WORK_TYPES = ['Dashboards','Research','Publications','Projects','Training','Blog','References'];

function validateRelationalWrite(sheetName, data, currentId) {
  const titleSheets = ['Dashboards','Research','Publications','Projects','Training','Blog','Career','References'];
  if (titleSheets.indexOf(sheetName) !== -1 && !String(data.Title || '').trim()) return 'กรุณาระบุชื่อเรื่อง/ชื่อรายการ';
  if (sheetName === 'Career') {
    if (!String(data.Organization || '').trim()) return 'กรุณาระบุหน่วยงาน';
    if (!String(data.StartDate || '').trim()) return 'กรุณาระบุวันเริ่มงาน';
  }
  if (sheetName === 'Projects' && String(data.IsInnovation || '') === 'true') {
    const innovationFields = ['Problem','Hypothesis','Prototype','TestMethod','Results','NextStep'];
    const missing = innovationFields.filter(function (key) { return !String(data[key] || '').trim(); });
    if (missing.length) return 'โครงการนวัตกรรมต้องระบุ: ' + missing.join(', ');
  }
  if (sheetName === 'Expertise') {
    if (!String(data.Name || '').trim()) return 'กรุณาระบุชื่อความเชี่ยวชาญ';
    if (data.ParentID) {
      if (String(data.ParentID) === String(currentId)) return 'ไม่สามารถกำหนดตัวเองเป็น Parent ได้';
      if (!sheetHasId_('Expertise', data.ParentID)) return 'ไม่พบ ParentID ในทะเบียนความเชี่ยวชาญ';
      if (currentId && createsExpertiseCycle_(currentId, data.ParentID)) return 'ความสัมพันธ์ Parent ทำให้เกิดวงจรข้อมูล';
    }
  }

  if (sheetName === 'ExpertiseRelations') {
    if (!sheetHasId_('Expertise', data.ExpertiseID)) return 'ไม่พบ ExpertiseID ในทะเบียนความเชี่ยวชาญ';
    const workError = validateWorkReference_(data.WorkType, data.WorkID, true);
    if (workError) return workError;
    const duplicate = sheetToObjects(getSheet('ExpertiseRelations')).some(function (row) {
      return String(row.ID) !== String(currentId) && String(row.ExpertiseID) === String(data.ExpertiseID) &&
        String(row.WorkType) === String(data.WorkType) && String(row.WorkID) === String(data.WorkID);
    });
    if (duplicate) return 'ความสัมพันธ์นี้มีอยู่แล้ว';
  }

  if (sheetName === 'ExpertiseLinks') {
    const sourceId = String(data.SourceExpertiseID || '');
    const targetId = String(data.TargetExpertiseID || '');
    if (!sheetHasId_('Expertise', sourceId) || !sheetHasId_('Expertise', targetId)) return 'ไม่พบโหนดความเชี่ยวชาญที่ต้องการเชื่อมโยง';
    if (sourceId === targetId) return 'ไม่สามารถเชื่อมโยงโหนดเข้าหาตัวเองได้';
    const weight = Number(data.Weight || 1);
    if (weight < 1 || weight > 5) return 'น้ำหนักความสัมพันธ์ต้องอยู่ระหว่าง 1 ถึง 5';
    const duplicate = sheetToObjects(getSheet('ExpertiseLinks')).some(function (row) {
      const sameDirection = String(row.SourceExpertiseID) === sourceId && String(row.TargetExpertiseID) === targetId;
      const reverseDirection = String(row.SourceExpertiseID) === targetId && String(row.TargetExpertiseID) === sourceId;
      return String(row.ID) !== String(currentId) && (sameDirection || reverseDirection);
    });
    if (duplicate) return 'ลิงก์ระหว่างโหนดคู่นี้มีอยู่แล้ว';
  }

  if (sheetName === 'References' && (data.WorkType || data.WorkID)) {
    const workError = validateWorkReference_(data.WorkType, data.WorkID, false);
    if (workError) return workError;
  }
  if (sheetName === 'EvidenceImages') {
    if (!sheetHasId_('Blog', data.BlogID)) return 'ไม่พบเรื่องเล่าที่ต้องการเชื่อมภาพหลักฐาน';
    if (!data.ImageFileID && !data.ImageURL) return 'กรุณาเลือกรูปภาพหรือระบุ URL รูปภาพ';
  }
  return '';
}

function validateRelationalDelete(sheetName, id) {
  if (sheetName === 'Expertise') {
    const hasChildren = sheetToObjects(getSheet('Expertise')).some(function (row) { return String(row.ParentID) === String(id); });
    if (hasChildren) return 'ลบไม่ได้: ยังมีทักษะย่อยอยู่ภายใต้ความเชี่ยวชาญนี้';
    const hasRelations = sheetToObjects(getSheet('ExpertiseRelations')).some(function (row) { return String(row.ExpertiseID) === String(id); });
    if (hasRelations) return 'ลบไม่ได้: ความเชี่ยวชาญนี้ยังเชื่อมโยงกับผลงาน';
    const hasNodeLinks = sheetToObjects(getSheet('ExpertiseLinks')).some(function (row) {
      return String(row.SourceExpertiseID) === String(id) || String(row.TargetExpertiseID) === String(id);
    });
    if (hasNodeLinks) return 'ลบไม่ได้: ความเชี่ยวชาญนี้ยังเชื่อมโยงกับโหนดความรู้อื่น';
  }
  if (RELATION_WORK_TYPES.indexOf(sheetName) !== -1) {
    const isLinked = sheetToObjects(getSheet('ExpertiseRelations')).some(function (row) {
      return String(row.WorkType) === String(sheetName) && String(row.WorkID) === String(id);
    });
    if (isLinked) return 'ลบไม่ได้: ผลงานนี้ยังเชื่อมโยงกับทะเบียนความเชี่ยวชาญ';
    const hasReferences = sheetToObjects(getSheet('References')).some(function (row) {
      return String(row.WorkType) === String(sheetName) && String(row.WorkID) === String(id);
    });
    if (hasReferences) return 'ลบไม่ได้: ผลงานนี้ยังมีหลักฐานอ้างอิงเชื่อมโยงอยู่';
  }
  if (sheetName === 'Blog') {
    const hasEvidenceImages = sheetToObjects(getSheet('EvidenceImages')).some(function (row) { return String(row.BlogID) === String(id); });
    if (hasEvidenceImages) return 'ลบไม่ได้: เรื่องเล่านี้ยังมีภาพหลักฐานเชื่อมโยงอยู่ กรุณาลบภาพหลักฐานก่อน';
  }
  return '';
}

function validateWorkReference_(workType, workId, required) {
  if (!workType && !workId && !required) return '';
  if (RELATION_WORK_TYPES.indexOf(String(workType)) === -1) return 'ประเภทผลงานไม่ถูกต้อง';
  if (!workId) return 'กรุณาเลือกผลงานที่ต้องการเชื่อมโยง';
  if (!sheetHasId_(workType, workId)) return 'ไม่พบ WorkID ในฐานข้อมูล ' + workType;
  return '';
}

function sheetHasId_(sheetName, id) {
  if (!id) return false;
  return findRowIndexById(getSheet(sheetName), id) !== -1;
}

function createsExpertiseCycle_(currentId, parentId) {
  const rows = sheetToObjects(getSheet('Expertise'));
  const byId = {};
  rows.forEach(function (row) { byId[String(row.ID)] = row; });
  let cursor = String(parentId || '');
  const visited = {};
  while (cursor && !visited[cursor]) {
    if (cursor === String(currentId)) return true;
    visited[cursor] = true;
    cursor = byId[cursor] ? String(byId[cursor].ParentID || '') : '';
  }
  return false;
}

/* ---------- URL metadata / citation ---------- */

function handleUrlPreview(rawUrl) {
  const safeUrl = validatePublicUrl(rawUrl);
  const isFacebook = /(^|\.)facebook\.com$/i.test(hostName(safeUrl));
  const response = UrlFetchApp.fetch(safeUrl, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
      'Accept-Language': 'th-TH,th;q=0.9,en;q=0.7'
    }
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 400) throw new Error('ไม่สามารถอ่าน URL ได้ (HTTP ' + code + ')');

  const html = response.getContentText().slice(0, 1000000);
  let title = cleanMetaText(firstMeta(html, ['og:title','twitter:title']) || firstTag(html, 'title'));
  const description = cleanMetaText(firstMeta(html, ['og:description','description','twitter:description']));
  const image = absolutizeUrl(firstMeta(html, ['og:image','twitter:image']), safeUrl);
  const siteName = cleanMetaText(firstMeta(html, ['og:site_name'])) || hostName(safeUrl);
  const canonical = absolutizeUrl(firstLink(html, 'canonical'), safeUrl) || safeUrl;
  const publishedAt = cleanMetaText(firstMeta(html, ['article:published_time','datePublished','date','publish_date']));
  const contentType = isFacebook ? 'โพสต์ Facebook' : 'เว็บเพจ';
  if (isFacebook && (!title || /log in|เข้าสู่ระบบ|facebook/i.test(title))) title = 'โพสต์จาก Facebook';
  const citation = buildWebCitation(siteName, publishedAt, title || canonical, contentType, canonical);

  return {
    status: 'ok',
    data: {
      url: canonical,
      title: title,
      description: description,
      image: image,
      siteName: siteName,
      publishedAt: publishedAt,
      contentType: contentType,
      citation: citation,
      retrievedAt: new Date().toISOString()
      ,requiresReview: isFacebook && (!description || !publishedAt)
    }
  };
}

function validatePublicUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!/^https?:\/\//i.test(value)) throw new Error('รองรับเฉพาะ URL แบบ http หรือ https');
  if (value.length > 2048) throw new Error('URL ยาวเกินกำหนด');
  const host = hostName(value).toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
      /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /\.local$/.test(host)) {
    throw new Error('ไม่อนุญาต URL ภายในเครือข่าย');
  }
  return value;
}

function hostName(url) {
  const match = String(url || '').match(/^https?:\/\/([^\/:?#]+)/i);
  return match ? match[1].replace(/^www\./i, '') : '';
}

function firstMeta(html, names) {
  for (let i = 0; i < names.length; i++) {
    const key = names[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp('<meta[^>]+(?:property|name|itemprop)=["\\\']' + key + '["\\\'][^>]+content=["\\\']([^"\\\']*)["\\\'][^>]*>', 'i'),
      new RegExp('<meta[^>]+content=["\\\']([^"\\\']*)["\\\'][^>]+(?:property|name|itemprop)=["\\\']' + key + '["\\\'][^>]*>', 'i')
    ];
    for (let j = 0; j < patterns.length; j++) {
      const match = html.match(patterns[j]);
      if (match) return match[1];
    }
  }
  return '';
}

function firstTag(html, tagName) {
  const match = html.match(new RegExp('<' + tagName + '[^>]*>([\\s\\S]*?)<\\/' + tagName + '>', 'i'));
  return match ? match[1] : '';
}

function firstLink(html, rel) {
  const key = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp('<link[^>]+rel=["\\\']' + key + '["\\\'][^>]+href=["\\\']([^"\\\']+)["\\\']', 'i'),
    new RegExp('<link[^>]+href=["\\\']([^"\\\']+)["\\\'][^>]+rel=["\\\']' + key + '["\\\']', 'i')
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = html.match(patterns[i]);
    if (match) return match[1];
  }
  return '';
}

function cleanMetaText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/\s+/g, ' ')
    .trim();
}

function absolutizeUrl(value, baseUrl) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const root = String(baseUrl).match(/^(https?:\/\/[^\/]+)/i);
  if (!root) return value;
  return value.charAt(0) === '/' ? root[1] + value : root[1] + '/' + value.replace(/^\.\//, '');
}

function buildWebCitation(siteName, publishedAt, title, contentType, url) {
  const year = publishedAt && /^\d{4}/.test(publishedAt) ? publishedAt.slice(0, 4) : 'ม.ป.ป.';
  return (siteName || 'ไม่ทราบแหล่งที่มา') + '. (' + year + '). ' + title +
    ' [' + contentType + ']. สืบค้นจาก ' + url;
}

/* ---------- Spreadsheet configuration / utilities ---------- */

// IDs ของฐานข้อมูลและโฟลเดอร์หลัก (ไม่ใช่ข้อมูลลับ)
const PORTFOLIO_SPREADSHEET_ID = '1Xbi_gW-f4zLSVLr1aOpzDxVU9DEqs5sM2eCbKG54mNs';
const PORTFOLIO_PARENT_FOLDER_ID = '1n-0v-Jg3PLouqgb6JZ5c7kaAl7i0Yyob';

function getPortfolioSpreadsheet_() {
  return SpreadsheetApp.openById(PORTFOLIO_SPREADSHEET_ID);
}

function getSheet(name) {
  return getPortfolioSpreadsheet_().getSheetByName(name);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function sheetToObjects(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const headers = getHeaders(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  }).filter(function (obj) { return obj.ID !== ''; });
}

function findRowIndexById(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function findRowById(sheet, id) {
  const rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) return null;
  const headers = getHeaders(sheet);
  const values = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const obj = {};
  headers.forEach(function (h, i) { obj[h] = values[i]; });
  return obj;
}

/* ---------- Settings / Drive folder lookup ---------- */

function getSettingValue(key) {
  const sheet = getSheet('Settings');
  const rows = sheetToObjects(sheet);
  const found = rows.find(function (r) { return r.Key === key; });
  return found ? found.Value : '';
}

function getDriveFolderId(folderKey) {
  const id = getSettingValue('DriveFolder_' + folderKey);
  if (!id) throw new Error('ไม่พบ DriveFolder_' + folderKey + ' ใน Settings — รัน setupDriveFolders() ก่อน');
  return id;
}

/* ---------- Auth ---------- */

function checkToken(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return !!expected && token === expected;
}

/* ---------- Output ---------- */

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
