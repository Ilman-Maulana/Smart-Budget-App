import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import pandas as pd
import sqlite3
import os
import pickle

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- LOAD MODEL DAN SCALER ---
try:
    model = tf.keras.models.load_model('travel_model.keras')
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    print("✅ Model AI dan Scaler Berhasil Dimuat!")
except Exception as e:
    print(f"❌ Error loading model/scaler: {e}")

DB_FILE = "travel_database.db"

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                destName TEXT, city TEXT, category TEXT, 
                time INTEGER, style TEXT, total REAL, 
                hotel REAL, transport REAL, food REAL, activity REAL
            )
        ''')
        try:
            cursor.execute("ALTER TABLE trips ADD COLUMN packing_weight REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        conn.commit()
init_db()

# ==========================================
# 1. API PREDIKSI HYBRID (ANN + TIKET RIIL)
# ==========================================
class TravelInput(BaseModel):
    DestName: str = "" # Tambahan untuk Lookup Harga Tiket
    Rating: float; Time_Minutes: float; Lat: float; Long: float
    Category_Budaya: bool; Category_Cagar_Alam: bool; Category_Pusat_Perbelanjaan: bool
    Category_Taman_Hiburan: bool; Category_Tempat_Ibadah: bool
    City_Jakarta: bool; City_Semarang: bool; City_Surabaya: bool; City_Yogyakarta: bool

@app.post("/api/v1/predict")
def predict_budget(data: TravelInput):
    try:
        # 1. Look-up Harga Tiket Riil dari CSV (Jika tersedia)
        real_ticket_price = 0.0
        if data.DestName:
            try:
                df_dest = pd.read_csv("tourism_with_images.csv")
                match = df_dest[df_dest['Place_Name'].str.lower() == data.DestName.lower()]
                if not match.empty:
                    real_ticket_price = float(match.iloc[0]['Price'])
            except Exception:
                pass # Abaikan jika data tidak match

        # 2. Siapkan data untuk model ANN
        exact_data = {
            'Rating': data.Rating,
            'Time_Minutes': data.Time_Minutes,
            'Category_Budaya': data.Category_Budaya,
            'Category_Cagar Alam': data.Category_Cagar_Alam,          
            'Category_Pusat Perbelanjaan': data.Category_Pusat_Perbelanjaan, 
            'Category_Taman Hiburan': data.Category_Taman_Hiburan,    
            'Category_Tempat Ibadah': data.Category_Tempat_Ibadah,    
            'City_Jakarta': data.City_Jakarta,
            'City_Semarang': data.City_Semarang,
            'City_Surabaya': data.City_Surabaya,
            'City_Yogyakarta': data.City_Yogyakarta
        }
        
        input_df = pd.DataFrame([exact_data])
        input_scaled = scaler.transform(input_df)
        prediction = model.predict(input_scaled)
        
        # 3. Penggabungan Hybrid: Prediksi ANN dasar + Harga Tiket Riil
        base_ann_budget = max(0.0, float(prediction[0][0]))
        final_budget = base_ann_budget + real_ticket_price
        
        return {
            "status": "success", 
            "estimated_budget": final_budget,
            "real_ticket_price": real_ticket_price
        }
    except Exception as e:
        print(f"❌ Error Detail Saat Prediksi: {e}")
        return {"status": "error", "message": str(e)}

# ==========================================
# 2. API REKOMENDASI & JURNAL TERDEKAT
# ==========================================
class RecInput(BaseModel):
    city: str = ""
    category: str = ""
    max_budget: float = 9999999.0
    min_rating: float = 0.0
    search_name: str = "" # VARIABEL BARU UNTUK MENCARI NAMA WISATA

@app.post("/api/v1/recommend")
def get_recommendation(data: RecInput):
    try:
        df = pd.read_csv("tourism_with_images.csv")
        
        # Buat Masker Filter Dinamis
        mask = pd.Series([True] * len(df))
        
        # Jika user mengetik nama wisata (Misal: Monas)
        if data.search_name:
            mask &= df['Place_Name'].str.contains(data.search_name, case=False, na=False)
        
        # Jika user memilih dari Dropdown
        if data.city:
            mask &= (df['City'].str.lower() == data.city.lower())
        if data.category:
            mask &= (df['Category'].str.lower() == data.category.lower())
            
        mask &= (df['Price'] <= data.max_budget)
        mask &= (df['Rating'] >= data.min_rating)
        
        filtered_df = df[mask]
        top_recommendations = filtered_df.sort_values(by='Rating', ascending=False).head(12)
        
        result = [{"name": r['Place_Name'], "city": r['City'], "category": r['Category'], "price": float(r['Price']), "rating": float(r['Rating']), "image": str(r['Image_URL'])} for _, r in top_recommendations.iterrows()]
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/trending")
def get_trending():
    try:
        df = pd.read_csv("tourism_with_images.csv")
        top_places = df[df['Rating'] >= 4.5].sample(6)
        result = [{"name": r['Place_Name'], "city": r['City'], "category": r['Category'], "price": float(r['Price']), "rating": float(r['Rating']), "image": str(r['Image_URL'])} for _, r in top_places.iterrows()]
        return {"status": "success", "data": result}
    except Exception as e: return {"status": "error", "message": str(e)}

def hitung_jarak_haversine(lat1, lon1, lat2, lon2):
    R = 6371 
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

class LocationInput(BaseModel):
    lat: float
    lng: float

@app.post("/api/v1/nearest")
def get_nearest_destinations(data: LocationInput):
    try:
        df = pd.read_csv("tourism_with_images.csv")
        df['distance_km'] = df.apply(lambda row: hitung_jarak_haversine(data.lat, data.lng, row['Lat'], row['Long']), axis=1)
        nearest_df = df.sort_values(by='distance_km').head(6)
        
        result = []
        for _, row in nearest_df.iterrows():
            result.append({
                "name": row['Place_Name'], "city": row['City'], "category": row['Category'],
                "price": float(row['Price']), "rating": float(row['Rating']),
                "image": str(row['Image_URL']), "distance": round(row['distance_km'], 1)
            })
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# 3. API DATABASE CRUD 
# ==========================================
class TripData(BaseModel):
    destName: str; city: str; category: str; time: int; style: str
    total: float; hotel: float; transport: float; food: float; activity: float
    packing_weight: float = 0.0

@app.get("/api/v1/trips")
def get_all_trips():
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        trips = [dict(row) for row in conn.cursor().execute("SELECT * FROM trips")]
    return {"status": "success", "data": trips}

@app.post("/api/v1/trips")
def save_trip(trip: TripData):
    with sqlite3.connect(DB_FILE) as conn:
        conn.cursor().execute('''
            INSERT INTO trips (destName, city, category, time, style, total, hotel, transport, food, activity, packing_weight)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (trip.destName, trip.city, trip.category, trip.time, trip.style, trip.total, trip.hotel, trip.transport, trip.food, trip.activity, trip.packing_weight))
        conn.commit()
    return {"status": "success"}

@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, trip: TripData):
    with sqlite3.connect(DB_FILE) as conn:
        conn.cursor().execute('''
            UPDATE trips SET 
            time=?, style=?, total=?, hotel=?, transport=?, food=?, activity=?, packing_weight=?
            WHERE id=?
        ''', (trip.time, trip.style, trip.total, trip.hotel, trip.transport, trip.food, trip.activity, trip.packing_weight, trip_id))
        conn.commit()
    return {"status": "success"}

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    with sqlite3.connect(DB_FILE) as conn:
        conn.cursor().execute("DELETE FROM trips WHERE id = ?", (trip_id,))
        conn.commit()
    return {"status": "success"}