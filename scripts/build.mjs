import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const versionOf = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
const styleVersion = versionOf(await readFile(path.join(root, 'src/styles.css')));
const logoFile = 'ai-ethics-mark.svg';
const tabFile = 'ai-ethics-tab.png';
const versionedImage = async file => `assets/${file}?v=${versionOf(await readFile(path.join(root, 'src/images', file)))}`;
const [logoAsset, tabAsset] = await Promise.all([versionedImage(logoFile), versionedImage(tabFile)]);
const siteName = 'AI Ethics';
const defaultThemeColor = '#152e3c';
const articles = JSON.parse(await readFile(path.join(root, 'content/articles.json'), 'utf8'));
const { sources, videos } = JSON.parse(await readFile(path.join(root, 'content/library.json'), 'utf8'));
const { case: ethicsCase, research: ethicsResearchSlugs = [] } = JSON.parse(await readFile(path.join(root, 'content/ethics.json'), 'utf8'));
const ethicsPath = 'ai-ethics/';
const ethicsLabel = 'Etik Dosyaları';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fields = {
  'Yapay Zekâ': 'Yapay Zekâ', Zihin: 'Zihin Felsefesi', Varoluş: 'Ontoloji ve Varoluş',
  Etik: 'Etik ve Siyaset Felsefesi', Bilgi: 'Epistemoloji', Estetik: 'Estetik'
};
const shortFields = { Varoluş: 'Ontoloji', Bilgi: 'Epistemoloji' };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const imagePattern = /^[a-z0-9-]+\.(?:webp|png|jpe?g|avif)$/;
const languagePattern = /^[a-z]{2,3}(?:-[a-z0-9]+)*$/i;
const icons = {
  search: '<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.5 4.5"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  play: '<path d="m9 5 12 7-12 7Z" fill="currentColor" stroke="none"/>'
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
const header = (base, currentPage) => `<div class="masthead"><header class="site-header wrap">
  <a class="wordmark" href="${base}" aria-label="${siteName} ana sayfa">
    <img src="${base}${logoAsset}" alt="" width="34" height="34">
    <span lang="en">${siteName}</span>
  </a>
  <nav aria-label="Ana menü">
    <a href="${base}#yazilar">Araştırmalar</a><a href="${base}#makaleler">Makale Seçkisi</a><a href="${base}#videolar">Videolar</a><a href="${base}${ethicsPath}"${currentPage === ethicsPath ? ' aria-current="page"' : ''}>${ethicsLabel}</a><a href="${base}#hakkinda">Hakkında</a>
  </nav>
  <div class="header-actions">
    <button class="icon-button" type="button" data-open-search aria-label="Sitede ara" aria-keyshortcuts="Control+K Meta+K">${svg('search')}</button>
    <button class="icon-button" type="button" data-open-saved aria-label="Okuma listesi">${svg('bookmark')}</button>
    <button class="icon-button" type="button" data-toggle-theme aria-label="Açık temaya geç">${svg('sun')}</button>
  </div>
</header></div>`;
const footer = base => `<footer class="site-footer"><div class="wrap footer-layout">
  <a class="footer-name" href="${base}" lang="en">${siteName}</a><span>© ${new Date().getUTCFullYear()} <span lang="en">${siteName}</span></span>
</div></footer><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
const dialog = `<dialog id="search-dialog" aria-labelledby="search-title">
  <div class="dialog-top"><h2 id="search-title">Sitede ara</h2><button class="icon-button" data-close-search type="button" aria-label="Pencereyi kapat">${svg('close')}</button></div>
  <label class="dialog-search">${svg('search')}<span class="sr-only" id="dialog-input-label">Yazı, makale veya video ara</span><input id="dialog-input" type="search" placeholder="Başlık, konu veya yayıncı" autocomplete="off"></label>
  <div class="dialog-results" id="dialog-results"></div>
  <div class="dialog-hint">Kapatmak için <kbd>Esc</kbd><span id="dialog-count" role="status"></span></div>
</dialog>`;
const renderTemplate = (template, data) => template.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => {
  if (!Object.hasOwn(data, name)) throw new Error(`Bilinmeyen sayfa alanı: ${name}`);
  return data[name];
});

if (!articles.length || articles.filter(a => a.featured).length !== 1) throw new Error('Tam olarak bir seçili çalışma gerekli.');
const slugs = new Set();
for (const a of articles) {
  if (!slugPattern.test(a.slug) || slugs.has(a.slug)) throw new Error('Geçersiz veya yinelenen çalışma adresi.');
  slugs.add(a.slug);
  if (!a.title || !a.excerpt || !a.abstract || !a.sections?.length || !Object.hasOwn(fields, a.category) || !a.keywords?.length || !a.method) throw new Error(`Eksik çalışma alanı: ${a.slug}`);
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
  if (a.cover && !imagePattern.test(a.cover)) throw new Error(`Geçersiz kapak görseli: ${a.slug}`);
}

for (const entries of [sources, videos]) {
  const entrySlugs = new Set();
  for (const entry of entries) {
    if (!slugPattern.test(entry.slug) || entrySlugs.has(entry.slug)) throw new Error(`Geçersiz veya yinelenen içerik adresi: ${entry.slug}`);
    entrySlugs.add(entry.slug);
    if (!entry.title || !entry.excerpt || !entry.publisher || !entry.topic || !languagePattern.test(entry.language)) {
      throw new Error(`Eksik içerik bilgisi: ${entry.slug}`);
    }
  }
}
for (const source of sources) {
  if (new URL(source.url).protocol !== 'https:' || !Number.isInteger(source.year)) throw new Error(`Geçersiz makale bilgisi: ${source.slug}`);
}
for (const video of videos) {
  if (Boolean(video.youtubeId) === Boolean(video.file) ||
      (video.youtubeId && !/^[a-zA-Z0-9_-]{11}$/.test(video.youtubeId)) ||
      (video.file && !/^[a-z0-9-]+\.(?:mp4|webm)$/.test(video.file)) ||
      (video.captions && (!video.file || !/^[a-z0-9-]+\.vtt$/.test(video.captions))) ||
      (video.titleLanguage && !languagePattern.test(video.titleLanguage)) ||
      (video.poster && !imagePattern.test(video.poster))) {
    throw new Error(`Geçersiz video bilgisi: ${video.slug}`);
  }
}

const reviewSlugs = new Set();
for (const review of ethicsCase.reviews) {
  if (!slugPattern.test(review.slug) || reviewSlugs.has(review.slug) ||
      !review.title || !review.publisher || !review.type || !review.paragraphs?.length ||
      !review.citation || !review.source?.label || new URL(review.source.url).protocol !== 'https:' ||
      (review.language && !languagePattern.test(review.language))) {
    throw new Error(`Geçersiz etik incelemesi: ${review.slug}`);
  }
  reviewSlugs.add(review.slug);
}
const ethicsResearch = ethicsResearchSlugs.map(slug => {
  const article = articles.find(a => a.slug === slug);
  if (!article) throw new Error(`Etik Dosyaları için araştırma bulunamadı: ${slug}`);
  return article;
});

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const file of ['styles.css', 'favicon.svg']) await copyFile(path.join(root, 'src', file), path.join(output, 'assets', file));
const videoFiles = new Set(videos.flatMap(video => [video.file, video.captions].filter(Boolean)));
if (videoFiles.size) {
  await mkdir(path.join(output, 'videos'));
  for (const file of videoFiles) await copyFile(path.join(root, 'content/videos', file), path.join(output, 'videos', file));
}
const featured = articles.find(a => a.featured);
const images = new Set([logoFile, tabFile, featured.cover, ...videos.map(video => video.poster)].filter(Boolean));
for (const image of images) await copyFile(path.join(root, 'src/images', image), path.join(output, 'assets', image));
const articleIndex = articles.map(({ slug, title, excerpt, abstract, category, type, keywords, sections, sample }) => ({
  slug, title, excerpt, abstract, category, type, keywords, sample,
  field: fields[category], minutes: minutes({ sections }), searchText: sections.map(sectionText).join(' ')
}));
const content = `export const articles = ${JSON.stringify(articleIndex)};\nexport const library = ${JSON.stringify([
  ...sources.map(({ slug, title, topic, publisher, excerpt, language, year }) => ({ id: `makale-${slug}`, title, topic, publisher, excerpt, language, kind: 'Makale seçkisi', year })),
  ...videos.map(({ slug, title, topic, publisher, excerpt, language, titleLanguage }) => ({
    id: `video-${slug}`, title, topic, publisher, excerpt, language: titleLanguage || language, kind: 'Video'
  })),
  ...ethicsCase.reviews.map(review => ({
    path: `${ethicsPath}#${review.slug}`,
    title: review.title,
    topic: ethicsCase.title,
    publisher: review.publisher,
    excerpt: review.paragraphs.join(' '),
    language: review.language || 'tr',
    kind: `${ethicsLabel} · ${siteName}`
  }))
])};\n`;
await writeFile(path.join(output, 'assets/content.js'), content);
const appSource = await readFile(path.join(root, 'src/app.js'), 'utf8');
const app = appSource.replace('./content.js', `./content.js?v=${versionOf(content)}`);
const appVersion = versionOf(app);
await writeFile(path.join(output, 'assets/app.js'), app);
for (const a of articles.filter(a => a.document)) {
  await mkdir(path.join(output, 'documents'), { recursive: true });
  await copyFile(path.join(root, 'content/documents', a.document.file), path.join(output, 'documents', a.document.file));
}
await writeFile(path.join(output, '.nojekyll'), '');
const featuredHtml = `<article class="feature" aria-labelledby="featured-title">
  <a class="feature-link" href="./yazilar/${featured.slug}/" aria-labelledby="featured-title">
    <span class="feature-label eyebrow">Öne çıkan araştırma</span>
    ${featured.cover ? `<img class="feature-image" src="./assets/${featured.cover}" alt="">` : ''}
    <h2 id="featured-title">${escape(featured.title)}</h2>
    <p class="feature-summary">${escape(featured.excerpt)}</p>
    <p class="feature-meta">${escape(featured.type)} · ${minutes(featured)} dk okuma${featured.sample ? ' · Örnek metin' : ''}</p>
  </a>
</article>`;
const languageNames = new Intl.DisplayNames(['tr'], { type: 'language' });
const sourceCards = sources.map(source => `<article class="source-card" id="makale-${source.slug}">
  <div class="article-meta"><span>${escape(source.topic)}</span><span>${escape(source.publisher)}</span><span>${source.year}</span></div>
  <h3><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"><span lang="${escape(source.language)}">${escape(source.title)}</span><span class="sr-only"> (kaynak yeni sekmede açılır)</span></a></h3>
  <p>${escape(source.excerpt)}</p>
</article>`).join('\n');
const videoCards = videos.map(video => {
  const title = escape(video.title);
  const language = escape(video.language);
  const languageName = escape(languageNames.of(video.language));
  const poster = video.poster ? `./assets/${video.poster}` : '';
  const watchUrl = video.youtubeId ? `https://youtu.be/${video.youtubeId}` : `./videos/${video.file}`;
  const player = video.youtubeId
    ? `<a class="video-preview" href="${watchUrl}" target="_blank" rel="noopener noreferrer" data-youtube="${video.youtubeId}" data-video-title="${title}" aria-label="${title} videosunu izle">
        ${poster ? `<img src="${poster}" width="800" height="450" alt="" loading="lazy">` : ''}
        <span class="play-icon">${svg('play')}</span>
      </a>`
    : `<video controls playsinline preload="none" aria-label="${title}"${poster ? ` poster="${poster}"` : ''}>
        <source src="${watchUrl}" type="video/${path.extname(video.file).slice(1)}">
        ${video.captions ? `<track kind="captions" src="./videos/${video.captions}" srclang="${language}" label="${languageName}">` : ''}
        <a href="${watchUrl}">Video dosyasını aç</a>
      </video>`;
  return `<article class="video-card" id="video-${video.slug}">
    <div class="video-player">${player}</div>
    <div class="video-details">
      <div class="article-meta"><span>${escape(video.topic)}</span><span>${escape(video.publisher)}</span><span>${languageName}</span></div>
      <h3 lang="${escape(video.titleLanguage || video.language)}">${title}</h3><p>${escape(video.excerpt)}</p>
      ${video.youtubeId ? `<a class="text-button" href="${watchUrl}" target="_blank" rel="noopener noreferrer">YouTube’da izle<span class="sr-only"> (yeni sekmede açılır)</span></a>` : ''}
    </div>
  </article>`;
}).join('\n');
const cards = articles.map((a, i) => `<article class="article-card" data-slug="${a.slug}" data-order="${i}">
  <div class="entry-content">
    ${metadata(a)}<h3><a href="./yazilar/${a.slug}/">${escape(a.title)}</a></h3><p>${escape(a.excerpt)}</p>
    <div class="card-bottom"><span>${a.references.length} kaynak${a.sample ? ' · Örnek metin' : ''}</span></div>
  </div>
  ${saveButton(a)}
</article>`).join('\n');
const siteFragments = {
  SITE_NAME: siteName, ETHICS_LABEL: ethicsLabel, THEME_COLOR: defaultThemeColor,
  TAB_ASSET: tabAsset, STYLE_VERSION: styleVersion, APP_VERSION: appVersion
};
const home = await readFile(path.join(root, 'src/index.html'), 'utf8');
const areas = Object.entries(fields)
  .map(([category, label]) => ({ category, label, count: articles.filter(a => a.category === category).length }))
  .filter(area => area.count > 0);
