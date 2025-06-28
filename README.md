# 🎓 Zonata QuizApp

A modern, full-stack quiz application built with React (Frontend) and Go (Backend), using MongoDB Atlas as the database.
## Project by

1. Vincent Valentino
2. William Zonata
3. Alvin Liandy
4. Aleshi Agung Wicaksono


## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Go + Gin + MongoDB Driver
- **Database**: MongoDB Atlas
- **Deployment**: Docker + Docker Compose

## Fitur
- Admin Panel
  1. Mengelola Soal
  2. Memberi izin kepada user non-mikroskil
  3. Mengtrack aktivitas admin
  4. Membuat modul dan submodul untuk dokumentasi

- Mock Test
  Quiz berbasis tes dengan maksimal 1000 poin, soal akan dipilih secara random dan juga opsi pilihannya akan diacak

- Time Quiz
  Quiz dengan timer dengan total 20 soal dalam 5 menit

- Result
  Untuk mengtrack peningkatan user dalam quiz

- Dokumentasi
  Materi online berbasis text untuk persiapan menghadapi mock test

- User
  1. Login sebagai mahasiswa, dengan NIM dan email mahasiswa
  2. Login Oauth dengan Facebook, Google, dan Github
  3. Fitur Forgot password
 
## Cara Menjalankan

# Docker (Perlu install docker)
- Git clone repo ini
- docker-compose up --build
- Frontend akan berjalan di localhost:5173 dan Backend akan berjalan di localhost:8080

# Manual (Perlu install pnpm, vite, dan go)
- Git clone repo ini
- Ketik "cd frontend && pnpm run dev" untuk menjalankan frontend
- Ketik "cd backend && go run main.go" untuk menjalankan backend
- Frontend akan berjalan di localhost:5173 dan Backend akan berjalan di localhost:8080
