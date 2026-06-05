# 🏦 Gazdálkodj Okosan - Pénztáros segítő

> 

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux-lightgrey.svg)]()

![Screenshot](https://github.com/BmintBe/Gazdalkodj_okosabban/tree/main/Screenshot)

---

## 📖 Leírás


- **Cél:** Segítség a pénztárat kezelő játékosnak!

- **Használat:** GO.exe futtatása, automatikussan megnyitja a böngészőt ha nem akkor a taskbar-ban megjelenik egy ikon ott tudod elindítani illetve leállítani programot
---

## ✨ Funkciók

### 🎮 Játék Mechanika
- ✅ **Többjátékos mód** - 2-6 játékos támogatása
- ✅ **Készpénz & Bankszámla** - Elkülönített pénzkezelés
- ✅ **Vásárlások** - Lakás, autó, bútor beszerzése
- ✅ **Hitelek** - Részletfizetés törlesztéssel
- ✅ **Biztosítások** - 5 különböző típus
- ✅ **START mező** - 500k/1M áthaladás/rálépés
- ✅ **Dual Currency** - HUF/EUR váltás

### 💻 Technikai
- ✅ **System Tray ikon** - Háttérben fut Windows tálcán
- ✅ **Auto mentés** - XML-be minden művelet után
- ✅ **Responsive design** - Mobil és desktop támogatás
- ✅ **Avatar választás** - 6 színű Monopoly bábu
- ✅ **WiFi multiplayer** - Többgépes játék LAN-on
- ✅ **EXE build** - Önálló futtatható alkalmazás

---

## 🚀 Gyors Start

### Python Verzió

```bash
# 1. Klónozás
git clone https://github.com/your-username/gazdalkodj-okosan.git
cd gazdalkodj-okosan

# 2. Függőségek telepítése
pip install -r requirements.txt

# 3. Indítás
python tray_app.py
```

### Windows EXE Verzió

```bash


# 1. Futtatás
GO.exe
```

---

## 📋 Követelmények

- **Python:** 3.8 vagy újabb
- **OS:** Windows 7+, macOS 10.12+, Linux
- **RAM:** 512 MB minimum
- **Hálózat:** Opcionális (multiplayer-hez)

### Python Csomagok

```
Flask==3.0.0
pystray==0.19.5
Pillow==10.1.0
pyinstaller==6.3.0  # EXE build-hez
```

---

## 🎯 Használat

### 1. Játékos Hozzáadása

```
1. "Új Játékos" gomb (jobb felső sarok)
2. Név megadása
3. Avatar szín választása
4. Hozzáadás
```

### 2. Játék Menete

**Tranzakciók:**
- Válassz játékost a bal oldali menüből
- **Accounts** tab - Pénzmozgások (készpénz/bankszámla)
- **Property** tab - Vásárlások (lakás, autó, bútor)
- **Insurance** tab - Biztosítások kezelése
- **History** tab - Tranzakciós előzmények

**Fizetési módok:**
- 💵 Készpénz
- 🏦 Bankszámla
- 💳 Hitel (lakás, autó)

### 3. System Tray

**Jobb klikk az óra melletti ikonra (🟢):**
- 🌐 Megnyitás böngészőben
- 🔄 Újratöltés
- ℹ️ Info
- ❌ Kilépés

---

## 🏠 Vásárolható Termékek

| Termék | Ár | Előleg | Hitel | Törlesztés |
|--------|-----|--------|-------|------------|
| **Lakás** | 10M Ft | 2M Ft | 8.1M Ft | 300k/hó (27 év) |
| **Autó** | 8M Ft | 1.5M Ft | 6.5M Ft | 130k/hó (5 év) |
| **Bútor** | 1.5M Ft | - | - | - |

---

## 🔒 Biztosítások

| Típus | Díj |
|-------|-----|
| Gyermek Jövő | 20k Ft/hó |
| Nyugdíj Megtakarítás | 30k Ft/hó |
| Otthonvédelem | 15k Ft/hó |
| Casco (autó kell) | 25k Ft/hó |
| Gyermek Jövő Fizetés | 500k Ft (egyszeri) |

---

## 📁 Projekt Struktúra

```
gazdalkodj-okosan/
├── tray_app.py              # System tray entry point
├── app.py                   # Flask backend
├── requirements.txt         # Python dependencies
├── templates/
│   └── banking_dashboard.html
├── static/
│   ├── style-banking-green.css
│   ├── script-banking.js
│   └── favicon.svg
└── README.md
```

---

## 🔧 Fejlesztés

### Lokális Futtatás (Development)

```bash
# Flask debug mode
python app.py
```


```

### Tesztelés

```bash
# Szerver elindítása
python tray_app.py

# Böngésző: http://localhost:5000
```

---

## 🌐 Hálózati Játék

### Szerver Gép

```bash
1. python tray_app.py
2. ipconfig (Windows) / ifconfig (Mac/Linux)
3. IP cím megjegyzése (pl: 192.168.1.100)
```

### Kliens Gép

```
Böngésző: http://192.168.1.100:5000
```

**Mindenki látja ugyanazt valós időben!**

---

## 🎨 Testreszabás

### Port Változtatás

```python
# tray_app.py - 20. sor
self.server_url = "http://localhost:5000"  # Port itt

# tray_app.py - 63. sor
app.run(host='0.0.0.0', port=5000)  # És itt
```

### Színek

```css
/* static/style-banking-green.css */
:root {
    --primary: #10b981;
    --primary-dark: #059669;
}
```

---

## 🚨 Hibaelhárítás

### "Module not found: pystray"

```bash
pip install pystray Pillow
```

### Böngésző nem nyílik meg

```bash
# Manuális megnyitás:
http://localhost:5000
```

### System tray ikon nem látszik

```
1. Várj 5 másodpercet
2. Ellenőrizd rejtett ikonok között (^ nyíl)
3. Windows: Taskbar Settings
```

### Windows Defender figyelmeztetés (EXE)

```
"További információ" → "Futtatás mindenképp"
(PyInstaller EXE-knél normális)
```

---


## 📊 Statisztikák

![GitHub stars](https://img.shields.io/github/stars/your-username/gazdalkodj-okosan?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/gazdalkodj-okosan?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/your-username/gazdalkodj-okosan?style=social)

---

## 🎯 Roadmap

- [ ] Felhasználóknak saját felület ami tudják követni a bankszámlájukat
- [ ] Mobil app verzió
- [ ] Több nyelv támogatás

---

**Készítve szeretettel 💚 | 2025**

