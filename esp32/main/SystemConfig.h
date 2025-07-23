#pragma once
#include <Arduino.h>

struct SystemConfig {
  // 📡 WiFi
  const char* WIFI_SSID     = "Qwetyu1";
  const char* WIFI_PASSWORD = "mun34567";
  const char* DEVICE_ID     = "ESP32-001";

  // 🌍 Server
  const char* SERVER_URL = "http://192.168.165.38:9041/api/device/gps-data";

  // 📍 GPS (UART)
  const int GPS_RX = 16;
  const int GPS_TX = 17;
  const unsigned long GPS_BAUD = 9600;

  // 🔑 RFID (SPI)
  const int RFID_SS  = 5;
  const int RFID_RST = 22;

  // 🔊 MP3 Player (UART)
  const int MP3_RX = 27;
  const int MP3_TX = 14;
  const int MP3_VOLUME = 24;

  // ⏱️ Sistem Zamanlamaları
  const unsigned long SEND_INTERVAL_MS     = 5000;   // GPS veri gönderme süresi
  const unsigned long RFID_DEBOUNCE_MS     = 1000;   // Kart okuma aralığı
  const unsigned long NETWORK_TIMEOUT_MS   = 10000;  // WiFi bağlantı zaman aşımı
  const unsigned long SESSION_TIMEOUT_MS   = 43200000; // 12 saat
  const unsigned long UNAUTH_TIMEOUT_MS    = 21600000; // 6 saat

  // 📶 WiFi Gelişmiş Ayarlar
  const int WIFI_RSSI_THRESHOLD_DBM = -75;
  const int WIFI_RETRY_MAX = 5;
  const int WIFI_RETRY_DELAY_MS = 5000;

  // 💡 LED ve Durum Pinleri
  const int LED_STATUS = 2;     // Dahili LED
  const int BTN_EMERGENCY = 0;  // Boot butonu

  // ✅ GPS minimum kalite gereksinimleri
  const int GPS_MIN_SATELLITES = 4;
  const float GPS_MAX_HDOP     = 5.0;

  // 🔊 Ses Dosyası Numaraları (TF karttaki MP3 dosyaları)
  const int TRACK_ENTRY           = 1;
  const int TRACK_UNAUTHORIZED    = 2;
  const int TRACK_AUTHORIZED      = 4;
  const int TRACK_ERROR           = 3;
  const int TRACK_WIFI_FAIL       = 3;

  void print() const {
    Serial.println("📋 ==== CONFIGURATION ====");
    Serial.printf("WiFi: %s\n", WIFI_SSID);
    Serial.printf("Server: %s\n", SERVER_URL);
    Serial.printf("GPS: RX=%d TX=%d Baud=%lu\n", GPS_RX, GPS_TX, GPS_BAUD);
    Serial.printf("RFID: SS=%d RST=%d\n", RFID_SS, RFID_RST);
    Serial.printf("MP3 : RX=%d TX=%d Volume=%d\n", MP3_RX, MP3_TX, MP3_VOLUME);
    Serial.println("==========================");
  }
};