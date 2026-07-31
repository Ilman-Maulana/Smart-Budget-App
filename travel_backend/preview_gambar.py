import pandas as pd

# Baca CSV yang sudah ada gambarnya
df = pd.read_csv("tourism_with_images.csv")

# Mulai membuat file HTML
html_content = """
<html>
<head>
    <title>Cek Gambar Cepat</title>
    <style>
        body { font-family: sans-serif; background: #f3f4f6; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .card { background: white; padding: 10px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
        img { width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px; }
        h4 { margin: 0; font-size: 14px; color: #333; }
        p { margin: 5px 0 0 0; font-size: 11px; color: #888; word-break: break-all;}
    </style>
</head>
<body>
    <h2>Alat Cek Kualitas Gambar (Quality Control)</h2>
    <div class="grid">
"""

# Masukkan semua tempat dan gambarnya ke dalam grid
for index, row in df.iterrows():
    name = row['Place_Name']
    img = row['Image_URL']
    html_content += f"""
        <div class="card">
            <img src="{img}" loading="lazy">
            <h4>{name}</h4>
        </div>
    """

html_content += """
    </div>
</body>
</html>
"""

# Simpan sebagai file HTML
with open("preview.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("✅ File preview.html berhasil dibuat! Silakan buka file tersebut di browser Anda.")