const fragments = {
  ...siteFragments,
  HEADER: header('./'), FOOTER: footer('./'), DIALOG: dialog, FEATURED: featuredHtml,
  ARTICLE_CARDS: cards, SOURCES: sourceCards || '<p>Henüz makale eklenmedi.</p>',
  VIDEOS: videoCards || '<p>Henüz video eklenmedi.</p>',
  TOTAL: articles.length, SOURCE_COUNT: sources.length, VIDEO_COUNT: videos.length,
  FILTERS: areas.map(({ category }) => `<button class="filter" type="button" data-filter="${escape(category)}" aria-pressed="false">${escape(shortFields[category] || category)}</button>`).join(''),
  TOPICS: areas.map(({ category, label, count }) => `<a href="#yazilar" data-topic="${escape(category)}">${escape(label)} <span>${count}</span></a>`).join('')
};
await writeFile(path.join(output, 'index.html'), renderTemplate(home, fragments));

const researchHtml = ethicsResearch.length ? `<section class="ethics-research" id="arastirma-incelemeleri" aria-labelledby="ethics-research-title">
  <div class="section-heading"><h2 id="ethics-research-title">Araştırma incelemeleri</h2></div>
  <div class="source-list">${ethicsResearch.map(a => `<article class="source-card">
    ${metadata(a)}
    <h3><a href="../yazilar/${a.slug}/">${escape(a.title)}</a></h3>
    <p>${escape(a.excerpt)}</p>
  </article>`).join('')}</div>
</section>` : '';
const ethicsDate = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'UTC' });
const reviewsHtml = ethicsCase.reviews.map(review => `<section class="ethics-review" id="${review.slug}" aria-labelledby="${review.slug}-title">
  <p class="ethics-meta"><span class="section-label">${escape(review.type)}</span><span>${escape(review.publisher)}</span>${review.date
    ? `<time datetime="${escape(review.date)}">${ethicsDate.format(new Date(review.date))}</time>` : ''}</p>
  <h3 id="${review.slug}-title" lang="${escape(review.language || 'tr')}">${escape(review.title)}</h3>
  ${review.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}
  <p class="ethics-citation">${escape(review.citation)}</p>
  <a class="text-button" href="${escape(review.source.url)}" target="_blank" rel="noopener noreferrer">${escape(review.source.label)}<span class="sr-only"> (yeni sekmede açılır)</span></a>
</section>`).join('\n');
const caseHtml = `<article class="ethics-case" id="${escape(ethicsCase.slug)}" aria-labelledby="ethics-case-title">
  <header class="ethics-case-heading">
    <p class="eyebrow section-label">Vaka incelemesi · ${escape(ethicsCase.period)}</p>
    <h2 id="ethics-case-title">${escape(ethicsCase.title)}</h2>
    <p>${escape(ethicsCase.summary)}</p>
  </header>
  <div class="ethics-layout">
    <nav class="ethics-index" aria-label="Dosya içindekiler">
      <p class="eyebrow">Bu dosyada</p>
      ${ethicsCase.reviews.map(review => `<a href="#${review.slug}">${escape(review.publisher)}</a>`).join('')}
      <a href="#etik-sorular">Etik sorular</a>
      <a class="text-button ethics-video-link" href="../#video-hugging-face-olayi">İlgili sunumu izle</a>
    </nav>
    <div class="ethics-reviews">
      ${reviewsHtml}
      <section class="ethics-questions" id="etik-sorular" aria-labelledby="etik-sorular-title">
        <h3 id="etik-sorular-title">Olayın gündeme getirdiği etik sorular</h3>
        <dl>${ethicsCase.questions.map(question => `<div><dt>${escape(question.title)}</dt><dd>${escape(question.text)}</dd></div>`).join('')}</dl>
      </section>
    </div>
  </div>
</article>`;
const ethicsTemplate = await readFile(path.join(root, 'src/ai-ethics.html'), 'utf8');
await mkdir(path.join(output, ethicsPath), { recursive: true });
await writeFile(path.join(output, ethicsPath, 'index.html'), renderTemplate(ethicsTemplate, {
  ...siteFragments,
  HEADER: header('../', ethicsPath), FOOTER: footer('../'), DIALOG: dialog, RESEARCH: researchHtml, CASE: caseHtml
}));

