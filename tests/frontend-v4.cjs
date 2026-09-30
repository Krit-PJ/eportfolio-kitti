const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(scripts.length, 'index.html must include application JavaScript');
scripts.forEach((source, index) => new vm.Script(source, { filename:`index-script-${index}.js` }));

assert.doesNotMatch(html, /จัดการจากศูนย์กลาง|สำรวจแฟ้มผลงาน|id=["']quickGrid["']/, 'public page must not show admin guidance or duplicate explorer');
assert.match(html, /id="fieldVideoTitle">ข้อมูลที่ดี เริ่มจากการเข้าใจพื้นที่จริง/, 'field video invitation must remain in the homepage flow');
assert.match(html, /class="field-video-box"/, 'field video must be presented as an inline playable box');
assert.match(html, /<video id="fieldVideoPlayer" controls playsinline/, 'field video must expose native playback controls');
assert.match(html, /body\{padding-left:0!important\}/, 'public navigation must not reserve a desktop sidebar');
assert.match(html, /nav\.main-nav\{position:sticky!important/, 'public navigation must stay above page content');
assert.match(html, /html\[data-font-size="xxlarge"\]/, 'font size levels must have explicit usable CSS');
assert.match(html, /function openFieldVideo\s*\(/);
assert.match(html, /function closeFieldVideo\s*\(/);
assert.match(html, /previous\.data\.length && !result\.data\.length/, 'verified snapshot must survive an unexpectedly empty refresh');
assert.match(html, /function loadEducation\s*\(\)[\s\S]*?getCanonicalData\('Education'\)/, 'education must use the canonical database pipeline');
assert.match(html, /id="educationStatus"/, 'education must disclose its database status');
assert.match(html, /class="footprint-card-media"/, 'homepage story cards must provide a meaningful cover-image slot');
assert.match(html, /storyCover\(item\)/, 'homepage story cards must resolve configured or contextual cover images');

const expectedMenuOrder = ['home','about','dashboards','innovation','research','publications','projects','training','blog','contact'];
const menuOrder = [...html.matchAll(/<a data-page="([^"]+)" onclick="App\.goPage/g)].map(match=>match[1]);
assert.deepEqual(menuOrder, expectedMenuOrder, 'public menu order must match the approved top navigation');

assert.match(html, /api\('Projects', \{ limit: 100, status:'published', isInnovation:true \}\)/, 'innovation page must request published innovation projects only');
assert.match(html, /truthyFlag\(p\.IsInnovation\)/, 'innovation page must verify IsInnovation on returned rows');
assert.match(html, /fetchAllPublished\('References'\)/);
assert.match(html, /fetchAllPublished\('Training'\)/);
assert.match(html, /getCanonicalData\('Blog'\)/);
assert.doesNotMatch(html, /catch\(\(\)=>\{ window\._blogData = FALLBACK_DATA\.Blog/, 'configured API errors must not silently show preview blog data');

const appReturn = html.match(/return \{ init, setTheme,[\s\S]*?resetExpertiseGraph \};/);
assert.ok(appReturn, 'App public API return object not found');
const publicApi = new Set(appReturn[0].match(/[A-Za-z_$][\w$]*/g));
const inlineCalls = new Set([...html.matchAll(/App\.([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
const missing = [...inlineCalls].filter(name => !publicApi.has(name));
assert.deepEqual(missing, [], `inline App handlers must be exported: ${missing.join(', ')}`);

for (const name of ['renderExpertiseGraph','focusExpertise','searchExpertise','filterExpertiseWorks','resetExpertiseGraph']) {
  const declarations = [...html.matchAll(new RegExp(`function\\s+${name}\\s*\\(`, 'g'))];
  assert.equal(declarations.length, 1, `${name} must have one active implementation`);
}
assert.match(html, /function applyExpertiseFilters\s*\(/, 'expertise search and type filters must share one predicate');
assert.match(html, /matchesText&&matchesType/, 'combined expertise filters must use AND logic');

assert.match(html, /window\._metricDatasets\[def\.key\] = result/);
assert.match(html, /openMetricDataset, closeMetricDataset/);
assert.match(html, /openWorkDetail, closeWorkDetail, openFieldVideo, closeFieldVideo/);

const adminScripts = [...adminHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(adminScripts.length, 'admin.html must include application JavaScript');
adminScripts.forEach((source, index) => new vm.Script(source, { filename:`admin-script-${index}.js` }));
assert.doesNotMatch(adminHtml, /E-Portfolio CMS|สนง\.เกษตร/, 'admin branding must not fall back to a second or abbreviated identity');
assert.equal((adminHtml.match(/ระบบหลังบ้าน E-Portfolio/g) || []).length, 3, 'document title, login and app shell must use one admin identity');
assert.match(adminHtml, /สำนักงานเกษตรจังหวัดกำแพงเพชร<br>ระบบตรวจสอบบัญชีผ่านเซิร์ฟเวอร์/, 'app shell must retain the full organization and server-authentication descriptor');
assert.match(adminHtml, /function toggleSidebar\s*\(/, 'mobile admin navigation must be operable');
assert.match(adminHtml, /toggleSidebar, closeSidebar/, 'mobile navigation controls must be exported');

console.log('frontend-v4: PASS');
