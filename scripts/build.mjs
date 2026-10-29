import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const articles = JSON.parse(await readFile(path.join(root, 'content/articles.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fields = { Varoluş: 'Ontoloji ve Varoluş', Etik: 'Etik ve Siyaset Felsefesi', Bilgi: 'Epistemoloji', Estetik: 'Estetik', Zihin: 'Zihin Felsefesi' };
const icons = {
  search: '<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.5 4.5"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  book: '<path d="M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3Zm18 0h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h5Z"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const blockText = block => [block.text, block.title, ...(block.paragraphs || []), ...(block.items || []), ...(block.rows || []).flat()].filter(Boolean).join(' ');
const sectionText = section => [section.title, ...(section.paragraphs || []), ...(section.blocks || []).map(blockText)].join(' ');
const minutes = a => Math.max(1, Math.ceil(a.sections.map(sectionText).join(' ').split(/\s+/).length / 180));
const renderBlock = (block, context) => {
  if (block.type === 'paragraph') return `<p>${escape(block.text)}</p>`;
  if (block.type === 'heading') return `<h3>${escape(block.text)}</h3>`;
  if (block.type === 'callout') return `<aside class="study-callout"><h4>${escape(block.title)}</h4>${block.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</aside>`;
  if (block.type === 'list') {
    const tag = block.ordered ? 'ol' : 'ul';
    return `<${tag} class="study-list">${block.items.map(item => `<li>${escape(item)}</li>`).join('')}</${tag}>`;
  }
  if (block.type === 'table') {
    const rows = block.header ? block.rows.slice(1) : block.rows;
    return `<div class="table-scroll" role="region" aria-label="${escape(context)} tablosu" tabindex="0"><table class="study-table${block.rows[0].length > 2 ? ' comparison-table' : ''}"><caption class="sr-only">${escape(context)}</caption>${block.header ? `<thead><tr>${block.rows[0].map(cell => `<th scope="col">${escape(cell)}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  throw new Error(`Bilinmeyen içerik bloğu: ${block.type}`);
};
const saveButton = a => `<button class="icon-button save-button" type="button" data-save="${a.slug}" aria-label="${escape(a.title)} çalışmasını kaydet" aria-pressed="false">${svg('bookmark')}</button>`;
const metadata = a => `<div class="article-meta"><span>${escape(fields[a.category])}</span><span>${escape(a.type)}</span><span>${minutes(a)} dk okuma</span></div>`;
const keywords = a => `<div class="keywords"><span>Anahtar kelimeler</span>${a.keywords.map(k => `<span>${escape(k)}</span>`).join('')}</div>`;
const header = base => `<div class="institutional-bar"><div class="wrap"><span>FELSEFE · KURAMSAL İNCELEME · ELEŞTİREL ARAŞTIRMA</span><span>BAĞIMSIZ ÇALIŞMA ARŞİVİ <b>TR</b></span></div></div><header class="site-header wrap"><a class="wordmark" href="${base}" aria-label="Düşünce Defteri ana sayfa"><span class="logo-mark">${svg('book')}</span><span>Düşünce Defteri<span class="wordmark-sub">FELSEFE ÇALIŞMALARI</span></span></a><nav aria-label="Ana menü"><a href="${base}#yazilar">Çalışmalar</a><a href="${base}#konular">Araştırma Alanları</a><a href="${base}#hakkinda">Yaklaşım</a></nav><div class="header-actions"><button class="icon-button" type="button" data-open-search aria-label="Çalışma ara">${svg('search')}</button><button class="icon-button" type="button" data-open-saved aria-label="Kaydedilen çalışmalar">${svg('bookmark')}</button><span class="action-divider"></span><button class="icon-button" type="button" data-toggle-theme aria-label="Koyu temaya geç">${svg('sun')}</button></div></header>`;
const footer = base => `<footer class="site-footer"><div class="wrap footer-layout"><div><a class="footer-name" href="${base}">Düşünce Defteri</a><p>Felsefi araştırmalar ve kuramsal incelemeler.</p></div><div class="footer-right"><a href="${base}#yazilar">Çalışma arşivine dön ↑</a><span>© ${new Date().getUTCFullYear()} Düşünce Defteri</span></div></div></footer><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
const dialog = `<dialog id="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">Arşivde ara</h2><button class="icon-button" data-close-search type="button" aria-label="Pencereyi kapat">${svg('close')}</button></div><label class="dialog-search">${svg('search')}<span class="sr-only">Çalışma başlığı, kavram veya alan ara</span><input id="dialog-input" type="search" placeholder="Başlık, anahtar kelime veya araştırma alanı…" autocomplete="off"></label><div class="dialog-results" id="dialog-results" aria-live="polite"></div><div class="dialog-hint">Kapatmak için <kbd>Esc</kbd><span id="dialog-count"></span></div></dialog>`;

if (!articles.length || articles.filter(a => a.featured).length !== 1) throw new Error('Tam olarak bir seçili çalışma gerekli.');
const slugs = new Set();
for (const a of articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || slugs.has(a.slug)) throw new Error('Geçersiz veya yinelenen çalışma adresi.');
  slugs.add(a.slug);
  if (!a.title || !a.excerpt || !a.abstract || !a.sections?.length || !fields[a.category] || !a.keywords?.length || !a.method) throw new Error(`Eksik çalışma alanı: ${a.slug}`);
  if (!Array.isArray(a.references)) throw new Error(`Kaynakça dizisi gerekli: ${a.slug}`);
  const ids = new Set();
  for (const reference of a.references) {
    if (!/^[a-z0-9-]+$/.test(reference.id) || ids.has(reference.id) || !reference.citation || (reference.url && new URL(reference.url).protocol !== 'https:')) throw new Error(`Geçersiz kaynak: ${a.slug}`);
    ids.add(reference.id);
  }
  for (const section of a.sections) {
    if (!section.title || !(section.paragraphs?.length || section.blocks?.length)) throw new Error(`Geçersiz bölüm: ${a.slug}`);
    for (const block of section.blocks || []) {
      if (['paragraph', 'heading'].includes(block.type) && !block.text) throw new Error(`Boş metin bloğu: ${a.slug}`);
      if (block.type === 'callout' && (!block.title || !block.paragraphs?.length)) throw new Error(`Boş açıklama kutusu: ${a.slug}`);
      if (block.type === 'list' && (!block.items?.length || block.items.some(item => !item))) throw new Error(`Boş liste: ${a.slug}`);
      if (block.type === 'table' && (!block.rows?.length || block.rows.some(row => row.length !== block.rows[0].length || row.some(cell => !cell)))) throw new Error(`Geçersiz tablo: ${a.slug}`);
      if (!['paragraph', 'heading', 'callout', 'list', 'table'].includes(block.type)) throw new Error(`Geçersiz içerik bloğu: ${a.slug}`);
    }
    for (const id of section.citations || []) if (!ids.has(id)) throw new Error(`Kaynak bulunamadı: ${id}`);
  }
  if (a.document && !/^[a-z0-9-]+\.pdf$/.test(a.document.file)) throw new Error(`Geçersiz PDF dosyası: ${a.slug}`);
}
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const file of ['styles.css', 'app.js', 'favicon.svg']) await copyFile(path.join(root, 'src', file), path.join(output, 'assets', file));
await writeFile(path.join(output, 'assets/content.js'), `export const articles = ${JSON.stringify(articles.map(({ sections, ...a }) => ({ ...a, field: fields[a.category], minutes: minutes({ sections }), searchText: sections.map(sectionText).join(' ') })))};\n`);
for (const a of articles.filter(a => a.document)) {
  await mkdir(path.join(output, 'documents'), { recursive: true });
  await copyFile(path.join(root, 'content/documents', a.document.file), path.join(output, 'documents', a.document.file));
}
await writeFile(path.join(output, '.nojekyll'), '');
const featured = articles.find(a => a.featured);
const featuredHtml = `<article class="featured-article">${metadata(featured)}<h2 id="featured-title"><a href="./yazilar/${featured.slug}/">${escape(featured.title)}</a></h2><p class="abstract-label">ÖZET</p><p class="featured-abstract">${escape(featured.abstract)}</p>${keywords(featured)}<div class="featured-bottom"><a class="text-button" href="./yazilar/${featured.slug}/">Tam metni incele <span aria-hidden="true">→</span></a><span class="sample-label">${featured.sample ? 'ÖRNEK METİN' : escape(featured.type)}</span></div></article>`;
const cards = articles.map((a, i) => `<article class="article-card" data-slug="${a.slug}" data-category="${escape(a.category)}" data-order="${i}"><span class="entry-number">${String(i + 1).padStart(2, '0')}</span><div class="entry-content">${metadata(a)}<h3><a href="./yazilar/${a.slug}/">${escape(a.title)}</a></h3><p>${escape(a.excerpt)}</p><div class="entry-keywords">${a.keywords.slice(0, 3).map(k => `<span>${escape(k)}</span>`).join('')}</div><div class="card-bottom"><a class="text-button" href="./yazilar/${a.slug}/">Metni incele →</a><span>${a.references.length} kaynak${a.sample ? ' · Örnek metin' : ''}</span></div></div>${saveButton(a)}</article>`).join('\n');
let home = await readFile(path.join(root, 'src/index.html'), 'utf8');
home = home.replace('{{HEADER}}', header('./')).replace('{{FOOTER}}', footer('./')).replace('{{DIALOG}}', dialog).replace('{{FEATURED}}', featuredHtml).replace('{{ARTICLE_CARDS}}', cards);
home = home.replaceAll('{{TOTAL}}', String(articles.length)).replaceAll('{{TOTAL_PADDED}}', String(articles.length).padStart(2, '0')).replace('{{SAMPLE_NOTE}}', articles.some(a => a.sample) ? '<div class="sample-note"><strong>İçerik notu</strong><p>“Örnek metin” etiketli çalışmalar, arşivin akademik sunum düzenini göstermek üzere hazırlanmış başlangıç içerikleridir.</p></div>' : '');
home = home.replaceAll('{{FIELD_COUNT}}', String(Object.keys(fields).length).padStart(2, '0'));
for (const [category, token] of [['Varoluş', 'VAROLUS'], ['Etik', 'ETIK'], ['Bilgi', 'BILGI'], ['Estetik', 'ESTETIK'], ['Zihin', 'ZIHIN']]) home = home.replaceAll('{{COUNT_' + token + '}}', String(articles.filter(a => a.category === category).length).padStart(2, '0'));
await writeFile(path.join(output, 'index.html'), home);

for (const a of articles) {
  const dir = path.join(output, 'yazilar', a.slug);
  await mkdir(dir, { recursive: true });
  const related = articles.filter(b => b.slug !== a.slug).sort((b, c) => Number(c.category === a.category) - Number(b.category === a.category)).slice(0, 2);
  const references = a.references.length ? `<section class="references-section" id="kaynakca"><h2>Kaynakça${a.document ? ' ve ileri okuma' : ''}</h2>${a.referencesIntro ? `<p>${escape(a.referencesIntro)}</p>` : ''}<ol>${a.references.map(r => `<li id="kaynak-${r.id}"><p>${r.primary ? '<span class="primary-reference" aria-label="Ana metin">★</span> ' : ''}${escape(r.citation)}</p>${r.url ? `<a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">Erişilebilir metin ↗<span class="sr-only"> — ${escape(r.citation)}</span></a>` : ''}</li>`).join('')}</ol></section>` : '';
  const sections = a.sections.map((s, i) => {
    let context = s.title;
    const blocks = (s.blocks || []).map(block => { if (block.type === 'heading') context = block.text; return renderBlock(block, context); }).join('');
    return `<section id="bolum-${i + 1}"><h2>${a.document ? '' : `<span class="section-number">${String(i + 1).padStart(2, '0')}.</span> `}${escape(s.title)}</h2>${(s.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join('')}${blocks}${s.citations?.length ? `<p class="inline-citations">İlgili kaynaklar: ${s.citations.map(id => { const r = a.references.find(ref => ref.id === id); return `<a href="#kaynak-${id}">${escape(r.citation.split('.')[0])} [${a.references.indexOf(r) + 1}]</a>`; }).join('; ')}</p>` : ''}</section>`;
  }).join('');
  const document = a.document ? `<div class="document-banner"><div><span class="eyebrow">${escape(a.edition || 'Çalışma rehberi')}</span><p>${a.document.pages} sayfalık rehber · Tam metin, tablolar ve çalışma programı</p></div><a class="button button-primary" href="../../documents/${escape(a.document.file)}" download>${escape(a.document.label)} <span aria-hidden="true">↓</span></a></div>` : '';
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#172a3c"><title>${escape(a.title)} | Düşünce Defteri</title><meta name="description" content="${escape(a.excerpt)}"><meta property="og:title" content="${escape(a.title)}"><meta property="og:description" content="${escape(a.excerpt)}"><meta property="og:type" content="article"><meta property="og:locale" content="tr_TR"><link rel="icon" href="../../assets/favicon.svg"><link rel="stylesheet" href="../../assets/styles.css"><script type="module" src="../../assets/app.js"></script></head>
<body data-base="../../" data-article="${a.slug}"${a.document ? ' class="study-guide"' : ''}><a class="skip-link" href="#icerik">İçeriğe geç</a><div class="reading-progress" id="reading-progress"></div>${header('../../')}
<main id="icerik" class="reader wrap"><nav class="breadcrumbs" aria-label="İçerik yolu"><a href="../../">Ana sayfa</a><span aria-hidden="true">/</span><a href="../../#yazilar">Çalışma arşivi</a><span aria-hidden="true">/</span><span>${escape(fields[a.category])}</span></nav>
<div class="reader-heading">${metadata(a)}<h1>${escape(a.title)}</h1><p class="reader-deck">${escape(a.excerpt)}</p><div class="reader-controls"><span class="sample-label">${a.sample ? 'ÖRNEK METİN · KAVRAMSAL ÇALIŞMA' : escape(a.type)}</span><div><button type="button" class="icon-button" id="font-size" aria-label="Yazı boyutunu büyüt" aria-pressed="false"><span class="font-icon">Aa</span></button>${saveButton(a)}<button class="text-button" type="button" id="share-article">Bağlantıyı kopyala ↗</button></div></div></div>
${document}<div class="reader-layout"><aside class="reader-sidebar"><nav class="table-of-contents" aria-label="İçindekiler"><span class="eyebrow">İÇİNDEKİLER</span><a href="#ozet">Özet ve anahtar kelimeler</a>${a.sections.map((s, i) => `<a href="#bolum-${i + 1}">${a.document ? '' : `<span>${String(i + 1).padStart(2, '0')}</span>`}${escape(s.title)}</a>`).join('')}${a.references.length ? '<a href="#kaynakca">Kaynakça</a>' : ''}</nav><section class="study-details" aria-labelledby="study-details-title"><h2 id="study-details-title">Çalışma bilgileri</h2><dl><div><dt>Alan</dt><dd>${escape(fields[a.category])}</dd></div><div><dt>Tür</dt><dd>${escape(a.type)}</dd></div><div><dt>Yöntem</dt><dd>${escape(a.method)}</dd></div><div><dt>Dil</dt><dd>Türkçe</dd></div><div><dt>Durum</dt><dd>${a.sample ? 'Örnek metin' : a.document ? escape(a.edition) : 'Çalışma metni'}</dd></div></dl></section></aside>
<article class="prose"><section class="abstract-block" id="ozet"><h2>Özet</h2><p>${escape(a.abstract)}</p>${keywords(a)}</section>${sections}${references}${a.sample ? '<p class="reader-disclaimer">Bu çalışma, arşivin akademik sunum yapısını örneklemek için hazırlanmış başlangıç metnidir.</p>' : ''}</article></div>
<section class="related-section" aria-labelledby="related-title"><span class="eyebrow">İLGİLİ ÇALIŞMALAR</span><h2 id="related-title">Arşivden diğer incelemeler</h2><div class="related-grid">${related.map(b => `<a href="../${b.slug}/"><span class="eyebrow">${escape(fields[b.category])}</span><h3>${escape(b.title)}</h3><span>Metni incele →</span></a>`).join('')}</div></section></main>${footer('../../')}${dialog}</body></html>`;
  await writeFile(path.join(dir, 'index.html'), html);
}
await writeFile(path.join(output, '404.html'), `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sayfa bulunamadı | Düşünce Defteri</title><style>body{font:18px Georgia,serif;background:#fcfcfb;color:#172a3c;max-width:650px;margin:15vh auto;padding:32px}h1{font-size:40px;font-weight:400}a{color:#851f32}p{line-height:1.8}</style></head><body><p>DÜŞÜNCE DEFTERİ / 404</p><h1>İstenen çalışma bulunamadı.</h1><p>Bağlantı değişmiş veya çalışma arşivden kaldırılmış olabilir.</p><a id="home" href="/">Çalışma arşivine dön →</a><script>const p=location.pathname.split('/').filter(Boolean);document.getElementById('home').href=location.hostname.endsWith('.github.io')&&p.length?'/'+p[0]+'/':'/';</script></body></html>`);
console.log(`${articles.length} çalışma, özetler ve kaynakçalar dist/ klasörüne hazırlandı.`);
