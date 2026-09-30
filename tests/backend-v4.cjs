/* Mocked Apps Script regression tests. Run: node tests/backend-v4.cjs */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class Sheet {
  constructor(values) { this.values = values; }
  getLastRow() { return this.values.length; }
  getLastColumn() { return this.values[0].length; }
  getRange(row, col, rows, cols) {
    const self = this;
    return {
      getValues() { return self.values.slice(row - 1, row - 1 + rows).map(r => r.slice(col - 1, col - 1 + cols)); },
      setValue(value) { self.values[row - 1][col - 1] = value; },
      setValues(values) { values.forEach((r, i) => r.forEach((v, j) => { self.values[row - 1 + i][col - 1 + j] = v; })); },
      setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; }
    };
  }
  appendRow(row) { this.values.push(row); }
  deleteRow(row) { this.values.splice(row - 1, 1); }
  setFrozenRows() {}
}
const sheets = {
  Blog: new Sheet([['ID','Title','Status','CreatedAt','UpdatedAt'], ['pub','Published','published','',''], ['draft','Private','draft','','']]),
  Projects: new Sheet([['ID','Title','Status'], ['project-1','Project','published']]),
  References: new Sheet([['ID','WorkType','WorkID','Title'], ['ref-1','Projects','project-1','Proof']]),
  ExpertiseRelations: new Sheet([['ID','ExpertiseID','WorkType','WorkID']]),
  Expertise: new Sheet([['ID','Name','ParentID']]), EvidenceImages: new Sheet([['ID','BlogID']])
};
const context = {
  console, JSON, Date, Object, String, Number, Math, RegExp, Error,
  SpreadsheetApp: { openById: id => {
    assert.equal(id, '1Xbi_gW-f4zLSVLr1aOpzDxVU9DEqs5sM2eCbKG54mNs', 'API opens the configured portfolio spreadsheet');
    return { getSheetByName: n => sheets[n] };
  } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => k === 'API_TOKEN' ? 'test-token' : '' }) },
  Utilities: { getUuid: () => 'new-id' },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('apps_script/Code.gs', 'utf8'), context);
function output(result) { return JSON.parse(result.text); }

let listed = output(context.doGet({ parameter: { sheet: 'Blog', action: 'list' } }));
assert.deepStrictEqual(listed.data.map(r => r.ID), ['pub'], 'public list excludes drafts');
assert.equal(output(context.doGet({ parameter: { sheet: 'Blog', action: 'get', id: 'draft' } })).status, 'error', 'public get excludes draft');
assert.equal(output(context.doPost({ postData: { contents: JSON.stringify({ action:'create', sheet:'Blog', token:'test-token', data:{ Title:'Created', Status:'draft' } }) } })).status, 'ok', 'authenticated create succeeds');
assert.equal(output(context.doPost({ postData: { contents: JSON.stringify({ action:'update', sheet:'Blog', token:'test-token', id:'pub', data:{ Title:'Updated', Status:'published' } }) } })).status, 'ok', 'authenticated update succeeds');
assert.match(context.validateRelationalDelete('Projects', 'project-1'), /หลักฐานอ้างอิง/, 'referenced project cannot be deleted');
assert.match(context.validateRelationalWrite('Career', { Title:'Role', Organization:'', StartDate:'' }, ''), /หน่วยงาน/, 'Career required fields are enforced');
assert.match(context.validateRelationalWrite('Projects', { Title:'Innovation', IsInnovation:'true' }, ''), /Problem/, 'innovation evidence fields are enforced');

// Header migrations are deliberately additive and repeat-safe, including legacy blank header gaps.
const migrationContext = { console, SpreadsheetApp: {}, Utilities: {} };
vm.createContext(migrationContext);
vm.runInContext(fs.readFileSync('apps_script/SheetSetup.gs', 'utf8'), migrationContext);
const legacy = new Sheet([['ID', '', 'Title', 'LegacyData'], ['old-id', '', 'Old title', 'must-survive']]);
migrationContext.ensureSheetHeaders_(legacy, ['ID', 'Title', 'Status']);
migrationContext.ensureSheetHeaders_(legacy, ['ID', 'Title', 'Status']);
assert.equal(legacy.values[0][3], 'LegacyData', 'migration preserves columns after a blank legacy header');
assert.equal(legacy.values[0].filter(v => v === 'Status').length, 1, 'repeated migration does not duplicate headers');
assert.equal(legacy.values[1][3], 'must-survive', 'migration preserves existing row data');

const setupSource = fs.readFileSync('apps_script/SheetSetup.gs', 'utf8');
assert.ok(!setupSource.includes('.clear()'), 'setup must not clear existing sheet data');
assert.ok(!setupSource.includes('getUi().alert'), 'setup must not use blocking UI alerts');
assert.ok(setupSource.includes('DriveParentFolderID'), 'Drive setup honors the configured parent folder');
console.log('backend-v4 mocked regression tests: PASS');
