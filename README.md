# Düşünce Defteri

Ontoloji, etik, epistemoloji, estetik ve zihin felsefesi alanlarında felsefe çalışmalarını paylaşmak için Türkçe bir akademik arşiv. Lacivert ve bordo tonları, serif metin düzeni, çalışma dizini ve araştırma alanlarından oluşur.

## Yerel kullanım

Node.js 20 veya üzeri yeterlidir; paket kurulumu gerekmez.

```sh
npm run dev
```

Site `http://127.0.0.1:4173` adresinde açılır. Kaynakları değiştirdikten sonra `npm run build` ile sayfaları yeniden oluşturun.

```sh
npm run check
npm run build
```

Yayımlanacak dosyalar `dist/` klasörüne üretilir. Bu klasör sürüm kontrolüne dahil edilmez.

## Çalışma ekleme ve düzenleme

Tüm çalışmalar `content/articles.json` dosyasındadır. Başlangıçtaki altı metin **örnek metin** olarak işaretlenmiştir. Özgün bir çalışma eklerken `sample` alanını `false` yapın; örnek etiketi otomatik kaldırılır. Mevcut adresleri korumak için bir çalışmanın `slug` alanını değiştirmeyin.

Her çalışma şu alanları içerir:

- `slug`: Küçük Latin harfleri ve kısa çizgilerle sayfa adresi.
- `title`, `excerpt`: Çalışma başlığı ve kısa açıklaması.
- `category`: `Varoluş`, `Etik`, `Bilgi`, `Estetik` veya `Zihin`. Bunlar arayüzde Ontoloji ve Varoluş, Etik ve Siyaset Felsefesi, Epistemoloji, Estetik ve Zihin Felsefesi olarak gösterilir.
- `type`, `method`: Çalışma türü ve izlenen yöntem.
- `abstract`, `keywords`: Özet ve anahtar kelimeler.
- `sections`: `title`, `paragraphs` ve isteğe bağlı `citations` alanlarıyla metin bölümleri. Uzun rehberlerde `paragraphs` yerine sıralı `blocks` kullanılabilir: `paragraph` ve `heading` için `text`; `list` için `ordered` ve `items`; `table` için `header` ve `rows`; `callout` için `title` ve `paragraphs` alanları bulunur.
- `references`: Her kaynak için benzersiz `id`, eksiksiz `citation` künyesi ve varsa `https` ile başlayan `url`. Kaynak belgede adres verilmeyen künyeler bağlantısız sunulur; `primary: true` ana metinleri yıldızla işaretler.
- `edition`, `referencesIntro`: İsteğe bağlı baskı bilgisi ve kaynakçanın giriş açıklaması.
- `document`: İsteğe bağlı PDF bilgileri (`file`, `pages`, `label`). Dosyayı `content/documents/` klasörüne ekleyin; derleme dosyayı siteye kopyalar ve indirme bağlantısını oluşturur.
- `sample`: Örnek metin etiketi.
- `featured`: Ana sayfada seçili çalışma. Tam olarak bir çalışma için `true` olmalıdır.

Bir bölümün `citations` dizisindeki kimlikler, aynı çalışmanın `references` dizisindeki kaynaklara karşılık gelmelidir. Derleme bu eşleşmeleri kontrol eder. Kaynakça, bölüm bağlantıları, okuma süresi, konu sayaçları ve ilgili çalışmalar otomatik oluşturulur.

## Arşiv ve okuma araçları

Başlık, tam metin, özet, anahtar kelime ve alan araması; alan filtreleri; başlığa veya okuma süresine göre sıralama; kavram dizini; tarayıcıda saklanan okuma listesi; açık/koyu tema; metin boyutu ayarı; bağlantı kopyalama ve yazdırma görünümü bulunur. Genel arama `Ctrl+K` veya `⌘K` ile açılır.

Her çalışmanın `yazilar/calisma-adresi/` biçiminde bağımsız bir sayfası vardır. Sayfalarda özet, anahtar kelimeler, içindekiler ve kaynakça sunulur. Kaynak bağlantıları ilgili eserin erişilebilir sürümüne gider. Başlangıç metinleri akademik sunum düzenini örnekler.

Okuma listesi ve tema yalnızca kullanılan tarayıcıda saklanır. Harici yazı tipi veya görsel yüklenmez; üyelik, izleme ve sunucuya veri gönderimi bulunmaz.

## Yayımlama

`main` dalına gönderilen değişiklikler `.github/workflows/pages.yml` ile GitHub Pages üzerinde yayımlanır. Deponun **Settings → Pages → Source** ayarı **GitHub Actions** olmalıdır. `dist/` klasörü başka bir statik sunucuda da barındırılabilir.

## Kaynak dosyalar

- `content/articles.json`: Çalışma metinleri ve bibliyografik bilgiler.
- `src/index.html`: Akademik arşiv ana sayfası.
- `src/styles.css`: Görsel düzen ve duyarlı tasarım.
- `src/app.js`: Arama, filtreleme, sıralama ve okuma araçları.
- `scripts/build.mjs`: Kaynakları doğrulayan ve statik sayfaları üreten derleme.
- `scripts/serve.mjs`: Yerel önizleme sunucusu.
