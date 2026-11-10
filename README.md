# Detective Conan Wiki: redesign

Redesign tidak resmi dari [detectiveconanworld.com](https://www.detectiveconanworld.com).
Data diambil langsung dari MediaWiki API milik wiki, di-parse di server, lalu ditampilkan
dengan UI baru. Tidak ada database.

**Stack:** Next.js 16 (App Router, Turbopack, `cacheComponents: true`), React 19, Tailwind CSS v4
(lewat `@tailwindcss/postcss`), CSS Modules, cheerio untuk parsing HTML.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Variabel lingkungan (opsional):

| Nama | Fungsi |
|---|---|
| `WIKI_API_URL` | Mengganti alamat `api.php`, berguna untuk tes dengan wiki tiruan |
| `WIKI_DEBUG` | Mencetak log parser (infobox, thumbnail) |

`next build` memanggil wiki saat prerender, jadi build butuh koneksi ke wiki.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda: episode terbaru, berita, rilis, "Did you know" |
| `/wiki/[slug]` | Artikel apa pun: infobox, daftar isi, spoiler, galeri sidebar, previous/next |
| `/characters`, `/characters/[name]` | Grid karakter (load more) dan detail |
| `/anime`, `/anime/[season]` | Season dan daftar episode |
| `/manga`, `/manga/[range]` | Rentang volume dan chapter |
| `/movies`, `/music`, `/staff` | Film, lagu, staf dan pengisi suara |
| `/search?q=` | Pencarian |

## API

Semua GET dan mengembalikan JSON. Paginasi memakai `nextCursor`, kirim balik sebagai `?cursor=`.
Error berbentuk `{ "error": "..." }` dengan status 400/404/502/504.

| Endpoint | Parameter |
|---|---|
| `/api/home` | |
| `/api/pages/[slug]` | Artikel generik; field `infobox`, `chronology`, `gallery`, `cases`, `html` |
| `/api/characters` | `limit` (1-50), `cursor`, `category` |
| `/api/characters/[name]` | |
| `/api/search` | `q` (2-100 karakter), `limit`, `cursor` |
| `/api/anime`, `/api/anime/[season]` | |
| `/api/manga`, `/api/manga/[range]` | |
| `/api/movies`, `/api/music`, `/api/staff` | |

Detail lain ada di [WIKI-API.md](./WIKI-API.md).

## Struktur

```
app/          rute halaman dan /api/*; icon.svg = favicon
components/   UI (article, home, lists, characters, search, extra)
lib/wiki/     client, query ber-cache, parser (html, infobox, page, lists, extra, home)
types/        tipe data yang dikembalikan API
```

Alur data: `queries.ts` (`"use cache"` + `cacheLife`) -> `client.ts` (`wikiFetch`, satu-satunya
pintu ke wiki) -> `parse*.ts` (cheerio) -> tipe di `types/` -> halaman dan `/api/*`.

## Catatan penting

- **Cache:** halaman dan endpoint memakai `"use cache"`. Respons 4xx dari wiki di-cache sebagai nilai,
  5xx dilempar supaya tidak ikut ter-cache.
- **Pola halaman:** `params` dan `searchParams` adalah Promise. Halaman bersifat sinkron dan
  membungkus komponen async di `<Suspense>`.
- **Sanitasi HTML:** `normalizeHtml` (`lib/wiki/html.ts`) membuang elemen berbahaya, style inline
  dan event handler, menulis ulang link ke rute internal, dan menyembunyikan spoiler
  (`[data-spoiler]` plus tombol `[data-spoiler-toggle]`). Pola tata letak wiki yang bergantung pada
  style inline (mis. baris kartu cast) dideteksi sebelum style dibuang dan diberi class.
- **CSS Modules:** class bawaan wiki (`.people`, `.infobox-crime`, dst.) harus ditulis dengan
  `:global(...)` di `components/article/article.module.css`.
- **Tailwind v4:** gunakan `@tailwindcss/postcss` dengan `postcss.config.mjs`. Aturan
  `turbopack.rules["*.css"]` dengan `@tailwindcss/turbopack` menimpa penanganan CSS Modules,
  sehingga class modul menjadi `undefined`.
- **Halaman tidak ditemukan** tampil "Case not found" tetapi berstatus HTTP 200 (isi di-stream
  setelah header terkirim). Endpoint `/api/*` mengembalikan 404 sungguhan.
- **Markup wiki berubah:** bila tampilan kosong, bandingkan HTML terbaru dengan asumsi di
  `lib/wiki/parse*.ts` (tiap parser berkomentar soal strukturnya).

## Lisensi dan atribusi

Konten artikel dan gambar milik komunitas Detective Conan Wiki dan pemegang hak ciptanya.
Detective Conan adalah karya Gosho Aoyama, diterbitkan oleh Shogakukan. Proyek ini tidak berafiliasi
dengan pihak mana pun dan menautkan balik ke wiki sumber.