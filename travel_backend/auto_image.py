import pandas as pd
import requests
import time
import urllib.parse

input_csv = "tourism_with_id.csv"   # Pastikan nama file CSV Anda benar
output_csv = "tourism_with_images.csv"

print(f"Membaca {input_csv}...")
df = pd.read_csv(input_csv)

image_urls = []
print("Memulai pencarian gambar dengan Identitas Resmi (User-Agent)...\n")

# KUNCI SUKSES: Memperkenalkan diri ke server Wikipedia
HEADERS = {
    'User-Agent': 'SmartTravelApp/1.0 (student_project@example.com) Python-Requests'
}

def get_wiki_image_2step(place_name):
    try:
        # LANGKAH 1: Cari judul artikel
        search_query = urllib.parse.quote(place_name)
        search_url = f"https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch={search_query}&utf8=&format=json"
        
        # Masukkan HEADERS ke dalam request
        search_res = requests.get(search_url, headers=HEADERS, timeout=10).json()
        
        if not search_res.get('query', {}).get('search'):
            return None
            
        best_title = search_res['query']['search'][0]['title']
        
        # LANGKAH 2: Ambil gambar utama
        summary_url = f"https://id.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(best_title)}"
        
        # Masukkan HEADERS ke dalam request
        summary_res = requests.get(summary_url, headers=HEADERS, timeout=10).json()
        
        if 'originalimage' in summary_res:
            return summary_res['originalimage']['source']
        elif 'thumbnail' in summary_res:
            return summary_res['thumbnail']['source']
            
    except Exception as e:
        return None
        
    return None

# Looping data CSV Anda
for index, row in df.iterrows():
    place_name = row['Place_Name'] # Sesuaikan dengan nama kolom di CSV Anda
    
    img_url = get_wiki_image_2step(place_name)
    
    if img_url:
        image_urls.append(img_url)
        print(f"[✅ Ditemukan] {place_name}")
    else:
        # Cadangan jika tempatnya memang belum punya artikel Wikipedia sama sekali
        fallback_url = f"https://picsum.photos/seed/{place_name.replace(' ', '')}/400/250"
        image_urls.append(fallback_url)
        print(f"[⚠️ Kosong] {place_name} -> Pakai Gambar Cadangan")
        
    # Jeda 0.5 detik
    time.sleep(0.5)

df['Image_URL'] = image_urls
df.to_csv(output_csv, index=False)
print(f"\n🎉 SELESAI! File baru tersimpan sebagai: {output_csv}")