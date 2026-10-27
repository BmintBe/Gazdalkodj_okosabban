#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gazdálkodj Okosan - alap

"""

from flask import Flask, render_template, jsonify, request, send_file, abort
from datetime import datetime
import json
import os
import io
import secrets
import socket
import qrcode
import xml.etree.ElementTree as ET
from xml.dom import minidom

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gazdalkodj-okosan-2025'

PORT = 5000

# True: a bankos felület (főoldal + /api/...) csak a bankos gépéről érhető el.
# A telefonok csak a saját QR-linkjüket nyithatják meg.
# Ha más gépről is bankoskodni akartok, állítsd False-ra.
BANK_LOCAL_ONLY = True


def get_local_ip():
    """A gép helyi hálózati IP címe (amit a telefon is elér)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Nem küld adatot, csak kiválasztja a megfelelő hálózati kártyát
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def new_token():
    return secrets.token_urlsafe(6)

# Játék adatok
class GameData:
    def __init__(self):
        self.players = []
        self.transactions = []
        self.next_id = 1
        self.currency = 'HUF'
        self.save_file = 'game_data.xml'
        
        # Játékszabály beállítások
        self.settings = {
            'HUF': {
                'symbol': 'Ft',
                'start_cash': 238000,
                'start_account': 3000000,
                'start_pass_through': 500000,
                'start_landing': 1000000,
                'apartment_cash': 9500000,
                'apartment_installment': 11000000,
                'apartment_down': 2000000,
                'apartment_monthly': 90000,
                'car_cash': 7000000,
                'car_installment': 7960000,
                'car_down': 2500000,
                'car_monthly': 130000,
                'insurances': {
                    'child_future': {'cost': 180000, 'payout': 1500000},
                    'pension': {'cost': 180000},
                    'home_guard': {'cost': 30000},
                    'casco': {'cost': 50000}
                }
            },
            'EUR': {
                'symbol': '€',
                'start_cash': 18000,
                'start_account': 10000,
                'start_pass_through': 2000,
                'start_landing': 4000,
                'apartment_cash': 30000,
                'apartment_installment': 35000,
                'apartment_down': 15000,
                'apartment_monthly': 500,
                'car_cash': 25000,
                'car_installment': 27500,
                'car_down': 6500,
                'car_monthly': 500,
                'insurances': {
                    'child_future': {'cost': 600, 'payout': 5000},
                    'pension': {'cost': 600},
                    'home_guard': {'cost': 100},
                    'casco': {'cost': 160}
                }
            }
        }
    
    def add_player(self, name, avatar='green'):
        settings = self.settings[self.currency]
        player = {
            'id': self.next_id,
            'token': new_token(),
            'name': name,
            'avatar': avatar,
            'cash': settings['start_cash'],
            'account': settings['start_account'],
            'hasApartment': False,
            'hasCar': False,
            'hasFurniture': False,
            'insurances': {
                'childFuture': False,
                'pension': False,
                'homeGuard': False,
                'casco': False,
                'childFuturePaid': False
            },
            'loans': {
                'apartment': {'active': False, 'remaining': 0},
                'car': {'active': False, 'remaining': 0}
            }
        }
        self.players.append(player)
        self.next_id += 1
        return player
    
    def remove_player(self, player_id):
        self.players = [p for p in self.players if p['id'] != player_id]
        
    def get_player(self, player_id):
        return next((p for p in self.players if p['id'] == player_id), None)
    
    def get_player_by_token(self, token):
        return next((p for p in self.players if p.get('token') == token), None)
    
    def update_player(self, player_id, updates):
        player = self.get_player(player_id)
        if player:
            # Az azonosító és a QR token nem írható felül
            updates = {k: v for k, v in updates.items() if k not in ('id', 'token')}
            player.update(updates)
            return player
        return None
    
    def add_transaction(self, player_name, cash_amount, account_amount, description):
        transaction = {
            'id': len(self.transactions) + 1,
            'playerName': player_name,
            'cashAmount': cash_amount,
            'accountAmount': account_amount,
            'description': description,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        }
        self.transactions.append(transaction)
        if len(self.transactions) > 50:
            self.transactions = self.transactions[-50:]
        return transaction
    
    def save_data(self):
        """Adatok mentése XML fájlba"""
        try:
            # Root elem létrehozása
            root = ET.Element('game')
            
            # Alapadatok
            ET.SubElement(root, 'currency').text = self.currency
            ET.SubElement(root, 'next_id').text = str(self.next_id)
            
            # Játékosok
            players_elem = ET.SubElement(root, 'players')
            for player in self.players:
                player_elem = ET.SubElement(players_elem, 'player')
                ET.SubElement(player_elem, 'id').text = str(player['id'])
                ET.SubElement(player_elem, 'token').text = player.get('token') or new_token()
                ET.SubElement(player_elem, 'name').text = player['name']
                ET.SubElement(player_elem, 'avatar').text = player.get('avatar', 'green')
                ET.SubElement(player_elem, 'cash').text = str(player['cash'])
                ET.SubElement(player_elem, 'account').text = str(player['account'])
                ET.SubElement(player_elem, 'hasApartment').text = str(player['hasApartment'])
                ET.SubElement(player_elem, 'hasCar').text = str(player['hasCar'])
                ET.SubElement(player_elem, 'hasFurniture').text = str(player['hasFurniture'])
                
                # Biztosítások
                insurances_elem = ET.SubElement(player_elem, 'insurances')
                for key, value in player['insurances'].items():
                    ET.SubElement(insurances_elem, key).text = str(value)
                
                # Hitelek
                loans_elem = ET.SubElement(player_elem, 'loans')
                for loan_type, loan_data in player['loans'].items():
                    loan_elem = ET.SubElement(loans_elem, loan_type)
                    ET.SubElement(loan_elem, 'active').text = str(loan_data['active'])
                    ET.SubElement(loan_elem, 'remaining').text = str(loan_data['remaining'])
            
            # Tranzakciók
            transactions_elem = ET.SubElement(root, 'transactions')
            for trans in self.transactions:
                trans_elem = ET.SubElement(transactions_elem, 'transaction')
                ET.SubElement(trans_elem, 'id').text = str(trans['id'])
                ET.SubElement(trans_elem, 'playerName').text = trans['playerName']
                ET.SubElement(trans_elem, 'cashAmount').text = str(trans['cashAmount'])
                ET.SubElement(trans_elem, 'accountAmount').text = str(trans['accountAmount'])
                ET.SubElement(trans_elem, 'description').text = trans['description']
                ET.SubElement(trans_elem, 'timestamp').text = trans['timestamp']
            
            # Szép formázás
            xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
            
            # Fájlba írás
            with open(self.save_file, 'w', encoding='utf-8') as f:
                f.write(xml_str)
            
            print(f"✅ Adatok mentve XML-be: {len(self.players)} játékos, {len(self.transactions)} tranzakció")
        except Exception as e:
            print(f"❌ XML mentési hiba: {e}")
    
    def load_data(self):
        """Adatok betöltése XML fájlból"""
        try:
            if not os.path.exists(self.save_file):
                print("ℹ️ Nincs mentett XML adat, új játék indul")
                return
            
            # XML parse
            tree = ET.parse(self.save_file)
            root = tree.getroot()
            
            # Alapadatok
            self.currency = root.find('currency').text
            self.next_id = int(root.find('next_id').text)
            
            # Játékosok
            self.players = []
            players_elem = root.find('players')
            if players_elem is not None:
                for player_elem in players_elem.findall('player'):
                    player = {
                        'id': int(player_elem.find('id').text),
                        # Régi mentésekben nincs token -> generálunk
                        'token': (player_elem.findtext('token') or new_token()),
                        'name': player_elem.find('name').text,
                        'avatar': player_elem.find('avatar').text,
                        'cash': int(player_elem.find('cash').text),
                        'account': int(player_elem.find('account').text),
                        'hasApartment': player_elem.find('hasApartment').text == 'True',
                        'hasCar': player_elem.find('hasCar').text == 'True',
                        'hasFurniture': player_elem.find('hasFurniture').text == 'True',
                        'insurances': {},
                        'loans': {}
                    }
                    
                    # Biztosítások
                    insurances_elem = player_elem.find('insurances')
                    if insurances_elem is not None:
                        for ins in insurances_elem:
                            player['insurances'][ins.tag] = ins.text == 'True'
                    
                    # Hitelek
                    loans_elem = player_elem.find('loans')
                    if loans_elem is not None:
                        for loan in loans_elem:
                            player['loans'][loan.tag] = {
                                'active': loan.find('active').text == 'True',
                                'remaining': int(loan.find('remaining').text)
                            }
                    
                    self.players.append(player)
            
            # Tranzakciók
            self.transactions = []
            transactions_elem = root.find('transactions')
            if transactions_elem is not None:
                for trans_elem in transactions_elem.findall('transaction'):
                    trans = {
                        'id': int(trans_elem.find('id').text),
                        'playerName': trans_elem.find('playerName').text,
                        'cashAmount': int(trans_elem.find('cashAmount').text),
                        'accountAmount': int(trans_elem.find('accountAmount').text),
                        'description': trans_elem.find('description').text,
                        'timestamp': trans_elem.find('timestamp').text
                    }
                    self.transactions.append(trans)
            
            print(f"✅ XML adatok betöltve: {len(self.players)} játékos, {len(self.transactions)} tranzakció")
        except Exception as e:
            print(f"❌ XML betöltési hiba: {e}")
            print("ℹ️ Új játék indul")

