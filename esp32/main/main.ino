#include <Arduino.h>
#include "WifiManager.h"
#include "RFIDManager.h"
#include "GPSManager.h"
#include "DataSender.h"
#include "MP3PlayerManager.h"

const char* WIFI_SSID  = "Qwetyu1";
const char* WIFI_PASS  = "mun34567";
const char* SERVER_URL = "http://192.168.0.20/api/device";
String currentDriverUID = "";

RFIDManager rfid(5, 22);
GPSManager gps(Serial2, 16, 17);
MP3PlayerManager mp3;
DataSender sender(SERVER_URL);

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("System starting");

  Serial1.begin(9600, SERIAL_8N1, 27, 14);
  mp3.begin(Serial1);
  mp3.setVolume(24);
  mp3.playTrack(1);
  delay(1000);

  if (!WifiManager::begin(WIFI_SSID, WIFI_PASS)) {
    Serial.println("Wi-Fi bağlantısı başarısız.");
  }

  rfid.begin();
  gps.begin();
  Serial.println("=== System is ready ===");
}

void loop() {
  // Beep sadece sürücü tanımlı değilse çalmalı
  if (currentDriverUID.isEmpty()) {
    mp3.loopBeep();  // Henüz kimse kart okutmadı
  }

  // GPS sürekli güncellensin
  gps.update();

  // Her durumda Wi-Fi varsa GPS verisi gönderilebilir
  bool wifiOK = WifiManager::ensureConnected(WIFI_SSID, WIFI_PASS);

  // RFID okuma kontrolü
  String uid = rfid.pollUID();
  double lat = gps.latitude();
  double lng = gps.longitude();

  if (!uid.isEmpty()) {
    Serial.println("Kart Okundu: " + uid);

    bool auth = rfid.isAuthorized(uid);
    currentDriverUID = auth ? uid : "";

    if (auth) {
      mp3.playTrack(3);  // Yetkili sesi
      mp3.stopBeep();    // Beep’i durdur
    } else {
      mp3.playTrack(4);  // Yetkisiz sesi
      mp3.loopBeep();    // Beep açık kalmalı
    }

    // GPS fix alındıysa konum güncelle
    if (lat == 0.0) {
      unsigned long t0 = millis();
      while (millis() - t0 < 2000) {
        if (gps.update() && gps.latitude() != 0.0) {
          lat = gps.latitude();
          lng = gps.longitude();
          break;
        }
      }
    }

    if (wifiOK) {
      sender.send(uid, lat, lng); // Sürücü okunduğu anda veri gönder
    }

    delay(1000);
    return;
  }

  // Eğer sürücü tanımlıysa ve GPS varsa sürekli veri gönder
  if (!currentDriverUID.isEmpty() && wifiOK && lat != 0.0) {
    sender.send(currentDriverUID, lat, lng);
  }

  delay(500);
}
