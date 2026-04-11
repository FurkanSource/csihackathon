/**
 * SmartLead — app.js
 * Handles: lead generation via Groq + Llama, geolocation,
 *          rendering, filtering, sorting, DB panel, CSV export, canvas
 *          + AI Chatbot with rate limiting and topic guard
 */

'use strict';

// ── CONFIG ─────────────────────────────────────────────────────────────
const CONFIG = {
  SIMULATE_DELAY_MS: 2800,
  STEP_INTERVAL_MS:  520,
  NUM_LEADS:         5,
  OR_KEY:            '***REMOVED***',
  OR_URL:            'https://api.groq.com/openai/v1/chat/completions',
  OR_MODEL:          'llama-3.3-70b-versatile',
  CHAT_LIMIT:        5,
  SERVER_URL:        'http://localhost:5500'
};

// ── LAYER 1: INSTANT JS VALIDATION ────────────────────────────────────
const Validator = {
  NOISE_PATTERN:  /^[^a-zA-Z]*$/,
  REPEAT_PATTERN: /^(.)\1+$/,
  KEYBOARD_ROWS:  ['qwertyuiop','asdfghjkl','zxcvbnm','qwerty','asdfgh','zxcvbn','qweasd','poiuyt'],
  NONSENSE_WORDS: [
    'asdf','qwerty','zxcv','hjkl','aaaa','bbbb','cccc','dddd',
    'test','testing','blah','blahblah','foo','bar','baz','foobar',
    'lorem','ipsum','stuff','things','idk','dunno','whatever',
    'nothing','none','na','n/a','lol','lmao','haha','hehe',
    'aaa','bbb','ccc','ddd','eee','fff','ggg','hhh','iii','jjj',
    'kkk','lll','mmm','nnn','ooo','ppp','qqq','rrr','sss','ttt',
    'uuu','vvv','www','xxx','yyy','zzz',
    'abc','abcd','abcde','abcdef','abcdefg',
    '123','1234','12345','123456',
    'random','fake','test123','hello','hi','hey','yo','sup',
    'cheese','pizza','burger','cat','dog','fish','bird',
    'ilikecheese','ihatemondays','idontknow'
  ],
  MIN_LENGTH: 3,
  MAX_LENGTH: 120,

  checkField(value, fieldName) {
    const v = value.trim();
    if (!v) return { valid: false, reason: `${fieldName} cannot be empty.` };
    if (v.length < this.MIN_LENGTH) return { valid: false, reason: `${fieldName} is too short to be valid.` };
    if (v.length > this.MAX_LENGTH) return { valid: false, reason: `${fieldName} is too long. Keep it concise.` };
    if (this.NOISE_PATTERN.test(v)) return { valid: false, reason: `${fieldName} must contain real words.` };
    if (this.REPEAT_PATTERN.test(v.replace(/\s/g, ''))) return { valid: false, reason: `${fieldName} doesn't look like a real entry.` };
    const lower = v.toLowerCase().replace(/\s/g, '');
    for (const row of this.KEYBOARD_ROWS) {
      if (lower.length >= 4 && row.includes(lower)) return { valid: false, reason: `${fieldName} looks like keyboard mashing.` };
    }
    for (const word of this.NONSENSE_WORDS) {
      if (lower === word || lower.replace(/\s/g,'') === word) return { valid: false, reason: `"${v}" is not a valid ${fieldName.toLowerCase()}.` };
    }
    const charCounts = {};
    for (const c of lower.replace(/\s/g,'')) charCounts[c] = (charCounts[c] || 0) + 1;
    const maxRepeat  = Math.max(...Object.values(charCounts));
    const totalChars = lower.replace(/\s/g,'').length;
    if (totalChars > 4 && maxRepeat / totalChars > 0.6) return { valid: false, reason: `${fieldName} doesn't appear to be a real entry.` };
    if (/^\d+$/.test(v)) return { valid: false, reason: `${fieldName} must be a real description, not just numbers.` };
    if (lower.replace(/\s/g,'').length > 5) {
      const vowels = (lower.match(/[aeiou]/g) || []).length;
      if (vowels === 0) return { valid: false, reason: `${fieldName} doesn't look like real text.` };
    }
    return { valid: true, reason: '' };
  },

  runLayer1(biz, target, service) {
    const checks = [
      this.checkField(biz,     'Business Type'),
      this.checkField(target,  'Target Customer'),
      this.checkField(service, 'Service Offered')
    ];
    for (const check of checks) { if (!check.valid) return check; }
    return { valid: true, reason: '' };
  }
};

