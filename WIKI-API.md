# Detective Conan Wiki redesign: peta rute

Semua data berasal dari MediaWiki API milik detectiveconanworld.com. Satu-satunya
pintu ke wiki adalah `lib/wiki/client.ts` (`wikiFetch`); semua query ada di
`lib/wiki/queries.ts`, dibungkus `"use cache"` (wajib karena `cacheComponents: true`).

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda (hero episode terbaru, berita, rilis, "Did you know") |
| `/wiki/[slug]` | Halaman wiki apa pun: infobox, daftar isi, spoiler, previous/next |
| `/characters`, `/characters/[name]` | Grid karakter (load more) dan detail |
| `/anime`, `/anime/[season]` | Daftar season dan episode |
| `/manga`, `/manga/[range]` | Rentang volume (mis. `101-110`) dan chapter |
| `/movies`, `/music`, `/staff` | Film, lagu, staf & pengisi suara |
| `/detectives` | Detective Picture Book: detektif favorit Aoyama per volume (cari, filter negara) |
| `/search?q=` | Pencarian |

## API (semua GET, JSON)

| Endpoint | Parameter |
|---|---|
| `/api/home` | |
| `/api/pages/[slug]` | Artikel generik. Field `gallery` = gambar tambahan infobox per judul seksi. Field `cases` berisi kotak kasus terstruktur (type, imageUrl, details, description) |
| `/api/characters` | `limit` (1-50), `cursor`, `category` |
| `/api/characters/[name]` | |
| `/api/search` | `q` (2-100 karakter), `limit`, `cursor` |
| `/api/anime`, `/api/anime/[season]` | |
| `/api/manga`, `/api/manga/[range]` | |
| `/api/movies`, `/api/music`, `/api/staff` | |
| `/api/detectives` | `{ total, entries[] }`: volume, detektif, pengarang, negara, rekomendasi, gambar |

Paginasi memakai `nextCursor` (opaque); kirim balik sebagai `?cursor=`.
Error: `{ "error": "..." }` dengan status 400/404/502/504.

## Catatan

- `WIKI_API_URL` (opsional) mengganti alamat API, berguna untuk tes dengan wiki tiruan.
- `next build` memanggil wiki saat prerender; build gagal bila wiki tidak terjangkau.
- Halaman tidak ditemukan tampil "Case not found" tetapi berstatus HTTP 200
  (isi di-stream setelah header terkirim). Endpoint `/api/*` mengembalikan 404 sungguhan.
- Parser bergantung pada markup wiki. Bila tampilan tiba-tiba kosong, bandingkan
  HTML terbaru dengan sampel di `lib/wiki/parse*.ts` (tiap parser berkomentar soal strukturnya).
