# Session To-Do List

> **Goal**: Energi manual, navbar ikon, dan landing compact tanpa scroll.
> **Status**: Active (3/4 Completed)
> **Created**: 2026-10-08

## Tasks

- [x] **#1** Tambahkan energi manual dan tes dependency clearing tanpa merusak kalkulator lama.
- [x] **#2** Ganti navbar menjadi ikon, rapikan spacing, dan perbaiki kedua tema.
- [ ] **#3** Verifikasi browser landing desktop/mobile dan seluruh tema, lalu hapus todolist.
- [x] **#4** Sebarkan ikon landing dalam batas layar dan tingkatkan tombol calculator/GitHub. Implementasi dan pemeriksaan statis selesai; verifikasi visual masuk #3.

## Current Focus

- **Active**: #3
- **Target Outcome**: Verifikasi browser desktop/mobile dan penghapusan todolist setelah verifikasi selesai.
- **Blocked**: Browser tool tidak tersedia karena safety classifier `claude-opus-5[1m]` unavailable. Tidak mengubah permission atau melewati pembatasan.
- **Verified**: Landing compact selesai; 64 tes lulus; syntax dan whitespace checks lulus; script landing dan reduced-motion diuji; komentar lama dipertahankan. Ukuran halaman, tema visual, dan click-through belum terverifikasi di browser.

## Completed

- #1: 63 tes kalkulator lulus, termasuk energi manual dan pembatalan override.
- #2: Navbar SVG semantik, tombol 44px, tema CSS variables, dan tes toggle lulus. Total 64 tes lulus. Verifikasi visual menunggu browser.