// ── LAYER 2: AI PRE-VALIDATION ─────────────────────────────────────────
async function validateWithAI(biz, target, service) {
  const prompt = `You are a strict business input validator. A user has entered the following into a B2B lead generation tool:

Business Type: "${biz}"
Target Customer: "${target}"
Service Offered: "${service}"

Determine if ALL THREE fields are:
1. Real, coherent business-related entries (not gibberish, nonsense, random words, or keyboard mashing)
2. Internally consistent with each other
3. Specific enough to generate meaningful B2B leads

Respond with ONLY raw JSON — no markdown, no explanation:
{"valid": true} if all fields pass, or
{"valid": false, "reason": "One clear sentence explaining what is wrong"}

Be strict. Reject nonsense, gibberish, joke inputs, and incoherent combinations.`;

  try {
    const res = await fetch(CONFIG.OR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.OR_KEY}`, 'HTTP-Referer': window.location.href, 'X-Title': 'SmartLead-Validator' },
      body: JSON.stringify({ model: CONFIG.OR_MODEL, max_tokens: 80, temperature: 0, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) return { valid: true };
    const data   = await res.json();
    const raw    = data?.choices?.[0]?.message?.content || '{}';
    const clean  = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { valid: parsed.valid === true, reason: parsed.reason || 'Your inputs don\'t appear to be valid business information.' };
  } catch { return { valid: true }; }
}

// ── ERROR DISPLAY ──────────────────────────────────────────────────────
function showValidationError(message) {
  const existing = document.getElementById('validation-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'validation-error';
  el.style.cssText = `background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.4);border-radius:8px;color:#f87171;font-family:'JetBrains Mono',monospace;font-size:12px;padding:12px 16px;margin:0 20px 14px;display:flex;align-items:flex-start;gap:10px;animation:errorIn 0.25s ease both;`;
  el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${message}</span>`;
  const btn = document.getElementById('forge-btn');
  btn.parentNode.insertBefore(el, btn);
  const card = document.querySelector('.form-card');
  card.style.animation = 'none'; card.offsetHeight; card.style.animation = 'shake 0.4s ease';
  setTimeout(() => { const e = document.getElementById('validation-error'); if (e) { e.style.opacity='0'; e.style.transition='opacity 0.3s ease'; setTimeout(() => e.remove(), 300); } }, 5000);
}

function clearValidationError() {
  const e = document.getElementById('validation-error');
  if (e) e.remove();
}

// ── INJECT GLOBAL STYLES (validation + chat) ───────────────────────────
(function injectStyles() {
  if (document.getElementById('smartlead-extra-styles')) return;
  const style = document.createElement('style');
  style.id    = 'smartlead-extra-styles';
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(6px)}
      45%{transform:translateX(-4px)} 60%{transform:translateX(4px)} 75%{transform:translateX(-2px)} 90%{transform:translateX(2px)}
    }
    @keyframes errorIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes chatSlideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes chatSlideDown { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(24px) scale(0.97)} }
    @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(0,212,255,0.35)} 70%{box-shadow:0 0 0 10px rgba(0,212,255,0)} 100%{box-shadow:0 0 0 0 rgba(0,212,255,0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }

    /* ── CHAT BUTTON ── */
    #chat-fab {
      position:fixed; bottom:28px; right:28px; z-index:999;
      width:56px; height:56px; border-radius:50%;
      background:linear-gradient(135deg,#00d4ff,#7c3aed);
      border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 8px 32px rgba(0,212,255,0.3), 0 2px 8px rgba(0,0,0,0.4);
      transition:transform 0.2s, box-shadow 0.2s;
      animation:pulseRing 2.5s ease-in-out infinite;
    }
    #chat-fab:hover { transform:scale(1.08); box-shadow:0 12px 40px rgba(0,212,255,0.45), 0 2px 8px rgba(0,0,0,0.4); }
    #chat-fab svg { transition:transform 0.3s; }
    #chat-fab.open svg { transform:rotate(90deg); }

    /* ── CHAT PANEL ── */
    #chat-panel {
      position:fixed; bottom:96px; right:28px; z-index:998;
      width:380px; height:560px;
      background:#0b0e18;
      border:1px solid #1c2238;
      border-radius:20px;
      display:flex; flex-direction:column;
      overflow:hidden;
      box-shadow:0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.08);
      animation:chatSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    #chat-panel.closing { animation:chatSlideDown 0.22s ease both; }

    /* ── CHAT HEADER ── */
    .chat-header {
      padding:16px 18px 14px;
      border-bottom:1px solid #1c2238;
      background:linear-gradient(180deg,#0f1320 0%,#0b0e18 100%);
      display:flex; align-items:center; gap:12px; flex-shrink:0;
    }
    .chat-avatar {
      width:36px; height:36px; border-radius:10px;
      background:linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.2));
      border:1px solid rgba(0,212,255,0.25);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .chat-header-info { flex:1; min-width:0; }
    .chat-name { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:0.06em; color:#eef0f8; line-height:1; }
    .chat-status { font-family:'JetBrains Mono',monospace; font-size:10px; color:#10b981; letter-spacing:0.08em; display:flex; align-items:center; gap:5px; margin-top:3px; }
    .chat-status-dot { width:5px; height:5px; border-radius:50%; background:#10b981; animation:pulseRing 2s ease-in-out infinite; }
    .chat-limit-badge {
      font-family:'JetBrains Mono',monospace; font-size:10px;
      padding:4px 10px; border-radius:20px;
      background:rgba(0,212,255,0.08); border:1px solid rgba(0,212,255,0.2);
      color:#00d4ff; white-space:nowrap;
    }
    .chat-limit-badge.warn { background:rgba(245,158,11,0.08); border-color:rgba(245,158,11,0.3); color:#f59e0b; }
    .chat-limit-badge.out  { background:rgba(239,68,68,0.08);  border-color:rgba(239,68,68,0.3);  color:#f87171; }

    /* ── MESSAGES AREA ── */
    .chat-messages {
      flex:1; overflow-y:auto; padding:16px 14px;
      display:flex; flex-direction:column; gap:10px;
      scroll-behavior:smooth;
    }
    .chat-messages::-webkit-scrollbar { width:3px; }
    .chat-messages::-webkit-scrollbar-thumb { background:#1c2238; border-radius:2px; }

    /* ── MESSAGE BUBBLES ── */
    .chat-msg { display:flex; gap:8px; animation:msgIn 0.25s ease both; max-width:100%; }
    .chat-msg.user { flex-direction:row-reverse; }

    .msg-avatar {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;
      margin-top:2px;
    }
    .chat-msg.bot  .msg-avatar { background:linear-gradient(135deg,rgba(0,212,255,0.15),rgba(124,58,237,0.15)); border:1px solid rgba(0,212,255,0.2); color:#00d4ff; }
    .chat-msg.user .msg-avatar { background:rgba(124,58,237,0.15); border:1px solid rgba(124,58,237,0.25); color:#a78bfa; }

    .msg-bubble {
      max-width:78%; padding:10px 14px; border-radius:14px;
      font-size:13px; line-height:1.6; word-wrap:break-word;
    }
    .chat-msg.bot  .msg-bubble { background:#0f1320; border:1px solid #1c2238; color:#c8cfe8; border-bottom-left-radius:4px; }
    .chat-msg.user .msg-bubble { background:linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.12)); border:1px solid rgba(0,212,255,0.18); color:#eef0f8; border-bottom-right-radius:4px; }

    /* ── TYPING INDICATOR ── */
    .typing-indicator { display:flex; gap:8px; align-items:flex-end; }
    .typing-bubble {
      background:#0f1320; border:1px solid #1c2238;
      border-radius:14px; border-bottom-left-radius:4px;
      padding:12px 16px; display:flex; gap:5px; align-items:center;
    }
    .typing-dot {
      width:6px; height:6px; border-radius:50%; background:#4a5580;
      animation:dotBounce 1.2s ease-in-out infinite;
    }
    .typing-dot:nth-child(2) { animation-delay:0.15s; }
    .typing-dot:nth-child(3) { animation-delay:0.3s; }

    /* ── QUICK SUGGESTIONS ── */
    .chat-suggestions {
      padding:8px 14px 4px; display:flex; gap:6px; flex-wrap:wrap; flex-shrink:0;
      border-top:1px solid #0f1320;
    }
    .chat-suggestion {
      font-size:11px; font-family:'JetBrains Mono',monospace;
      padding:5px 10px; border-radius:20px;
      background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.15);
      color:#8892b0; cursor:pointer; white-space:nowrap;
      transition:all 0.18s; letter-spacing:0.02em;
    }
    .chat-suggestion:hover { background:rgba(0,212,255,0.1); border-color:rgba(0,212,255,0.3); color:#00d4ff; }

    /* ── INPUT AREA ── */
    .chat-input-area {
      padding:12px 14px 16px; border-top:1px solid #1c2238;
      display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
      background:#0b0e18;
    }
    #chat-input {
      flex:1; background:#0f1320; border:1px solid #1c2238; border-radius:12px;
      color:#eef0f8; font-family:'Cabinet Grotesk',sans-serif; font-size:13px;
      padding:10px 14px; outline:none; resize:none; max-height:96px;
      min-height:40px; line-height:1.5;
      transition:border-color 0.2s, box-shadow 0.2s;
      scrollbar-width:none;
    }
    #chat-input:focus { border-color:rgba(0,212,255,0.35); box-shadow:0 0 0 3px rgba(0,212,255,0.06); }
    #chat-input::placeholder { color:#2d3755; }
    #chat-input:disabled { opacity:0.4; cursor:not-allowed; }

    #chat-send {
      width:40px; height:40px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#00d4ff,#7c3aed);
      border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:opacity 0.2s, transform 0.15s;
    }
    #chat-send:hover { opacity:0.88; transform:scale(1.05); }
    #chat-send:disabled { opacity:0.3; cursor:not-allowed; transform:none; }

    /* ── RATE LIMIT WALL ── */
    .chat-limit-wall {
      padding:20px 18px; text-align:center; flex-shrink:0;
      border-top:1px solid #1c2238; background:rgba(239,68,68,0.04);
      animation:fadeIn 0.3s ease;
    }
    .limit-wall-icon { font-size:24px; margin-bottom:8px; }
    .limit-wall-title { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:0.06em; color:#f87171; margin-bottom:4px; }
    .limit-wall-sub { font-size:12px; color:#4a5580; font-family:'JetBrains Mono',monospace; }

    /* ── TOPIC BLOCK MSG ── */
    .msg-bubble.blocked { border-color:rgba(239,68,68,0.25); background:rgba(239,68,68,0.05); color:#f87171; }

    /* ── RESPONSIVE ── */
    @media (max-width:480px) {
      #chat-panel { width:calc(100vw - 24px); right:12px; bottom:84px; height:500px; }
      #chat-fab   { right:16px; bottom:16px; }
    }
  `;
  document.head.appendChild(style);
})();

