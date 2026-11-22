/* ========= الإعدادات العامة (عدّل هنا فقط) ========= */
const CONFIG = {
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQyRy_S8FS-Tk3cBOBrG26nAXte1Q59t5jUWEXcT_8xgdXvjswAO4epQFy0I3S5ueVYYhQTUOzQh3RX/pub?gid=0&single=true&output=csv',
  WHATSAPP: '256766177669',
  CURRENCY: '$',
  STORE_NAME: 'سوق بلس'
};

/* الألعاب المدعومة. القيمة في عمود game بالجدول يجب أن تطابق أحد الأسماء في aliases */
const GAMES = {
  pubg: {
    label: 'ببجي', icon: '🎯',
    levelLabel: 'المستوى', rankLabel: 'الرانك',
    aliases: ['pubg', 'pubg mobile', 'ببجي']
  },
  freefire: {
    label: 'فري فاير', icon: '🔥',
    levelLabel: 'المستوى', rankLabel: 'الرانك',
    aliases: ['free fire', 'freefire', 'ff', 'فري فاير']
  },
  coc: {
    label: 'كلاش أوف كلانس', icon: '🏰',
    levelLabel: 'قاعة المدينة (TH)', rankLabel: 'الكؤوس',
    aliases: ['clash of clans', 'coc', 'كلاش أوف كلانس', 'كلاش اوف كلانس']
  }
};

const STATUS = {
  available: { label: 'متاح', cls: 'bg-emerald-600 text-white' },
  reserved:  { label: 'محجوز', cls: 'bg-amber-500 text-white' },
  sold:      { label: 'مباع', cls: 'bg-gray-700 text-white' }
};

const NO_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#e5e7eb"/>' +
  '<text x="50%" y="50%" fill="#9ca3af" font-size="28" text-anchor="middle" font-family="sans-serif">No Image</text></svg>'
);

/* رسالة البيع الجاهزة للواتساب */
const SELL_MESSAGE =
  'مرحباً، أريد بيع حساب لعبة.\n\n' +
  '🎮 اللعبة:\n📊 المستوى / الرانك:\n🌍 السيرفر:\n💰 السعر المطلوب:\n' +
  '📝 أهم المواصفات (سكنات، عناصر...):\n\n' +
  'سأرسل لقطات شاشة للحساب فقط، دون البريد الإلكتروني أو كلمة المرور.';

/* ========= دوال مساعدة ========= */
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function safeUrl(u) {
  const s = String(u || '').trim();
  return /^https?:\/\//i.test(s) ? s : '';
}

function toNumber(v) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function money(n) {
  return `${n}${CONFIG.CURRENCY}`;
}

function waLink(message) {
  return `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function normalizeGame(raw) {
  const s = String(raw || '').trim().toLowerCase();
  for (const [key, g] of Object.entries(GAMES)) {
    if (g.aliases.includes(s)) return key;
  }
  return 'other';
}

function normalizeStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (['sold', 'مباع', 'تم البيع'].includes(s)) return 'sold';
  if (['reserved', 'محجوز'].includes(s)) return 'reserved';
  return 'available';
}

function gameInfo(account) {
  return GAMES[account.game] || {
    label: account.gameRaw || 'أخرى', icon: '🎮',
    levelLabel: 'المستوى', rankLabel: 'الرانك'
  };
}

/* ========= جلب الحسابات من Google Sheets ========= */
async function fetchAccounts() {
  const sep = CONFIG.SHEET_CSV_URL.includes('?') ? '&' : '?';
  const res = await fetch(`${CONFIG.SHEET_CSV_URL}${sep}_t=${Date.now()}`);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_')
  });

  return parsed.data.map(row => ({
    id: parseInt(row.id),
    game: normalizeGame(row.game),
    gameRaw: (row.game || '').trim(),
    title: (row.title || '').trim(),
    price: toNumber(row.price),
    originalPrice: toNumber(row.original_price),
    level: (row.level || '').trim(),
    rank: (row.rank || '').trim(),
    server: (row.server || '').trim(),
    specs: (row.specs || '').split(/[|;؛\n]/).map(s => s.trim()).filter(Boolean),
    description: (row.description || '').trim(),
    image: safeUrl(row.image),
    extraImages: (row.extra_images || '').split(/[\s|,]+/).map(safeUrl).filter(Boolean),
    status: normalizeStatus(row.status)
  })).filter(a => !isNaN(a.id) && a.title !== '');
}
