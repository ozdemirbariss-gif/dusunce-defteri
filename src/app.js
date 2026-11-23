import { articles, library } from './content.js';

const base = document.body.dataset.base;
const savedKey = 'dusunce-defteri-kaydedilenler';
const themeKey = 'dusunce-defteri-tema';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const normalize = (value) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const searchableText = article => normalize(`${article.title} ${article.excerpt} ${article.abstract} ${article.field} ${article.category} ${article.type} ${article.keywords.join(' ')} ${article.searchText || ''}`);
const articleBySlug = new Map(articles.map(article => [article.slug, article]));
const searchEntries = [
 ...articles.map(article => ({
  title: article.title,
  slug: article.slug,
  href: `${base}yazilar/${article.slug}/`,
  language: 'tr',
  meta: `Araştırmalar · ${article.field} · ${article.minutes} dk${article.sample ? ' · Örnek metin' : ''}`,
  text: searchableText(article)
 })),
 ...library.map(entry => ({
  title: entry.title,
  href: `${base}${entry.path || `#${entry.id}`}`,
  language: entry.language,
  meta: `${entry.kind} · ${entry.publisher}`,
  text: normalize(`${entry.title} ${entry.excerpt} ${entry.topic} ${entry.publisher} ${entry.kind} ${entry.year ?? ''}`)
 }))
];
function readStorage(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
let saved;
try { const value = JSON.parse(readStorage(savedKey, '[]')); saved = new Set(Array.isArray(value) ? value.filter(slug => articleBySlug.has(slug)) : []); } catch { saved = new Set(); }
let toastTimer;
function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove('visible'), 2700); }
function updateSaveButtons() {
 $$('[data-save]').forEach(button => {
  const active = saved.has(button.dataset.save);
  button.setAttribute('aria-pressed', String(active));
  const title = articleBySlug.get(button.dataset.save).title;
  button.setAttribute('aria-label', active ? `${title} yazısını okuma listesinden çıkar` : `${title} yazısını okuma listesine ekle`);
 });
}
$$('[data-save]').forEach(button => button.addEventListener('click', () => {
 const slug = button.dataset.save;
 if (saved.has(slug)) saved.delete(slug); else saved.add(slug);
 let persisted = true;
 try { localStorage.setItem(savedKey, JSON.stringify([...saved])); } catch { persisted = false; }
 updateSaveButtons();
 toast(persisted ? (saved.has(slug) ? 'Çalışma okuma listesine eklendi.' : 'Çalışma okuma listesinden çıkarıldı.') : 'Bu oturum için kaydedildi. Tarayıcı kalıcı kayda izin vermiyor.');
}));
updateSaveButtons();
function applyTheme(dark) {
 document.body.classList.toggle('dark', dark);
 $$('[data-toggle-theme]').forEach(button => button.setAttribute('aria-label', dark ? 'Açık temaya geç' : 'Koyu temaya geç'));
 $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1b1916' : '#f8f7f3');
}
applyTheme(readStorage(themeKey, 'light') === 'dark');
$$('[data-toggle-theme]').forEach(button => button.addEventListener('click', () => {
 const dark = !document.body.classList.contains('dark');
 applyTheme(dark);
 try { localStorage.setItem(themeKey, dark ? 'dark' : 'light'); } catch {}
}));