// ── CHATBOT ────────────────────────────────────────────────────────────
const ChatBot = {
  isOpen:       false,
  msgCount:     0,
  MAX_MSGS:     CONFIG.CHAT_LIMIT,
  history:      [], // [{role, content}]
  isTyping:     false,

  // Topics the bot is allowed to discuss
  ALLOWED_TOPICS: [
    'lead','leads','score','scoring','outreach','pipeline','deal','business',
    'target','service','smartlead','filter','sort','export','csv','database',
    'save','search','qualify','qualification','signal','industry','location',
    'decision maker','company','client','prospect','sales','b2b','revenue',
    'annual','monthly','hot lead','warm','strong','cold','form','input',
    'generate','discover','find','contact','strategy','approach','tip','help',
    'how','what','why','explain','guide','use','work','feature','rate','value'
  ],

  SYSTEM_PROMPT: `You are LeadBot, the official AI assistant for SmartLead — a B2B lead discovery and qualification platform built at Dolphin Hacks 2025.

Your ONLY purpose is to help users understand and use SmartLead effectively. You must ONLY discuss:
- How to use SmartLead (filling in the form, what each field means)
- Understanding lead scores (0-100 scale, Hot 85+, Strong 70+, Warm 55+, Cold below)
- Outreach strategies shown in the lead cards
- Deal valuation (monthly and annual estimates)
- Buying signals and what they mean
- Filtering leads by score tier (Hot, Strong, Warm)
- Sorting leads (by score, deal value, or name)
- Exporting leads to CSV
- Saving leads to the database
- Business profile tips (how to write good Business Type, Target Customer, Service Offered inputs)
- Understanding the pipeline total and summary stats
- General B2B sales and lead generation concepts directly relevant to using the app

If a user asks about ANYTHING else — coding, homework, general AI questions, news, personal advice, other tools, etc. — you must politely but firmly redirect them. Say something like: "I'm only able to help with SmartLead and B2B lead generation topics. Is there something about the app I can help you with?"

Keep responses concise (2-4 sentences max unless a list is needed). Be helpful, confident, and professional. Never make up features that don't exist in SmartLead.`,

  // Fast topic check before hitting the API
  isOnTopic(message) {
    const lower = message.toLowerCase();
    // Always allow very short clarifying messages
    if (message.trim().length < 15) return true;
    return this.ALLOWED_TOPICS.some(t => lower.includes(t));
  },

  init() {
    this.injectHTML();
    this.bindEvents();
    this.addMessage('bot', "Hi! I'm **LeadBot** — your SmartLead guide. I can help you understand lead scores, outreach strategies, how to fill in the form, and anything else about SmartLead. What would you like to know?");
  },

  injectHTML() {
    // FAB button
    const fab = document.createElement('button');
    fab.id = 'chat-fab';
    fab.setAttribute('aria-label', 'Open SmartLead Assistant');
    fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    document.body.appendChild(fab);

    // Chat panel
    const panel = document.createElement('div');
    panel.id    = 'chat-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </div>
        <div class="chat-header-info">
          <div class="chat-name">LeadBot</div>
          <div class="chat-status"><span class="chat-status-dot"></span>SmartLead Assistant</div>
        </div>
        <div class="chat-limit-badge" id="chat-limit-badge">${this.MAX_MSGS} msgs left</div>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-suggestions" id="chat-suggestions">
        <button class="chat-suggestion" data-msg="How do lead scores work?">Lead scores?</button>
        <button class="chat-suggestion" data-msg="How do I fill in the form correctly?">Form tips</button>
        <button class="chat-suggestion" data-msg="What does outreach strategy mean?">Outreach</button>
        <button class="chat-suggestion" data-msg="How do I export my leads?">Export CSV</button>
      </div>
      <div class="chat-input-area">
        <textarea id="chat-input" placeholder="Ask about SmartLead…" rows="1"></textarea>
        <button id="chat-send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);
  },

  bindEvents() {
    const fab    = document.getElementById('chat-fab');
    const send   = document.getElementById('chat-send');
    const input  = document.getElementById('chat-input');
    const suggs  = document.getElementById('chat-suggestions');

    fab.addEventListener('click', () => this.toggle());

    send.addEventListener('click', () => this.sendMessage());

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 96) + 'px';
    });

    // Suggestion chips
    suggs.addEventListener('click', e => {
      const btn = e.target.closest('.chat-suggestion');
      if (btn) {
        input.value = btn.dataset.msg;
        this.sendMessage();
      }
    });
  },

  toggle() {
    const panel = document.getElementById('chat-panel');
    const fab   = document.getElementById('chat-fab');

    if (this.isOpen) {
      panel.classList.add('closing');
      fab.classList.remove('open');
      setTimeout(() => { panel.style.display = 'none'; panel.classList.remove('closing'); }, 220);
    } else {
      panel.style.display = 'flex';
      fab.classList.add('open');
      this.scrollToBottom();
      document.getElementById('chat-input').focus();
    }
    this.isOpen = !this.isOpen;
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text || this.isTyping) return;

    // Rate limit check
    if (this.msgCount >= this.MAX_MSGS) {
      this.showLimitWall();
      return;
    }

    // Block empty / pure noise
    if (text.length < 2 || /^[^a-zA-Z0-9]+$/.test(text)) {
      this.addMessage('bot', "Please type a real question about SmartLead.", true);
      return;
    }

    // Frontend topic guard
    if (!this.isOnTopic(text)) {
      this.addMessage('user', text);
      input.value = '';
      input.style.height = 'auto';
      this.addMessage('bot', "I'm only able to help with SmartLead and B2B lead generation topics. Try asking about lead scores, outreach strategies, or how to fill in the form!", true);
      return;
    }

    // Add user message
    this.addMessage('user', text);
    this.history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';
    this.msgCount++;
    this.updateLimitBadge();

    // Show typing
    this.showTyping();

    try {
      // Try backend first, fall back to direct Groq
      let reply;
      try {
        const backendRes = await fetch(`${CONFIG.SERVER_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: this.history.slice(-8) }),
          signal: AbortSignal.timeout(8000)
        });
        if (backendRes.ok) {
          const bd = await backendRes.json();
          if (bd.blocked) {
            this.hideTyping();
            this.addMessage('bot', bd.reply, true);
            // Rate limited by server
            if (bd.rate_limited) { this.msgCount = this.MAX_MSGS; this.updateLimitBadge(); this.showLimitWall(); }
            return;
          }
          reply = bd.reply;
        } else { throw new Error('backend unavailable'); }
      } catch {
        // Direct Groq fallback
        reply = await this.callGroqDirect(text);
      }

      this.hideTyping();
      this.history.push({ role: 'assistant', content: reply });
      this.addMessage('bot', reply);

      // Show limit wall on last message
      if (this.msgCount >= this.MAX_MSGS) {
        setTimeout(() => this.showLimitWall(), 600);
      }

    } catch (err) {
      this.hideTyping();
      this.addMessage('bot', "Sorry, I'm having trouble connecting right now. Please try again in a moment.", true);
    }
  },

  async callGroqDirect(text) {
    const messages = [
      { role: 'system', content: this.SYSTEM_PROMPT },
      ...this.history.slice(-6)
    ];
    const res = await fetch(CONFIG.OR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.OR_KEY}`, 'HTTP-Referer': window.location.href, 'X-Title': 'SmartLead-Chat' },
      body: JSON.stringify({ model: CONFIG.OR_MODEL, max_tokens: 300, temperature: 0.5, messages })
    });
    if (!res.ok) throw new Error('Groq error');
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
  },

  addMessage(role, text, isBlocked = false) {
    const msgs    = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg ${role}`;

    const avatar  = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'bot' ? 'SL' : 'YOU';

    const bubble  = document.createElement('div');
    bubble.className = `msg-bubble${isBlocked ? ' blocked' : ''}`;
    // Simple bold markdown support
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    msgs.appendChild(wrapper);
    this.scrollToBottom();
  },

  showTyping() {
    this.isTyping = true;
    const msgs    = document.getElementById('chat-messages');
    const wrap    = document.createElement('div');
    wrap.id       = 'typing-wrap';
    wrap.className= 'chat-msg bot typing-indicator';
    const av      = document.createElement('div');
    av.className  = 'msg-avatar'; av.textContent = 'SL';
    const bub     = document.createElement('div');
    bub.className = 'typing-bubble';
    bub.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    wrap.appendChild(av); wrap.appendChild(bub);
    msgs.appendChild(wrap);
    this.scrollToBottom();
  },

  hideTyping() {
    this.isTyping = false;
    const el = document.getElementById('typing-wrap');
    if (el) el.remove();
  },

  scrollToBottom() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
  },

  updateLimitBadge() {
    const badge   = document.getElementById('chat-limit-badge');
    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const left    = Math.max(0, this.MAX_MSGS - this.msgCount);
    if (!badge) return;
    badge.textContent = left === 0 ? 'Limit reached' : `${left} msg${left !== 1 ? 's' : ''} left`;
    badge.className   = 'chat-limit-badge' + (left <= 1 ? ' out' : left <= 2 ? ' warn' : '');
    if (left === 0) { input.disabled = true; sendBtn.disabled = true; }
  },

  showLimitWall() {
    // Remove suggestions + input
    const suggs = document.getElementById('chat-suggestions');
    const area  = document.querySelector('.chat-input-area');
    if (suggs) suggs.remove();
    if (area)  area.remove();

    // Inject wall
    const panel = document.getElementById('chat-panel');
    const wall  = document.createElement('div');
    wall.className = 'chat-limit-wall';
    wall.innerHTML = `
      <div class="limit-wall-icon">🔒</div>
      <div class="limit-wall-title">Message Limit Reached</div>
      <div class="limit-wall-sub">You've used all ${this.MAX_MSGS} messages.<br>Refresh the page to start a new session.</div>`;
    panel.appendChild(wall);
  }
};

