# Düşünce Defteri

Felsefe çalışmalarını, denemeleri ve düşünce notlarını paylaşmak için Türkçe bir kişisel yayın sitesi. Kâğıt tonları, serif tipografi ve özgün vektör çizimlerle hazırlanmıştır.

## Yerel kullanım

Node.js 20 veya üzeri yeterlidir. Paket kurulumu gerekmez.

```sh
npm run dev
```

Site `http://127.0.0.1:4173` adresinde açılır. Kaynakları değiştirdikten sonra `npm run build` komutuyla sayfaları yeniden oluşturun.

```sh
npm run check
npm run build
```

Yayımlanacak dosyalar `dist/` klasörüne üretilir. Bu klasör otomatik oluşturulduğu için sürüm kontrolüne dahil edilmez.

## Yazı ekleme ve düzenleme

Tüm yazılar `content/articles.json` dosyasındadır. İlk sürümdeki altı metin **örnek çalışma** olarak işaretlenmiştir. Kendi çalışmalarınızı yayımlarken metinleri değiştirin ve ilgili yazının `sample` alanını `false` yapın. Örnek etiketleri otomatik kaldırılır.

Her yazı `slug`, `title`, `category`, `type`, `art`, `excerpt` ve `sections` alanlarını içerir. Bölümler `title` ve `paragraphs` alanlarından oluşur. `slug` için küçük Latin harfleri ve kısa çizgi kullanın. Bir yazının `featured` alanı `true` olmalıdır.

- Konular: `Varoluş`, `Etik`, `Bilgi`, `Estetik`.
- Çizimler: `arch`, `balance`, `orbit`, `window`, `sun`, `bridge`.
- Okuma süresi metnin uzunluğundan hesaplanır.
- Her yazının `yazilar/yazi-adresi/` biçiminde bağımsız sayfası vardır.

Yazı sayısı, konu sayaçları, arşiv kartları ve ilgili yazılar her derlemede otomatik güncellenir.

## Okuma araçları

Başlık, açıklama ve konu araması; konu filtreleri; tarayıcıda saklanan okuma listesi; açık/koyu tema; yazı boyutu ayarı; bağlantı kopyalama; okuma ilerleme göstergesi ve yazdırma görünümü bulunur. Genel arama `Ctrl+K` veya `⌘K` ile açılır.

Kaydedilen yazılar ve tema yalnızca kullanılan tarayıcıda saklanır. Üyelik, izleme veya sunucuya veri gönderimi yoktur. Google Fonts üzerinden iki yazı tipi yüklenir; bağlantı yoksa yerel serif ve sans yazı tipleri kullanılır. Tüm çizimler proje içindedir.

## Yayımlama

`main` dalına gönderilen değişiklikler `.github/workflows/pages.yml` iş akışı ile GitHub Pages üzerinde yayımlanır. Deponun **Settings → Pages → Source** ayarı **GitHub Actions** olmalıdır. Ayrıca `dist/` klasörü herhangi bir statik sunucuda barındırılabilir.

## Dosyalar

- `content/articles.json`: Yazı içerikleri.
- `src/index.html`: Ana sayfa şablonu.
- `src/styles.css`: Görünüm ve duyarlı düzen.
- `src/app.js`: Arama ve okuma araçları.
- `scripts/build.mjs`: Statik sayfaları üreten derleme.
- `scripts/serve.mjs`: Yerel önizleme sunucusu.
