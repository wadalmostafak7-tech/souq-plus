const state = { accounts: [], game: 'all', q: '', maxPrice: '', sort: 'new', hideSold: true };
const $ = id => document.getElementById(id);

const grid = $('accounts-grid');
const tabs = $('game-tabs');
const countEl = $('results-count');

document.querySelectorAll('[data-sell]').forEach(a => { a.href = waLink(SELL_MESSAGE); });

/* ---------- التبويبات ---------- */
function renderTabs() {
  const items = [{ key: 'all', label: 'الكل', icon: '✨' }];
  Object.entries(GAMES).forEach(([key, g]) => items.push({ key, label: g.label, icon: g.icon }));
  if (state.accounts.some(a => a.game === 'other')) items.push({ key: 'other', label: 'أخرى', icon: '🎮' });

  tabs.innerHTML = items.map(it => {
    const active = it.key === state.game;
    const cls = active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    return `<button type="button" data-game="${escapeHtml(it.key)}" class="${cls} px-4 py-1.5 rounded-full text-sm font-semibold transition">${it.icon} ${escapeHtml(it.label)}</button>`;
  }).join('');
}

tabs.addEventListener('click', e => {
  const btn = e.target.closest('[data-game]');
  if (!btn) return;
  state.game = btn.dataset.game;
  renderTabs();
  render();
});

/* ---------- الفلترة والترتيب ---------- */
function getFiltered() {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const max = state.maxPrice === '' ? null : Number(state.maxPrice);

  const list = state.accounts.filter(a => {
    if (state.game !== 'all' && a.game !== state.game) return false;
    if (state.hideSold && a.status === 'sold') return false;
    if (max !== null && a.price > max) return false;
    if (words.length) {
      const hay = [a.title, a.level, a.rank, a.server, a.description, gameInfo(a).label, ...a.specs]
        .join(' ').toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    const soldA = a.status === 'sold' ? 1 : 0;
    const soldB = b.status === 'sold' ? 1 : 0;
    if (soldA !== soldB) return soldA - soldB; // المباع في الآخر
    if (state.sort === 'asc') return a.price - b.price;
    if (state.sort === 'desc') return b.price - a.price;
    return b.id - a.id;
  });
  return list;
}

/* ---------- عرض البطاقات ---------- */
function cardHtml(a) {
  const g = gameInfo(a);
  const st = STATUS[a.status];
  const dim = a.status === 'sold' ? 'opacity-60' : '';
  const chips = [];
  if (a.level) chips.push(`${g.levelLabel}: ${a.level}`);
  if (a.rank) chips.push(`${g.rankLabel}: ${a.rank}`);
  if (a.server) chips.push(a.server);

  return `
    <a href="product.html?id=${a.id}" class="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col relative ${dim}">
      <span class="absolute top-2 right-2 z-10 ${st.cls} text-[10px] font-bold px-2 py-0.5 rounded-full shadow">${st.label}</span>
      <span class="absolute top-2 left-2 z-10 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${g.icon} ${escapeHtml(g.label)}</span>
      <img src="${escapeHtml(a.image || NO_IMAGE)}" alt="${escapeHtml(a.title)}" loading="lazy"
           class="w-full h-36 md:h-44 object-cover bg-gray-100" onerror="this.onerror=null;this.src='${NO_IMAGE}'">
      <div class="p-3 flex flex-col gap-2 flex-grow">
        <h3 class="font-bold text-sm text-gray-800 line-clamp-2">${escapeHtml(a.title)}</h3>
        <div class="flex flex-wrap gap-1">
          ${chips.map(c => `<span class="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-md">${escapeHtml(c)}</span>`).join('')}
        </div>
        <div class="flex items-center gap-2 mt-auto pt-1">
          <span class="text-emerald-600 font-extrabold text-lg">${escapeHtml(money(a.price))}</span>
          ${a.originalPrice > a.price ? `<span class="text-gray-400 text-xs line-through">${escapeHtml(money(a.originalPrice))}</span>` : ''}
        </div>
      </div>
    </a>`;
}

function render() {
  const list = getFiltered();
  countEl.textContent = `${list.length} حساب`;
  if (!list.length) {
    grid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">لا توجد حسابات مطابقة. جرّب تغيير البحث أو الفلاتر.</p>';
    return;
  }
  grid.innerHTML = list.map(cardHtml).join('');
}

/* ---------- الأحداث ---------- */
$('search').addEventListener('input', e => { state.q = e.target.value; render(); });
$('max-price').addEventListener('input', e => { state.maxPrice = e.target.value; render(); });
$('sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
$('hide-sold').addEventListener('change', e => { state.hideSold = e.target.checked; render(); });

/* ---------- البداية ---------- */
renderTabs();
fetchAccounts()
  .then(list => { state.accounts = list; renderTabs(); render(); })
  .catch(err => {
    console.error('خطأ في جلب البيانات:', err);
    grid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">تعذر تحميل الحسابات. حاول مرة أخرى لاحقاً.</p>';
  });
