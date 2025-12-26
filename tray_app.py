#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gazdálkodj Okosan - Autorun, Gyorsidító menu
konzol kikapcsolva ---felesleges---

System Tray Application
"""

import sys
import threading
import webbrowser
import time
from PIL import Image, ImageDraw
import pystray
from pystray import MenuItem as item

# Flask app import
from app import app

class BankingTrayApp:
    def __init__(self):
        self.flask_thread = None
        self.icon = None
        self.running = False
        self.server_url = "http://localhost:5000"
        
    def create_icon(self):
        """Ikon létrehozása (zöld háttér fehér Ft jellel)"""
        # 64x64 kép létrehozása
        width = 64
        height = 64
        
        # Zöld háttér
        image = Image.new('RGB', (width, height), '#10b981')
        draw = ImageDraw.Draw(image)
        
        # Fehér kör
        circle_margin = 8
        draw.ellipse(
            [circle_margin, circle_margin, width - circle_margin, height - circle_margin],
            fill='#ffffff'
        )
        
        # Zöld "Ft" felirat (egyszerűsített)
        # Bank épület szimbolizálása
        bank_width = 30
        bank_height = 20
        bank_x = (width - bank_width) // 2
        bank_y = (height - bank_height) // 2
        
        # Épület test
        draw.rectangle(
            [bank_x, bank_y + 5, bank_x + bank_width, bank_y + bank_height],
            fill='#10b981'
        )
        
        # Tető
        draw.polygon(
            [
                (bank_x - 3, bank_y + 5),
                (bank_x + bank_width // 2, bank_y - 2),
                (bank_x + bank_width + 3, bank_y + 5)
            ],
            fill='#047857'
        )
        
        return image
    
    def start_flask_server(self):
        """Flask szerver indítása külön szálon"""
        try:
            print("🚀 Flask szerver indítása...")
            app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
        except Exception as e:
            print(f"❌ Flask hiba: {e}")
    
    def open_browser(self, icon=None, item=None):
        """Böngésző megnyitása"""
        print("🌐 Böngésző megnyitása...")
        webbrowser.open(self.server_url)
    
    def quit_app(self, icon, item):
        """Kilépés"""
        print("👋 Kilépés...")
        self.running = False
        icon.stop()
        # Flask leállítása
        sys.exit(0)
    
    def setup_tray_icon(self):
        """System tray ikon beállítása"""
        # Ikon kép
        icon_image = self.create_icon()
        
        # Menü létrehozása
        menu = pystray.Menu(
            item(
                '🌐 Megnyitás böngészőben',
                self.open_browser,
                default=True
            ),
            item(
                '🔄 Újratöltés',
                lambda icon, item: self.open_browser(icon, item)
            ),
            pystray.Menu.SEPARATOR,
            item(
                'ℹ️ Info',
                lambda icon, item: print(f"📍 Elérhető: {self.server_url}")
            ),
            pystray.Menu.SEPARATOR,
            item(
                '❌ Kilépés',
                self.quit_app
            )
        )
        
        # System tray ikon
        self.icon = pystray.Icon(
            "Gazdálkodj Okosan",
            icon_image,
            "Gazdálkodj Okosan - Banking Játék\nKattints a megnyitáshoz!",
            menu
        )
    
    def run(self):
        """Alkalmazás indítása"""
        print("=" * 60)
        print("🏦 GAZDÁLKODJ OKOSAN - BANKING JÁTÉK")
        print("=" * 60)
        print()
        
        # Flask szerver indítása háttérben
        self.flask_thread = threading.Thread(target=self.start_flask_server, daemon=True)
        self.flask_thread.start()
        
        # Várunk kicsit a szerver indulására
        print("⏳ Szerver indítása...")
        time.sleep(2)
        
        print("✅ Szerver elindult!")
        print(f"📍 Elérhető: {self.server_url}")
        print()
        print("💡 HASZNÁLAT:")
        print("   • Tálca ikon → Jobb klikk → Menü")
        print("   • Dupla klikk → Böngésző megnyitása")
        print("   • 'Kilépés' menü → Program leállítása")
        print()
        print("🔔 Az alkalmazás fut a háttérben!")
        print("   (Keress egy zöld ikont az óra mellett)")
        print()
        
        # Böngésző automatikus megnyitása
        time.sleep(1)
        print("🌐 Böngésző automatikus megnyitása...")
        webbrowser.open(self.server_url)
        
        # System tray ikon beállítása
        self.setup_tray_icon()
        
        # Tray ikon futtatása (blocking)
        self.running = True
        self.icon.run()

def main():
    """Főprogram"""
    try:
        app_instance = BankingTrayApp()
        app_instance.run()
    except KeyboardInterrupt:
        print("\n\n👋 Kilépés (Ctrl+C)...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Hiba történt: {e}")
        print("\nNyomj Enter-t a kilépéshez...")
        input()
        sys.exit(1)

if __name__ == '__main__':
    main()