for (const a of articles) {
  const dir = path.join(output, 'yazilar', a.slug);
  await mkdir(dir, { recursive: true });
  const related = articles.filter(b => b.slug !== a.slug).sort((b, c) => Number(c.category === a.category) - Number(b.category === a.category)).slice(0, 2);
  const references = a.references.length ? `<section class="references-section" id="kaynakca"><h2>Kaynakça${a.document ? ' ve ileri okuma' : ''}</h2>${a.referencesIntro ? `<p>${escape(a.referencesIntro)}</p>` : ''}<ol>${a.references.map(r => `<li id="kaynak-${r.id}"><p>${r.primary ? '<span class="primary-reference" aria-label="Ana metin">★</span> ' : ''}${escape(r.citation)}</p>${r.url ? `<a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.label || 'Kaynağı aç')}<span class="sr-only"> — ${escape(r.citation)}</span></a>` : ''}</li>`).join('')}</ol></section>` : '';
  const sections = a.sections.map((s, i) => {
    let context = s.title;
    const blocks = (s.blocks || []).map(block => { if (block.type === 'heading') context = block.text; return renderBlock(block, context); }).join('');
    return `<section id="bolum-${i + 1}"><h2>${escape(s.title)}</h2>${(s.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join('')}${blocks}${s.citations?.length ? `<p class="inline-citations">İlgili kaynaklar ${s.citations.map(id => { const r = a.references.find(ref => ref.id === id); return `<a href="#kaynak-${id}">${escape(r.citation.split('.')[0])} [${a.references.indexOf(r) + 1}]</a>`; }).join(' · ')}</p>` : ''}</section>`;
  }).join('');
  const document = a.document ? `<div class="document-banner"><div><span class="eyebrow">${escape(a.edition || 'Çalışma rehberi')}</span><p>${a.document.pages} sayfalık rehber · Tam metin, tablolar ve çalışma programı</p></div><a class="button button-primary" href="../../documents/${escape(a.document.file)}" download>${escape(a.document.label)}</a></div>` : '';
  const archiveLink = ethicsResearch.includes(a)
    ? `<a href="../../${ethicsPath}#arastirma-incelemeleri">${ethicsLabel}</a>`
    : '<a href="../../#yazilar">Çalışma arşivi</a>';
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${defaultThemeColor}"><title>${escape(a.title)} | ${siteName}</title><meta name="description" content="${escape(a.excerpt)}"><meta property="og:title" content="${escape(a.title)}"><meta property="og:site_name" content="${siteName}"><meta property="og:description" content="${escape(a.excerpt)}"><meta property="og:type" content="article"><meta property="og:locale" content="tr_TR"><link rel="icon" type="image/png" sizes="32x32" href="../../${tabAsset}"><link rel="stylesheet" href="../../assets/styles.css?v=${styleVersion}"><script type="module" src="../../assets/app.js?v=${appVersion}"></script></head>
<body data-base="../../" data-article="${a.slug}"${a.document ? ' class="study-guide"' : ''}><a class="skip-link" href="#icerik">İçeriğe geç</a><div class="reading-progress" id="reading-progress"></div>${header('../../')}
<main id="icerik" class="reader wrap"><nav class="breadcrumbs" aria-label="İçerik yolu"><a href="../../">Ana sayfa</a><span aria-hidden="true">/</span>${archiveLink}<span aria-hidden="true">/</span><span>${escape(fields[a.category])}</span></nav>
<div class="reader-heading">${metadata(a)}<h1>${escape(a.title)}</h1><p class="reader-deck">${escape(a.excerpt)}</p><div class="reader-controls"><span class="sample-label">${a.sample ? 'ÖRNEK METİN · KAVRAMSAL ÇALIŞMA' : escape(a.type)}</span><div><button type="button" class="icon-button" id="font-size" aria-label="Yazı boyutunu büyüt" aria-pressed="false"><span class="font-icon">Aa</span></button>${saveButton(a)}<button class="text-button" type="button" id="share-article">Bağlantıyı kopyala</button></div></div></div>
${document}<div class="reader-layout"><aside class="reader-sidebar"><nav class="table-of-contents" aria-label="İçindekiler"><span class="eyebrow">İÇİNDEKİLER</span><a href="#ozet">Özet ve anahtar kelimeler</a>${a.sections.map((s, i) => `<a href="#bolum-${i + 1}">${escape(s.title)}</a>`).join('')}${a.references.length ? '<a href="#kaynakca">Kaynakça</a>' : ''}</nav><section class="study-details" aria-labelledby="study-details-title"><h2 id="study-details-title">Çalışma bilgileri</h2><dl><div><dt>Alan</dt><dd>${escape(fields[a.category])}</dd></div><div><dt>Tür</dt><dd>${escape(a.type)}</dd></div><div><dt>Yöntem</dt><dd>${escape(a.method)}</dd></div><div><dt>Dil</dt><dd>Türkçe</dd></div><div><dt>Durum</dt><dd>${a.sample ? 'Örnek metin' : a.document ? escape(a.edition) : 'Çalışma metni'}</dd></div></dl></section></aside>
<article class="prose"><section class="abstract-block" id="ozet"><h2>Özet</h2><p>${escape(a.abstract)}</p>${keywords(a)}</section>${sections}${references}${a.sample ? '<p class="reader-disclaimer">Bu çalışma, arşivin akademik sunum yapısını örneklemek için hazırlanmış başlangıç metnidir.</p>' : ''}</article></div>
<section class="related-section" aria-labelledby="related-title"><span class="eyebrow">İLGİLİ ÇALIŞMALAR</span><h2 id="related-title">Arşivden diğer incelemeler</h2><div class="related-grid">${related.map(b => `<a href="../${b.slug}/"><span class="eyebrow">${escape(fields[b.category])}</span><h3>${escape(b.title)}</h3></a>`).join('')}</div></section></main>${footer('../../')}${dialog}</body></html>`;
  await writeFile(path.join(dir, 'index.html'), html);
}
await writeFile(path.join(output, '404.html'), `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${defaultThemeColor}"><title>Sayfa bulunamadı | ${siteName}</title><style>body{font:18px Georgia,serif;background:${defaultThemeColor};color:#f0f5f5;max-width:650px;margin:15vh auto;padding:32px}h1{font-size:40px;font-weight:400}a{color:#eda780}p{line-height:1.8}</style></head><body><p><span lang="en">${siteName}</span> / 404</p><h1>İstenen çalışma bulunamadı.</h1><p>Bağlantı değişmiş veya çalışma arşivden kaldırılmış olabilir.</p><a id="home" href="/">Çalışma arşivine dön</a><script>const p=location.pathname.split('/').filter(Boolean);document.getElementById('home').href=location.hostname.endsWith('.github.io')&&p.length?'/'+p[0]+'/':'/';</script></body></html>`);
console.log(`${articles.length} yazı, ${sources.length} makale bağlantısı ve ${videos.length} video dist/ klasörüne hazırlandı.`);
