const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(scripts.length, 'index.html must include application JavaScript');
scripts.forEach((source, index) => new vm.Script(source, { filename:`index-script-${index}.js` }));

assert.doesNotMatch(html, /จัดการจากศูนย์กลาง|สำรวจแฟ้มผลงาน|id=["']quickGrid["']/, 'public page must not show admin guidance or duplicate explorer');
assert.match(html, /id="fieldVideoTitle">ข้อมูลที่ดี เริ่มจากการเข้าใจพื้นที่จริง/, 'field video invitation must remain in the homepage flow');
assert.match(html, /class="field-video-dock"[^>]*hidden/, 'field video must start closed in a floating dock');
assert.match(html, /function openFieldVideo\s*\(/);
assert.match(html, /function closeFieldVideo\s*\(/);

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

console.log('frontend-v4: PASS');
