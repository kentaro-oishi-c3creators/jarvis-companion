const byId = id => document.getElementById(id);
const transcript = byId('transcript');
const composer = byId('composer');
const input = byId('message');
const send = byId('send');
const load = byId('load-model');
const status = byId('model-status');
const context = byId('context');
const remember = byId('remember');
const clear = byId('clear-chat');
const versionPath = new URL('./', location.href).pathname;
const key = 'jarvis.session:' + versionPath;
const model = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
const labels = {user: 'あなた', ai: 'Jarvis · AI', local: 'Jarvis · ローカル整理', error: 'システム'};
let history = [];
let engine;
let generating = false;

function display(entry) {
  const item = document.createElement('article');
  item.className = 'message';
  item.dataset.role = entry.kind === 'user' ? 'user' : 'assistant';
  item.dataset.kind = entry.kind;
  const author = document.createElement('strong');
  author.className = 'message-author';
  author.textContent = labels[entry.kind];
  const body = document.createElement('p');
  body.className = 'message-content';
  body.textContent = entry.text;
  item.append(author, body);
  transcript.append(item);
}

function save() {
  try {
    if (remember.checked) {
      localStorage.setItem(key, JSON.stringify({history: history.slice(-100), context: context.value}));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    status.textContent = '端末の保存設定を更新できませんでした。ブラウザのサイトデータ設定を確認してください。';
  }
}

function add(kind, text) {
  const entry = {kind, text};
  history.push(entry);
  display(entry);
  save();
  transcript.scrollTop = transcript.scrollHeight;
}

try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && Array.isArray(saved.history) && typeof saved.context === 'string') {
    history = saved.history.filter(e => e && Object.hasOwn(labels, e.kind) && typeof e.text === 'string').slice(-100);
    context.value = saved.context;
    remember.checked = true;
    history.forEach(display);
  }
} catch { /* A private window can still keep the current conversation in memory. */ }

remember.addEventListener('change', save);
context.addEventListener('input', () => { if (remember.checked) save(); });
clear.addEventListener('click', () => {
  if (generating || !window.confirm('この版の対話履歴と文脈メモを消去しますか？')) return;
  history = [];
  context.value = '';
  remember.checked = false;
  input.value = '';
  transcript.replaceChildren();
  save();
  input.focus();
});

for (const button of document.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt || button.textContent.trim();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

load.addEventListener('click', async () => {
  if (engine || load.disabled) return;
  load.disabled = true;
  try {
    if (!navigator.gpu || !await navigator.gpu.requestAdapter()) {
      throw new Error('WebGPU対応のGPUが見つかりません。ブラウザのハードウェアアクセラレーションを確認してください。');
    }
    status.textContent = 'AIモデルを準備中…';
    const {CreateMLCEngine} = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.80/lib/index.js');
    engine = await CreateMLCEngine(model, {
      initProgressCallback(progress) { status.textContent = progress.text; }
    });
    status.textContent = '端末内AIが利用できます · Qwen2.5 0.5B';
    load.textContent = 'モデル読み込み済み';
  } catch (error) {
    status.textContent = 'AIを開始できませんでした。' + error.message + ' ローカル整理を利用できます。';
    load.disabled = false;
  }
});

function organize(text) {
  const groups = new Map([['作業候補', []], ['確認事項', []], ['材料', []]]);
  const lines = text.split(/\r?\n|(?<=[。！？!?])(?=\S)/u).map(line =>
    line.trim().replace(/^(?:[-*•・]|\d+[.)、])\s*/u, '')).filter(Boolean);
  for (const line of new Set(lines)) {
    let group = '材料';
    if (/[?？]|未定|要確認|不明|教えて|どうすれば|だろうか|でしょうか/u.test(line)) group = '確認事項';
    else if (/TODO|必要|する|したい|しよう|してください|までに|作成|提出|準備|連絡|手配|送る|まとめる|調べる|予約/u.test(line)) group = '作業候補';
    groups.get(group).push(line);
  }
  const sections = [];
  for (const [heading, items] of groups) {
    if (items.length) sections.push(heading + '\n' + items.map(item => '・' + item).join('\n'));
  }
  return sections.join('\n\n') || '整理する文章を入力してください。';
}

function aiMessages(text) {
  const note = context.value.trim().slice(0, 650);
  const system = 'あなたはJarvisです。利用者が使う言語で具体的かつ簡潔に答えてください。' +
    (note ? '\n利用者の文脈メモ：\n' + note : '');
  const previous = [];
  let size = 0;
  // Only complete AI exchanges belong in the model conversation.
  for (let i = history.length - 2; i > 0; i--) {
    const answer = history[i];
    const question = history[i - 1];
    if (answer.kind !== 'ai' || question.kind !== 'user') continue;
    const content = question.text.slice(0, 350);
    const response = answer.text.slice(0, 450);
    if (size + content.length + response.length > 850) break;
    previous.unshift({role: 'user', content}, {role: 'assistant', content: response});
    size += content.length + response.length;
  }
  return [{role: 'system', content: system}, ...previous, {role: 'user', content: text}];
}

composer.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || generating) return;
  if (engine && text.length > 1200) {
    status.textContent = '端末内AIへの入力は1回1,200文字までです。分けて送信してください。';
    input.focus();
    return;
  }
  input.value = '';
  add('user', text);
  if (!engine) {
    add('local', organize(text));
    input.focus();
    return;
  }
  generating = true;
  send.disabled = clear.disabled = true;
  composer.setAttribute('aria-busy', 'true');
  status.textContent = '端末内AIが応答を生成中…';
  try {
    const result = await engine.chat.completions.create({
      messages: aiMessages(text), max_tokens: 320, temperature: 0.5
    });
    const answer = result.choices[0]?.message.content?.trim();
    if (!answer) throw new Error('応答が空でした。');
    add('ai', answer);
    status.textContent = '端末内AIが利用できます · Qwen2.5 0.5B';
  } catch (error) {
    add('error', '応答を生成できませんでした。入力を短くして再度送信してください。');
    status.textContent = 'AI生成エラー：' + error.message;
  } finally {
    generating = false;
    send.disabled = clear.disabled = false;
    composer.removeAttribute('aria-busy');
    input.focus();
  }
});

input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    composer.requestSubmit();
  }
});