# Globális game adatok
game = GameData()
game.load_data()  # Adatok betöltése indításkor


@app.before_request
def restrict_bank_to_local():
    """A bankos felületet csak a bankos gépéről lehessen használni."""
    if not BANK_LOCAL_ONLY:
        return
    path = request.path
    public = (path.startswith('/jatekos/') or path.startswith('/api/jatekos/')
              or path.startswith('/static/'))
    if public:
        return
    if request.remote_addr not in ('127.0.0.1', '::1'):
        abort(403)


# ---------- QR kódos játékos nézet ----------

def player_url(player):
    return f"http://{get_local_ip()}:{PORT}/jatekos/{player['token']}"


@app.route('/qr-kodok')
def qr_codes_page():
    """Nyomtatható oldal az összes játékos QR kódjával (csak bankos gép)."""
    ip = get_local_ip()
    players = [{'name': p['name'], 'avatar': p.get('avatar', 'green'),
                'token': p['token'], 'url': player_url(p)} for p in game.players]
    return render_template('qr_codes.html', players=players, ip=ip,
                           no_network=(ip == '127.0.0.1'))


@app.route('/api/qr-codes')
def qr_codes_data():
    """A dashboard QR nézetének adatai (csak bankos gép)."""
    ip = get_local_ip()
    return jsonify({
        'ip': ip,
        'no_network': ip == '127.0.0.1',
        'players': [{'name': p['name'], 'avatar': p.get('avatar', 'green'),
                     'url': player_url(p), 'img': f"/qr/{p['token']}.png"}
                    for p in game.players]
    })