const archiveSearch = $('#archive-search');
const archiveCards = $$('.article-card');
let activeFilter = 'Tümü';
function filterArchive() {
 const search = normalize(archiveSearch.value.trim());
 let count = 0;
 archiveCards.forEach(card => {
  const article = articleBySlug.get(card.dataset.slug);
  const match = (activeFilter === 'Tümü' || article.category === activeFilter) && searchableText(article).includes(search);
  card.hidden = !match;
  if (match) count++;
 });
 $('#empty-state').hidden = count !== 0;
 $('#result-count').textContent = `${count} yazı gösteriliyor`;
 $('#filter-status').textContent = `${count} yazı gösteriliyor.`;
}
function setFilter(category) {
 activeFilter = category;
 $$('.filter').forEach(button => {
  const active = button.dataset.filter === category;
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
 });
 filterArchive();
}
$$('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
$$('[data-topic]').forEach(link => link.addEventListener('click', () => { archiveSearch.value = ''; setFilter(link.dataset.topic); }));
archiveSearch?.addEventListener('input', filterArchive);
$('#reset-filters')?.addEventListener('click', () => { archiveSearch.value = ''; setFilter('Tümü'); archiveSearch.focus(); });

$$('[data-keyword]').forEach(link => link.addEventListener('click', () => { archiveSearch.value = link.dataset.keyword; setFilter('Tümü'); }));
$('#archive-sort')?.addEventListener('change', event => {
 const mode = event.target.value;
 const cards = [...archiveCards];
 cards.sort((left, right) => {
  const a = articleBySlug.get(left.dataset.slug);
  const b = articleBySlug.get(right.dataset.slug);
  if (mode === 'title') return a.title.localeCompare(b.title, 'tr');
  if (mode === 'reading') return a.minutes - b.minutes || Number(left.dataset.order) - Number(right.dataset.order);
  return Number(left.dataset.order) - Number(right.dataset.order);
 });
 const grid = $('.article-grid');
 cards.forEach(card => grid.append(card));
 const count = cards.filter(card => !card.hidden).length;
 $('#filter-status').textContent = `${count} yazı gösteriliyor. Sıralama: ${event.target.selectedOptions[0].textContent}.`;
});

$$('[data-youtube]').forEach(preview => preview.addEventListener('click', event => {
 if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 const player = document.createElement('iframe');
 player.src = `https://www.youtube-nocookie.com/embed/${preview.dataset.youtube}?autoplay=1`;
 player.title = preview.dataset.videoTitle;
 player.referrerPolicy = 'strict-origin-when-cross-origin';
 player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
 player.allowFullscreen = true;
 preview.replaceWith(player);
 player.focus();
}));

const searchDialog = $('#search-dialog');
const dialogInput = $('#dialog-input');
const dialogResults = $('#dialog-results');
let savedMode = false;
let dialogTrigger;
function renderDialog() {
 const query = normalize(dialogInput.value.trim());
 const matches = searchEntries.filter(entry => (!savedMode || saved.has(entry.slug)) && entry.text.includes(query));
 dialogResults.innerHTML = matches.length
  ? matches.map(entry => `<a class="dialog-result" href="${escapeHtml(entry.href)}"><p>${escapeHtml(entry.meta)}</p><h3 lang="${escapeHtml(entry.language)}">${escapeHtml(entry.title)}</h3></a>`).join('')
  : `<p class="dialog-empty">${savedMode && !saved.size ? 'Okuma listen henüz boş. Bir yazıyı yanındaki ayraç simgesiyle kaydedebilirsin.' : 'Aramana uygun içerik bulunamadı.'}</p>`;
 $('#dialog-count').textContent = `${matches.length} sonuç`;
}
function openDialog(mode, trigger) {
 savedMode = mode;
 dialogTrigger = trigger;
 dialogInput.type = 'search';
 dialogInput.value = '';
 $('#dialog-input-label').textContent = mode ? 'Okuma listesinde ara' : 'Yazı, makale veya video ara';
 $('#search-title').textContent = mode ? 'Okuma listesi' : 'Sitede ara';
 renderDialog();
 searchDialog.showModal();
 document.body.style.overflow = 'hidden';
 dialogInput.focus();
}
$$('[data-open-search]').forEach(button => button.addEventListener('click', () => openDialog(false, button)));
$$('[data-open-saved]').forEach(button => button.addEventListener('click', () => openDialog(true, button)));
dialogInput.addEventListener('input', () => { if (dialogInput.type === 'search') renderDialog(); });
dialogResults.addEventListener('click', event => { if (event.target.closest('a')) searchDialog.close(); });
$$('[data-close-search]').forEach(button => button.addEventListener('click', () => searchDialog.close()));
searchDialog.addEventListener('click', event => { if (event.target === searchDialog) { const rect = searchDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) searchDialog.close(); } });
searchDialog.addEventListener('close', () => { document.body.style.overflow = ''; dialogTrigger?.focus({ preventScroll: true }); });
document.addEventListener('keydown', event => {
 if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
  event.preventDefault();
  if (!searchDialog.open) openDialog(false, $('[data-open-search]')); else searchDialog.close();
 }
});
window.addEventListener('pageshow', () => { if (!searchDialog.open) document.body.style.overflow = ''; });
$('#font-size')?.addEventListener('click', () => {
 const large = $('.prose').classList.toggle('large-type');
 $('#font-size').setAttribute('aria-pressed', String(large));
 $('#font-size').setAttribute('aria-label', large ? 'Yazı boyutunu küçült' : 'Yazı boyutunu büyüt');
});
$('#share-article')?.addEventListener('click', async () => {
 const url = new URL(location.href); url.hash = '';
 try { await navigator.clipboard.writeText(url.href); toast('Çalışmanın bağlantısı kopyalandı.'); }
 catch {
  openDialog(false, $('#share-article'));
  $('#search-title').textContent = 'Çalışmanın bağlantısı';
  $('#dialog-input-label').textContent = 'Çalışmanın bağlantısı';
  dialogResults.replaceChildren();
  dialogInput.type = 'text';
  dialogInput.value = url.href;
  dialogInput.select();
  $('#dialog-count').textContent = 'Bağlantıyı seçip kopyalayabilirsiniz.';
 }
});
if ($('#reading-progress')) {
 let ticking = false;
 const update = () => {
  const prose = $('.prose');
  const start = prose.getBoundingClientRect().top + window.scrollY - window.innerHeight * .25;
  const range = Math.max(1, prose.offsetHeight - window.innerHeight * .5);
  const progress = Math.min(1, Math.max(0, (window.scrollY - start) / range));
  $('#reading-progress').style.transform = `scaleX(${progress})`;
  ticking = false;
 };
 window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, {passive:true});
 window.addEventListener('resize', update);
 update();
}
