import { articles } from './content.js';

const base = document.body.dataset.base;
const savedKey = 'dusunce-defteri-kaydedilenler';
const themeKey = 'dusunce-defteri-tema';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const normalize = (value) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const searchableText = article => normalize(`${article.title} ${article.excerpt} ${article.abstract} ${article.field} ${article.category} ${article.type} ${article.keywords.join(' ')} ${article.searchText || ''}`);
function readStorage(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
let saved;
try { const value = JSON.parse(readStorage(savedKey, '[]')); saved = new Set(Array.isArray(value) ? value.filter(slug => articles.some(a => a.slug === slug)) : []); } catch { saved = new Set(); }
let toastTimer;
function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove('visible'), 2700); }
function updateSaveButtons() {
 $$('[data-save]').forEach(button => {
  const active = saved.has(button.dataset.save);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? 'Çalışmayı okuma listesinden çıkar' : 'Çalışmayı okuma listesine ekle');
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
 $('meta[name="theme-color"]')?.setAttribute('content', '#172a3c');
}
applyTheme(readStorage(themeKey, 'light') === 'dark');
$$('[data-toggle-theme]').forEach(button => button.addEventListener('click', () => {
 const dark = !document.body.classList.contains('dark');
 applyTheme(dark);
 try { localStorage.setItem(themeKey, dark ? 'dark' : 'light'); } catch {}
}));

let activeFilter = 'Tümü';
function filterArchive() {
 const search = normalize($('#archive-search')?.value.trim() || '');
 let count = 0;
 $$('.article-card').forEach(card => {
  const article = articles.find(a => a.slug === card.dataset.slug);
  const match = (activeFilter === 'Tümü' || article.category === activeFilter) && searchableText(article).includes(search);
  card.hidden = !match;
  if (match) count++;
 });
 if ($('#empty-state')) $('#empty-state').hidden = count !== 0;
 if ($('#result-count')) $('#result-count').textContent = count === articles.length ? `${articles.length} çalışmanın tamamı` : `${articles.length} çalışmadan ${count} tanesi`;
 if ($('#filter-status')) $('#filter-status').textContent = `${count} çalışma gösteriliyor.`;
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
$$('[data-topic]').forEach(link => link.addEventListener('click', () => { $('#archive-search').value = ''; setFilter(link.dataset.topic); }));
$('#archive-search')?.addEventListener('input', filterArchive);
$('#reset-filters')?.addEventListener('click', () => { $('#archive-search').value = ''; setFilter('Tümü'); $('#archive-search').focus(); });

$$('[data-keyword]').forEach(link => link.addEventListener('click', () => { $('#archive-search').value = link.dataset.keyword; setFilter('Tümü'); }));
$('#archive-sort')?.addEventListener('change', event => {
 const mode = event.target.value;
 const cards = $$('.article-card');
 cards.sort((left, right) => {
  const a = articles.find(article => article.slug === left.dataset.slug);
  const b = articles.find(article => article.slug === right.dataset.slug);
  if (mode === 'title') return a.title.localeCompare(b.title, 'tr');
  if (mode === 'reading') return a.minutes - b.minutes || Number(left.dataset.order) - Number(right.dataset.order);
  return Number(left.dataset.order) - Number(right.dataset.order);
 });
 const grid = $('.article-grid');
 cards.forEach(card => grid.append(card));
 const count = cards.filter(card => !card.hidden).length;
 $('#filter-status').textContent = count + ' çalışma, ' + event.target.selectedOptions[0].textContent.toLocaleLowerCase('tr-TR') + ' gösteriliyor.';
});

const searchDialog = $('#search-dialog');
let savedMode = false;
let dialogTrigger;
function renderDialog() {
 const query = normalize($('#dialog-input').value.trim());
 const matches = articles.filter(a => (!savedMode || saved.has(a.slug)) && searchableText(a).includes(query));
 $('#dialog-results').innerHTML = matches.length ? matches.map(a => `<a class="dialog-result" href="${base}yazilar/${a.slug}/"><div><p>${escapeHtml(a.field)} · ${a.minutes} dk okuma${a.sample ? ' · Örnek metin' : ''}</p><h3>${escapeHtml(a.title)}</h3></div><span aria-hidden="true">↗</span></a>`).join('') : `<p class="dialog-empty">${savedMode && !saved.size ? 'Henüz kaydedilmiş çalışma bulunmuyor. Çalışmaların yanındaki ayraç simgesinden bir okuma listesi oluşturabilirsiniz.' : 'Arama ölçütlerine uygun çalışma bulunamadı. Farklı bir kavram deneyebilirsiniz.'}</p>`;
 $('#dialog-count').textContent = `${matches.length} çalışma`;
}
function openDialog(mode, trigger) {
 savedMode = mode;
 dialogTrigger = trigger;
 $('#dialog-input').type = 'search';
 $('#search-title').textContent = mode ? 'Okuma listesi' : 'Arşivde ara';
 $('#dialog-input').value = '';
 renderDialog();
 searchDialog.showModal();
 document.body.style.overflow = 'hidden';
 $('#dialog-input').focus();
}
$$('[data-open-search]').forEach(button => button.addEventListener('click', () => openDialog(false, button)));
$$('[data-open-saved]').forEach(button => button.addEventListener('click', () => openDialog(true, button)));
$('#dialog-input').addEventListener('input', renderDialog);
$$('[data-close-search]').forEach(button => button.addEventListener('click', () => searchDialog.close()));
searchDialog.addEventListener('click', event => { if (event.target === searchDialog) { const rect = searchDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) searchDialog.close(); } });
searchDialog.addEventListener('close', () => { document.body.style.overflow = ''; dialogTrigger?.focus(); });
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
  $('#dialog-results').replaceChildren();
  const input = $('#dialog-input'); input.type = 'text'; input.value = url.href; input.select();
  $('#dialog-count').textContent = 'Bağlantıyı seçip kopyalayabilirsiniz.';
  searchDialog.addEventListener('close', () => { input.type = 'search'; }, {once:true});
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