@app.route('/qr/<token>.png')
def qr_image(token):
    """Egy játékos QR kódja PNG képként."""
    player = game.get_player_by_token(token)
    if not player:
        abort(404)
    img = qrcode.make(player_url(player), box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')


@app.route('/jatekos/<token>')
def player_view(token):
    """Telefonos, csak olvasható nézet egy játékosnak."""
    if not game.get_player_by_token(token):
        return render_template('player_view.html', token=token, missing=True), 404
    return render_template('player_view.html', token=token, missing=False)


@app.route('/api/jatekos/<token>')
def player_view_data(token):
    """A telefonos nézet adatai: csak az adott játékosé."""
    player = game.get_player_by_token(token)
    if not player:
        return jsonify({'error': 'Játékos nem található'}), 404
    settings = game.settings[game.currency]
    safe = {k: v for k, v in player.items() if k != 'token'}
    own_tx = [t for t in reversed(game.transactions) if t['playerName'] == player['name']][:15]
    return jsonify({
        'player': safe,
        'currency': game.currency,
        'symbol': settings['symbol'],
        'transactions': own_tx
    })


@app.route('/')
def index():
    """Főoldal"""
    return render_template('banking_dashboard.html')


@app.route('/api/players', methods=['GET'])
def get_players():
    """Összes játékos lekérése"""
    return jsonify({
        'players': game.players,
        'currency': game.currency,
        'settings': game.settings[game.currency]
    })


@app.route('/api/players', methods=['POST'])
def add_player():
    """Új játékos hozzáadása"""
    data = request.json
    name = data.get('name', '').strip()
    avatar = data.get('avatar', 'green')
    
    if not name:
        return jsonify({'error': 'A név megadása kötelező!'}), 400
    
    if any(p['name'] == name for p in game.players):
        return jsonify({'error': f'{name} már szerepel a játékosok között!'}), 400
    
    player = game.add_player(name, avatar)
    game.save_data()  # Automatikus mentés
    return jsonify(player), 201


@app.route('/api/players/<int:player_id>', methods=['DELETE'])
def delete_player(player_id):
    """Játékos törlése"""
    player = game.get_player(player_id)
    if not player:
        return jsonify({'error': 'Játékos nem található!'}), 404
    
    game.remove_player(player_id)
    game.save_data()  # Automatikus mentés
    return jsonify({'message': 'Játékos törölve'}), 200


@app.route('/api/players/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    """Játékos adatainak frissítése"""
    data = request.json
    player = game.update_player(player_id, data)
    
    if not player:
        return jsonify({'error': 'Játékos nem található!'}), 404
    
    game.save_data()  # Automatikus mentés
    return jsonify(player), 200


@app.route('/api/transaction', methods=['POST'])
def add_transaction():
    """Tranzakció hozzáadása"""
    data = request.json
    player_id = data.get('player_id')
    cash_amount = data.get('cash_amount', 0)
    account_amount = data.get('account_amount', 0)
    description = data.get('description', 'Tranzakció')
    
    player = game.get_player(player_id)
    if not player:
        return jsonify({'error': 'Játékos nem található!'}), 404
    
    # Egyenleg frissítése
    game.update_player(player_id, {
        'cash': player['cash'] + cash_amount,
        'account': player['account'] + account_amount
    })
    
    # Tranzakció rögzítése
    transaction = game.add_transaction(player['name'], cash_amount, account_amount, description)
    
    game.save_data()  # Automatikus mentés
    
    return jsonify({
        'player': game.get_player(player_id),
        'transaction': transaction
    }), 200


@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Tranzakciók lekérése"""
    return jsonify(list(reversed(game.transactions[-30:])))


@app.route('/api/currency', methods=['GET'])
def get_currency():
    """Aktuális pénznem lekérése"""
    return jsonify({'currency': game.currency})


@app.route('/api/currency', methods=['POST'])
def set_currency():
    """Pénznem beállítása"""
    data = request.json
    currency = data.get('currency', 'HUF')
    
    if currency not in ['HUF', 'EUR']:
        return jsonify({'error': 'Érvénytelen pénznem!'}), 400
    
    game.currency = currency
    game.save_data()  # Automatikus mentés
    return jsonify({'currency': game.currency}), 200


@app.route('/api/reset', methods=['POST'])
def reset_game():
    """Játék nullázása"""
    global game
    
    # XML fájl törlése ha létezik
    if os.path.exists('game_data.xml'):
        os.remove('game_data.xml')
        print("🗑️ XML mentett adatok törölve")
    
    game = GameData()
    return jsonify({'message': 'Játék nullázva'}), 200


if __name__ == '__main__':
    print(f"📱 Telefonos elérés: http://{get_local_ip()}:{PORT}")
    app.run(debug=True, host='0.0.0.0', port=PORT)
