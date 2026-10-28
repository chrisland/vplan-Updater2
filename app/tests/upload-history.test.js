import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendUpload, decodeHtml, previewDocument} from '../src/lib/upload-history.js';

test('retains only the ten most recent uploads', () => {
  let history = [];
  for (let id = 0; id < 12; id++) history = appendUpload(history, {id});
  assert.deepEqual(history.map(entry => entry.id), [11,10,9,8,7,6,5,4,3,2]);
});

test('decodes declared legacy HTML encoding and isolates preview content', () => {
  const prefix = new TextEncoder().encode('<meta charset="windows-1252"><p>');
  assert.match(decodeHtml(new Uint8Array([...prefix, 0xe4])), /ä/);
  const preview = previewDocument('<script>alert(1)</script>');
  assert.ok(preview.indexOf('Content-Security-Policy') < preview.indexOf('<script>'));
  assert.match(preview, /default-src 'none'/);
  assert.match(preview, /form-action 'none'/);
});

test('uploads the captured bytes, persists history, and cleans up; failures are excluded', async () => {
  let fail = false;
  const bytes = new TextEncoder().encode('<h1>Vertretungsplan</h1>');
  const writes = new Map();
  const saved = new Map();
  const removed = [];
  let saveCount = 0;
  const script = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    .split('<script>')[1].split('</script>')[0]
    .replace(/^import .*;\n/gm, '').replace("const store = new Store('store.bin');", '')
    .replace('export default', 'return');
  const options = new Function('store','readFile','writeFile','remove','tempDir','join','upload','appendUpload','decodeHtml','XMLHttpRequest','OverviewView','ProtocolView','SettingsView','UploadsView', script)(
    {set: async (key,value) => saved.set(key,value), save: async () => saveCount++},
    async () => bytes,
    async (path, contents) => writes.set(path, contents),
    async path => removed.push(path),
    async () => '/tmp', async (...parts) => parts.join('/'),
    async (url,path) => {
      assert.deepEqual(writes.get(path), bytes);
      assert.match(url, /plan.htm$/);
      if (fail) throw new Error('network failure');
      return ''; // Empty response bodies also count as successful uploads.
    }, appendUpload, decodeHtml,
    class {responseText = '{"error":false}'; open() {} setRequestHeader() {} send() {}},
    {},{},{},{}
  );
  const app = {...options.data()};
  for (const [key,value] of Object.entries(options.methods)) app[key] = value.bind(app);
  app.folder = '/source'; app.apiUrl = 'https://school.example/upload'; app.apiKey = 'secret';
  await app.sendData('plan.htm');
  await app.historyWrite;
  assert.equal(app.intervalToggle, 0);
  assert.equal(app.uploadHistory.length, 1);
  assert.equal(saved.get('uploadHistory')[0].html, '<h1>Vertretungsplan</h1>');
  assert.equal(saved.get('uploadHistory')[0].size, bytes.length);
  assert.ok(!JSON.stringify(saved.get('uploadHistory')).includes('secret'));
  assert.ok(saveCount > 0);
  assert.equal(removed.length, 1);
  fail = true;
  await app.sendData('plan.htm');
  assert.equal(app.intervalToggle, 0);
  assert.equal(app.uploadHistory.length, 1);
  assert.equal(removed.length, 2);
});
