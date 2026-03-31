# Dokumentasi Sistem Aplikasi E-Office RSUD DAYA Kota Makassar

## 1. Pendahuluan
Aplikasi ini merupakan **Sistem Manajemen Surat (E-Office) Berbasis Web** yang dirancang untuk memfasilitasi tata laksana pembuatan, pengarsipan, dan mekanisme persetujuan (approval) surat/dokumen di lingkungan RSUD Daya Kota Makassar. Sistem ini menggantikan proses administratif manual menjadi sistem terdigitalisasi dengan hierarki persetujuan berbasis jabatan (Role-Based Access Control).

---

## 2. Struktur Teknologi
Aplikasi E-Office ini dibangun di atas *stack* teknologi modern untuk memastikan reabilitas dan performa yang optimal:
- **Frontend Framework**: [Next.js](https://nextjs.org/) (berbasis React.js).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (pendekatan *utility-first* CSS).
- **Backend / Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (Database NoSQL dari Google) & **Firebase Authentication** untuk keamanan manajemen sesi akun.

---

## 3. UI/UX (User Interface & User Experience)
Aplikasi didesain untuk merepresentasikan instansi pelayanan kesehatan yang bersih, modern, dan tidak kaku.
- **Konsep Desain (Aesthetics)**: Menggunakan pendekatan minimalis, *glassmorphism* (efek translusen/buram di latar belakang), dan kartunisasi halus (kartu panel dengan gaya membulat/rounded).
- **Hierarki Warna**: 
   - Warna gradien cerah digunakan untuk membedakan konteks visual antar modul.
   - **Indikator Status**: 
      - 🟢 Hijau (Emerald/Green): Dokumen disetujui (*Approved*).
      - 🔴 Merah (Red/Rose): Dokumen ditolak (*Rejected*) / *Destructive actions*.
      - 🟡 Kuning (Amber/Orange): Menunggu tindak lanjut (*Pending*).
- **Tipografi**: Penggunaan font *sans-serif* modern yang meningkatkan tingkat keterbacaan data pada tabel yang padat.
- **Interaksi & Mikro-Animasi**: Diberikan efek transisi lembut (*hover transitions*), animasi perbesaran tombol, hingga letupan *toast notifikasi* saat pengguna berhasil menyimpan data, memberikan efek pengalaman sistem yang "hidup" dan responsif.
- **Responsivitas**: Desain sepenuhnya adaptif (`Mobile-first`). Sistem rotasi menu *sidebar* dapat disembunyikan menggunakan tombol *hamburger menu* pada resolusi layar tipis.

---

## 4. Rancangan Database (Firestore Schema)
Penyimpanan menggunakan paradigma NoSQL berbentuk **Collection** dan **Document**. Sistem ini bergantung pada 2 buah koleksi utama:

### a. Collection: `user`
Bertujuan menyimpan profil akun pegawai beserta relasinya dengan modul autentikasi.
- `id` *(Document ID/Auto)*: Identifier unik dari Document Firestore.
- `uid` *(String)*: Identifier otentikasi primer (terkoneksi langsung dengan Firebase Auth).
- `email` *(String)*: Email otomatis (format: `[NIP]@app.com`).
- `nama_user` *(String)*: Nama Lengkap pegawai.
- `nip_user` *(String)*: Nomor Induk Pegawai (bersifat *Unique*).
- `jabatan_user` *(String)*: Role kunci penggerak otorisasi aplikasi. Nilainya meliputi: `"direktur", "kabag yanmas", "kabag umum", "kabag keuangan", "dokter laboratorium", "pegawai"`.
- `alamat_user` *(String)*: Alamat tempat tinggal.
- `keterangan_user` *(String)*: Keterangan tambahan profil/tugas pegawai.
- `createdAt` / `updatedAt` *(Timestamp)*: Waktu inisialisasi dan penulisan terakhir data.

### b. Collection: `surat`
Core modul arsip dokumen, mencatat aliran metadata surat sejak proses *drafting* hingga di-ACC.
- `id` *(Document ID/Auto)*
- `no_surat` *(String)*: Penomoran resmi atau identifikasi surat.
- `ket` *(String)*: Jenis spesifikasi surat (misal: "SKBN", "SPY", dsb).
- `perihal_surat` *(String)*: Subjek/Topik dokumen.
- `unit` *(String)*: Depo unit penghasil surat (contoh: "umum", "yanmas", "keuangan").
- `tanggal_surat` *(String/Date)*: Tarikh arsip dicetak.
- `nama_pasien` / `nama_kedua` *(String)*: Nama pihak/klien yang berkepentingan.
- `status_approval` *(String)*: State dokumen; `"pending"`, `"approved"`, `"rejected"`.
- `approved_by` *(String)*: Nama penjabat spesifik yang mengesahkan dokumen.
- `approval_date` *(String/Timestamp)*: Merekam detik akurat dokumen disetujui/ditolak.
- `id_dokter` *(String)*: Rujukan ke ID User (jika pengesahan memerlukan tanda tangan spesifik dokter lab terkait).
- `createdAt` *(Timestamp)*.

---

## 5. Penjelasan Modul/Halaman Aplikasi (Workflow)

1. **Dashboard / Beranda Utama (`/`)**
   - **Tujuan**: Sebagai titik masuk pusat pemantauan (Command Center).
   - **Fitur Utama**: Menampilkan grid statistik akumulasi persuratan, pengguna, dan jumlah dokumen pending. Memuat aktivitas atau log surat secara *real-time*.
   - **Logic Khusus Approver**: Bagi user dengan jabatan _"Direktur", "Kabag", atau "Dokter"_, halaman ini memodifikasi antarmuka dengan menambahkan satu sesi tambahan blok "Surat Menunggu Persetujuan". Mereka bisa langsung melakukan ACC dari halaman *Home* ini tanpa berpindah tab.

2. **Halaman Akun User (`/akun-user`)**
   - **Tujuan**: Modul Admin/Data Master User.
   - **Fitur Utama**: Integrasi form CRUD (Tambah, Edit, Hapus) yang elegan via mode *Modal/Pop-up Window*. Pembuatan profil baru di sini menggunakan *trigger* `createUserWithEmailAndPassword` sehingga identitas sekaligus tertanam di _Firebase Auth_ milik institusi secara instan.

3. **Halaman Buat Surat (`/arsip2`)**
   - **Tujuan**: Menu terdistribusi per Unit Fungsional.
   - **Fitur Utama**: User dihadapkan dengan deretan kartu *dashboard* untuk memilah Unit Kerja sebelum membuat draf surat baru. Tersedia untuk Unit *Umum, Yanmas, Keuangan, Pelayanan Medik, Penunjang Medik, Keperawatan*, hingga *Laboratorium*. Pada masing-masing unit tersaji data kuantitatif berapa surat tervalidasi maupun murni di unit tersebut.

4. **Halaman Arsip Surat (`/arsip`)**
   - **Tujuan**: Bank arsip dokumen pasca-pengolahan dan pasca-persetujuan (Rekam jejak komprehensif logistik E-Office internal).

---

## 6. Daftar Dokumen Metodologi (SDLC) yang Lazim Disusun dalam Tahap Ini
Dalam proses perancangan sebuah *E-Office / Corporate Information System*, dokumentasi penyerta (selambat-lambatnya rampung pasca tahap rilis/UAT) meliputi:

1. **Software Requirement Specification (SRS)**: Menguraikan seluruh *User Story* atau diagram *Use Case*, mendefinisikan batas hak prerogatif seorang 'Direktur' dibanding staf 'Pegawai' biasa terhadap akses satu tombol surat.
2. **Entity Relationship Diagram (ERD) / Database Schema Design**: Berupa grafik skematis penggambaran letak integrasi otentikasi user dengan modul-modul turunan tabel Surat.
3. **Software Design Document (SDD) / Arsitektur Aplikasi**: Menjelaskan infrastruktur routing Next.js dan aliran pergerakan data ke Firestore via `snapshot/listeners`.
4. **Wireframe & Prototipe (Dokumen Fisik Standar UI/UX)**: Hasil layouting di *Figma* yang mendasari keputusan mengapa memakai Tailwind, termasuk palet *colors guidelines*.
5. **SOP Penggunaan Sistem (User Manual)**: Prosedur operasional cetak atau PDF tertulis untuk diajarkan langsung ke tenaga RSUD saat aplikasi dimigrasikan *(Training/Onboarding phase)*.
6. **Berita Acara / Laporan UAT (User Acceptance Testing)**: Dokumen penandatangan mutakhir pengetesan *Beta-testing*, mengkonfirmasi bahwa seluruh alur pengajuan dokumen medis, validasi dokter, hingga pengarsipan berhasil diverifikasi tanpa cela teknis (bugs).
