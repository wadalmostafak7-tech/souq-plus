const $ = id => document.getElementById(id);

function showNotFound() {
  $('loading').classList.add('hidden');
  $('not-found').classList.remove('hidden');
}

function renderAccount(a) {
  const g = gameInfo(a);
  const st = STATUS[a.status];

  document.title = `${a.title} | ${CONFIG.STORE_NAME}`;

  /* الصور */
  const images = [a.image, ...a.extraImages].filter(Boolean);
  const main = $('main-image');
  main.src = images[0] || NO_IMAGE;
  main.alt = a.title;
  main.onerror = () => { main.onerror = null; main.src = NO_IMAGE; };

  if (images.length > 1) {
    const gallery = $('gallery');
    gallery.innerHTML = images.map((src, i) =>
      `<img src="${escapeHtml(src)}" data-index="${i}" alt="" class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-emerald-600 cursor-pointer transition flex-shrink-0">`
    ).join('');
    gallery.classList.remove('hidden');
    gallery.addEventListener('click', e => {
      const img = e.target.closest('img[data-index]');
      if (img) main.src = images[Number(img.dataset.index)];
    });
  }

  /* النصوص */
  $('game-badge').textContent = `${g.icon} ${g.label}`;
  const sb = $('status-badge');
  sb.textContent = st.label;
  sb.className = `text-xs px-3 py-1 rounded-full font-bold ${st.cls}`;
  $('title').textContent = a.title;
  $('price').textContent = money(a.price);
  if (a.originalPrice > a.price) {
    const o = $('original-price');
    o.textContent = money(a.originalPrice);
    o.classList.remove('hidden');
  }

  /* المواصفات الأساسية */
  const facts = [];
  if (a.level) facts.push([g.levelLabel, a.level]);
  if (a.rank) facts.push([g.rankLabel, a.rank]);
  if (a.server) facts.push(['السيرفر', a.server]);
  facts.push(['رقم الحساب', '#' + a.id]);
  $('facts').innerHTML = facts.map(([k, v]) =>
    `<div class="bg-gray-50 border rounded-lg p-2.5"><dt class="text-[11px] text-gray-500">${escapeHtml(k)}</dt><dd class="font-bold">${escapeHtml(v)}</dd></div>`
  ).join('');

  if (a.specs.length) {
    $('specs').innerHTML = a.specs.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    $('specs-box').classList.remove('hidden');
  }
  if (a.description) {
    $('description').textContent = a.description;
    $('desc-box').classList.remove('hidden');
  }

  /* أزرار التواصل */
  const base = `الحساب رقم #${a.id}\n🎮 ${g.label}\n📌 ${a.title}\n💰 ${money(a.price)}`;
  $('buy-btn').href = waLink(`مرحباً، أريد شراء هذا الحساب:\n\n${base}`);
  $('ask-btn').href = waLink(`مرحباً، لدي سؤال عن هذا الحساب:\n\n${base}\n\nسؤالي: `);

  /* الحالة: محجوز أو مباع */
  if (a.status !== 'available') {
    const notice = $('notice');
    notice.classList.remove('hidden');
    if (a.status === 'sold') {
      notice.className = 'text-sm font-bold p-3 rounded-lg border bg-gray-100 text-gray-700 border-gray-200';
      notice.textContent = '❌ تم بيع هذا الحساب.';
    } else {
      notice.className = 'text-sm font-bold p-3 rounded-lg border bg-amber-50 text-amber-700 border-amber-200';
      notice.textContent = '⏳ هذا الحساب محجوز حالياً لمشترٍ آخر. اسأل عنه إن رغبت.';
    }
    const buy = $('buy-btn');
    buy.removeAttribute('href');
    buy.removeAttribute('target');
    buy.className = 'w-full bg-gray-300 text-gray-500 py-3.5 rounded-xl font-bold flex items-center justify-center text-base cursor-not-allowed';
    buy.textContent = a.status === 'sold' ? 'تم البيع' : 'محجوز';
  }

  $('loading').classList.add('hidden');
  $('details').classList.remove('hidden');
}

async function init() {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  if (isNaN(id)) return showNotFound();

  try {
    const list = await fetchAccounts();
    const account = list.find(a => a.id === id);
    if (account) renderAccount(account);
    else showNotFound();
  } catch (err) {
    console.error('خطأ في تحميل الحساب:', err);
    showNotFound();
  }
}

init();