// ── GEOLOCATION via ipapi.co ────────────────────────────────────────────
const GeoLocation = {
  data: null,
  async detect() {
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const json = await res.json();
      this.data  = { city: json.city||'', region: json.region||'', country: json.country_name||'', countryCode: json.country_code||'', latitude: json.latitude||null, longitude: json.longitude||null, timezone: json.timezone||'', currency: json.currency||'', org: json.org||'' };
      return this.data;
    } catch (e) { this.data = null; return null; }
  },
  label() {
    if (!this.data) return '';
    return [this.data.city, this.data.region, this.data.country].filter(Boolean).join(', ');
  }
};

// ── LEAD GENERATION ────────────────────────────────────────────────────
async function generateLeads(biz, target, service, location, dealSize) {
  const geoLabel   = location || GeoLocation.label() || 'Not specified';
  const geoContext = GeoLocation.data
    ? `Detected user location: ${geoLabel} (lat: ${GeoLocation.data.latitude}, lng: ${GeoLocation.data.longitude}). Prioritise leads in or near this area.`
    : `User-specified location: ${geoLabel}`;
  const dealRanges = { small:'$500-$2,000/month', medium:'$2,000-$10,000/month', large:'$10,000-$50,000/month', enterprise:'$50,000+/month' };

  const prompt = `You are a B2B sales intelligence engine. Generate exactly 5 realistic, highly specific potential business leads for the following:

Business Type: ${biz}
Target Customer: ${target}
Service Offered: ${service}
Deal Size Target: ${dealRanges[dealSize] || dealRanges.medium}
${geoContext}

Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Each object must have exactly these fields:
{"name":"Realistic company name","industry":"Specific industry sector","size":"e.g. 11-50 employees","city":"City, Region","decisionMaker":"Job title","score":<integer 40-97>,"monthly":<integer USD>,"annual":<monthly*12>,"painPoint":"One sentence","reason":"2-3 sentences","outreach":["Step 1","Step 2","Step 3","Step 4"],"signals":["Signal 1","Signal 2","Signal 3"]}

Make companies feel real and location-specific. Vary scores naturally.`;

  const res = await fetch(CONFIG.OR_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${CONFIG.OR_KEY}`, 'HTTP-Referer':window.location.href, 'X-Title':'SmartLead' },
    body: JSON.stringify({ model: CONFIG.OR_MODEL, max_tokens: 2048, messages: [{ role:'user', content:prompt }] })
  });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err?.error?.message || `API error ${res.status}`); }
  const data  = await res.json();
  const raw   = data?.choices?.[0]?.message?.content || '';
  const clean = raw.replace(/```json|```/g,'').trim();
  const leads = JSON.parse(clean);
  if (!Array.isArray(leads) || leads.length === 0) throw new Error('No leads returned. Please try again.');
  return leads.sort((a,b) => b.score - a.score);
}

// ── UTILITIES ──────────────────────────────────────────────────────────
function formatMoney(n) {
  if (n >= 1_000_000) return '$' + (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + Math.round(n/1_000) + 'K';
  return '$' + n;
}
function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function getScoreMeta(score) {
  if (score >= 85) return { label:'Hot Lead', stroke:'#10b981', color:'#10b981' };
  if (score >= 70) return { label:'Strong',   stroke:'#00d4ff', color:'#00d4ff' };
  if (score >= 55) return { label:'Warm',     stroke:'#f59e0b', color:'#f59e0b' };
  return               { label:'Cold',    stroke:'#ef4444', color:'#ef4444' };
}

// ── STATE ──────────────────────────────────────────────────────────────
const State = {
  leads:[], filtered:[], saved:[], meta:{}, loadTimer:null, step:0,
  set(leads, meta) { this.leads = leads; this.filtered = [...leads]; this.meta = meta; }
};

// ── SCREENS ────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ── LOADING SEQUENCE ───────────────────────────────────────────────────
const LOG_STEPS = [
  { sub:'Validating your business profile...',   pct:10 },
  { sub:'Detecting your location...',            pct:25 },
  { sub:'Analysing your business profile...',    pct:42 },
  { sub:'Cross-referencing local companies...',  pct:60 },
  { sub:'Running AI qualification engine...',    pct:78 },
  { sub:'Generating personalised strategies...', pct:92 }
];

function startLoading() {
  State.step = 0;
  LOG_STEPS.forEach((_,i) => { const el = document.getElementById(`log-${i}`); if(el) el.className='log-item'; });
  setProgress(5);
  document.getElementById('loading-sub').textContent = 'Initialising lead discovery engine...';
  activateLogStep(0);
  State.loadTimer = setInterval(() => {
    if (State.step < LOG_STEPS.length - 1) { doneLogStep(State.step); State.step++; activateLogStep(State.step); }
  }, CONFIG.STEP_INTERVAL_MS);
}
function activateLogStep(i) {
  const el = document.getElementById(`log-${i}`);
  if (el) el.className = 'log-item active';
  const s = LOG_STEPS[i];
  if (s) { document.getElementById('loading-sub').textContent = s.sub; setProgress(s.pct); }
}
function doneLogStep(i) { const el = document.getElementById(`log-${i}`); if(el) el.className='log-item done'; }
function stopLoading() {
  clearInterval(State.loadTimer); State.loadTimer = null;
  LOG_STEPS.forEach((_,i) => doneLogStep(i)); setProgress(100);
}
function setProgress(pct) { const el = document.getElementById('progress-fill'); if(el) el.style.width = pct + '%'; }

// ── RENDER RESULTS ─────────────────────────────────────────────────────
function renderResults(leads, meta) {
  const loc           = meta.location || GeoLocation.label() || 'Detected Location';
  const totalPipeline = leads.reduce((s,l) => s+l.annual, 0);
  const avgScore      = Math.round(leads.reduce((s,l) => s+l.score, 0) / leads.length);
  const hotCount      = leads.filter(l => l.score >= 85).length;

  document.getElementById('nav-leads-found').textContent    = leads.length;
  document.getElementById('nav-total-pipeline').textContent = formatMoney(totalPipeline);
  document.getElementById('results-title').textContent      = `Lead Report - ${meta.biz}`;
  document.getElementById('results-meta').textContent       = `${leads.length} leads · ${loc} · Generated ${formatDate()}`;

  document.getElementById('summary-grid').innerHTML = [
    { label:'Total Pipeline',  val:formatMoney(totalPipeline),   cls:'c-green',  sub:'Annual potential' },
    { label:'Avg Lead Score',  val:`${avgScore}/100`,            cls:'c-accent', sub:'Quality index'    },
    { label:'Hot Leads',       val:hotCount,                     cls:'c-gold',   sub:'Score 85+'        },
    { label:'Top Opportunity', val:formatMoney(leads[0].annual), cls:'c-purple', sub:leads[0].name      }
  ].map(s => `<div class="scard"><div class="scard-label">${s.label}</div><div class="scard-val ${s.cls}">${s.val}</div><div class="scard-sub">${s.sub}</div></div>`).join('');

  renderLeadCards(leads);
}

function renderLeadCards(leads) {
  const grid = document.getElementById('leads-grid');
  grid.innerHTML = '';
  leads.forEach((lead, i) => {
    const meta  = getScoreMeta(lead.score);
    const circ  = 2 * Math.PI * 30;
    const isTop = i === 0;
    const delay = (i * 0.07).toFixed(2);
    const card  = document.createElement('div');
    card.className = 'lead-card';
    card.style.animationDelay = delay + 's';
    card.dataset.index = i; card.dataset.score = lead.score; card.dataset.annual = lead.annual; card.dataset.name = lead.name;
    card.innerHTML = `
      <div class="lead-rank"><div class="rank-num ${isTop?'is-top':''}">0${i+1}</div></div>
      <div class="lead-body">
        <div class="lead-name">${lead.name}</div>
        <div class="lead-sub">${lead.decisionMaker} · ${lead.size}</div>
        <div class="lead-tags">
          <span class="ltag t-industry">${lead.industry}</span>
          <span class="ltag t-location">📍 ${lead.city}</span>
          <span class="ltag t-size">${lead.size}</span>
          ${lead.signals.slice(0,2).map(s=>`<span class="ltag t-signal">⚡ ${s}</span>`).join('')}
        </div>
        <div class="lead-reason">${lead.reason}</div>
        <div class="lead-expand" id="expand-${i}">
          <div class="expand-grid">
            <div class="ebox">
              <div class="ebox-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Deal Valuation</div>
              <div class="deal-val">${formatMoney(lead.monthly)}<span>/mo</span></div>
              <div class="deal-annual">${formatMoney(lead.annual)} annual potential</div>
            </div>
            <div class="ebox">
              <div class="ebox-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Outreach Strategy</div>
              <div class="outreach-list">${lead.outreach.map((step,si)=>`<div class="ostep"><div class="ostep-n">${si+1}</div><div>${step}</div></div>`).join('')}</div>
            </div>
            <div class="ebox">
              <div class="ebox-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Buying Signals</div>
              <div class="signals-list">${lead.signals.map(s=>`<div class="signal-row"><div class="signal-dot"></div>${s}</div>`).join('')}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="lead-score-col">
        <div class="score-ring-wrap">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle class="score-track" cx="36" cy="36" r="30"/>
            <circle class="score-fill" cx="36" cy="36" r="30" stroke="${meta.stroke}" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${circ.toFixed(2)}" id="ring-${i}"/>
          </svg>
          <div class="score-num" style="color:${meta.color}">${lead.score}</div>
        </div>
        <div class="score-badge-label" style="color:${meta.color}">${meta.label}</div>
      </div>`;
    card.addEventListener('click', () => SmartLead.toggleExpand(i, card));
    grid.appendChild(card);
    requestAnimationFrame(() => {
      setTimeout(() => { const ring = document.getElementById(`ring-${i}`); if(ring) ring.style.strokeDashoffset = (circ*(1-lead.score/100)).toFixed(2); }, 80+i*120);
    });
  });
}

// ── SMARTLEAD PUBLIC API ────────────────────────────────────────────────
const SmartLead = {
  async generate() {
    const biz      = document.getElementById('biz-type').value.trim();
    const target   = document.getElementById('target').value.trim();
    const service  = document.getElementById('service').value.trim();
    const location = document.getElementById('location').value.trim();
    const dealSize = document.getElementById('deal-size').value;

    // Layer 1
    const layer1 = Validator.runLayer1(biz, target, service);
    if (!layer1.valid) { showValidationError(layer1.reason); return; }
    clearValidationError();

    document.getElementById('forge-btn').disabled = true;
    showScreen('loading-screen');
    startLoading();
    const meta = { biz, target, service, location, dealSize };

    try {
      if (!location && !GeoLocation.data) await GeoLocation.detect();

      // Layer 2 + min animation time
      const [aiCheck] = await Promise.all([
        validateWithAI(biz, target, service),
        new Promise(r => setTimeout(r, 800))
      ]);
      if (!aiCheck.valid) {
        stopLoading();
        setTimeout(() => { document.getElementById('forge-btn').disabled = false; showScreen('input-screen'); showValidationError(aiCheck.reason); }, 300);
        return;
      }

      const [leads] = await Promise.all([
        generateLeads(biz, target, service, location, dealSize),
        new Promise(r => setTimeout(r, CONFIG.SIMULATE_DELAY_MS))
      ]);
      stopLoading();
      setTimeout(() => { State.set(leads, meta); showScreen('results-screen'); renderResults(leads, meta); }, 350);

    } catch (err) {
      stopLoading();
      setTimeout(() => { document.getElementById('forge-btn').disabled = false; showScreen('input-screen'); showValidationError(`Something went wrong: ${err.message}`); }, 300);
    }
  },

  loadSample(i) {
    const samples = [
      { biz:'Digital Marketing Agency', target:'Small restaurants and cafes',      service:'Social media management & paid ads', location:'', deal:'medium' },
      { biz:'SaaS Product Company',     target:'Mid-size B2B tech teams',          service:'Project management software',        location:'', deal:'large'  },
      { biz:'Healthcare Consultancy',   target:'Private clinics and GP surgeries', service:'Operations & compliance consulting', location:'', deal:'large'  }
    ];
    const s = samples[i];
    document.getElementById('biz-type').value  = s.biz;
    document.getElementById('target').value    = s.target;
    document.getElementById('service').value   = s.service;
    document.getElementById('location').value  = s.location;
    document.getElementById('deal-size').value = s.deal;
    clearValidationError();
  },

  toggleExpand(index, card) {
    const expand = document.getElementById(`expand-${index}`);
    const isOpen = expand.style.display === 'block';
    document.querySelectorAll('.lead-expand').forEach(e => e.style.display='none');
    document.querySelectorAll('.lead-card').forEach(c => c.classList.remove('expanded'));
    if (!isOpen) { expand.style.display='block'; card.classList.add('expanded'); }
  },

  filter(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const rules = { all:()=>true, hot:l=>l.score>=85, strong:l=>l.score>=70, warm:l=>l.score>=55 };
    State.filtered = State.leads.filter(rules[type] || rules.all);
    renderLeadCards(State.filtered);
  },

  sort(by) {
    const sorters = { score:(a,b)=>b.score-a.score, deal:(a,b)=>b.annual-a.annual, name:(a,b)=>a.name.localeCompare(b.name) };
    State.filtered = [...State.filtered].sort(sorters[by] || sorters.score);
    renderLeadCards(State.filtered);
  },

  saveToDB() {
    if (!State.leads.length) return;
    State.leads.forEach(lead => { if (!State.saved.find(s=>s.name===lead.name)) State.saved.push({...lead, savedAt:new Date().toLocaleTimeString()}); });
    this.renderDB();
    const panel = document.getElementById('db-panel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior:'smooth' });
  },

  renderDB() {
    const body = document.getElementById('db-body');
    body.innerHTML = State.saved.map(l => {
      const m = getScoreMeta(l.score);
      return `<tr><td style="color:var(--text)">${l.name}</td><td style="color:${m.color};font-family:var(--font-mono)">${l.score}</td><td>${l.industry}</td><td style="color:var(--green)">${formatMoney(l.monthly)}</td><td style="font-family:var(--font-mono);font-size:10px;color:var(--text3)">${l.savedAt}</td></tr>`;
    }).join('');
  },

  exportCSV() {
    if (!State.leads.length) return;
    const headers = ['Rank','Company','Score','Industry','Location','Size','Decision Maker','Monthly Value','Annual Value','Pain Point'];
    const rows    = State.leads.map((l,i) => [i+1,l.name,l.score,l.industry,l.city,l.size,l.decisionMaker,formatMoney(l.monthly),formatMoney(l.annual),`"${(l.painPoint||'').replace(/"/g,'""')}"`]);
    const csv     = [headers,...rows].map(r=>r.join(',')).join('\n');
    const blob    = new Blob([csv], {type:'text/csv'});
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href=url; a.download=`smartlead-export-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  },

  reset() {
    State.leads=[]; State.filtered=[]; State.meta={};
    document.getElementById('forge-btn').disabled             = false;
    document.getElementById('nav-leads-found').textContent    = '0';
    document.getElementById('nav-total-pipeline').textContent = '$0';
    document.getElementById('db-panel').style.display         = 'none';
    clearValidationError();
    showScreen('input-screen');
  }
};

// ── INIT ───────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  GeoLocation.detect();
  ChatBot.init();
  ['biz-type','target','service','location'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', clearValidationError);
  });
});

// ── ANIMATED CANVAS BACKGROUND ─────────────────────────────────────────
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const MAX_NODES = 40, CONNECT_DIST = 140;
  let W, H, nodes = [];
  function resize() {
    W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
    nodes = Array.from({length:MAX_NODES}, () => ({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, r:Math.random()*1.5+0.5 }));
  }
  function tick(t) {
    ctx.clearRect(0,0,W,H);
    nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>W)n.vx*=-1; if(n.y<0||n.y>H)n.vy*=-1; });
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++) {
      const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<CONNECT_DIST) { ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.strokeStyle=`rgba(0,212,255,${(1-dist/CONNECT_DIST)*0.12})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    nodes.forEach(n => { const pulse=0.5+0.5*Math.sin(t*0.001+n.x); ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle=`rgba(0,212,255,${0.2+0.3*pulse})`; ctx.fill(); });
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize); resize(); requestAnimationFrame(tick);
})();
