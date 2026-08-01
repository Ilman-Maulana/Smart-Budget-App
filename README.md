# Smart Budget - Travel Predictive System

Sistem prediksi anggaran biaya perjalanan wisata berbasis Machine Learning yang dilengkapi dengan arsitektur Backend (FastAPI) dan Antarmuka Frontend yang interaktif. Proyek ini dikembangkan sebagai bagian dari DBS Foundation Coding Camp 2026.

## 🚀 Fitur Utama
- **Machine Learning Model:** Memprediksi estimasi anggaran biaya perjalanan menggunakan regresi berbasis TensorFlow/Keras.
- **Backend API (FastAPI):** Menyediakan RESTful endpoint untuk memproses data dan menghubungkan model AI ke sisi klien.
- **Frontend Interaktif (React.js):** Antarmuka pengguna yang responsif dan berpusat pada pengguna (*user-centric*) untuk memasukkan parameter perjalanan dan melihat hasil prediksi.
- **Database (SQLite):** Mengelola penyimpanan riwayat data secara lokal dengan struktur relasional yang efisien.

## 🛠️ Teknologi yang Digunakan
- **Bahasa Pemrograman:** Python, JavaScript, TypeScript
- **Framework & Libraries:** FastAPI, React.js, Pandas, TensorFlow/Keras
- **Database & Tools:** SQLite, Git, GitHub

## 📂 Struktur Proyek
- `/backend` : Berisi kode sumber API, skema database SQLite, dan model Machine Learning.
- `/frontend` : Berisi antarmuka pengguna berbasis React.js.

## ⚙️ Cara Instalasi dan Menjalankan Proyek (Local Development)

Pastikan Anda sudah menginstal **Python (3.8+)** dan **Node.js** di komputer Anda sebelum memulai.

### 1. Menjalankan Backend (FastAPI & Machine Learning)
Buka terminal/command prompt baru, lalu jalankan perintah berikut:

```bash
# Masuk ke direktori backend
cd backend

# (Opsional) Buat dan aktifkan virtual environment
python -m venv venv
# Untuk Windows: venv\Scripts\activate
# Untuk Mac/Linux: source venv/bin/activate

# Instal semua dependensi yang dibutuhkan
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --reload

```bash
# Masuk ke direktori frontend
cd frontend

# Instal dependensi Node.js
npm install

# Jalankan server pengembangan React
npm start
