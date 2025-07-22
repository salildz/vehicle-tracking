#include "SystemConfig.h"
#include "Logger.h"
#include "GPSManager.h"
#include "RFIDManager.h"
#include "MP3PlayerManager.h"
#include "WifiManager.h"
#include "DataSender.h"
#include "WatchdogManager.h"

enum SystemState {
  INITIALIZATION = 0,
  WIFI_ERROR = 1,
  RESETTING = 2,
  AUTHORIZED_SESSION = 3,
  UNAUTHARIZED_SESSION = 4
};


// Modül örneklerini oluştur
SystemConfig config;
GPSManager gps(config.GPS_RX, config.GPS_TX, config.GPS_BAUD);
RFIDManager rfid(config.RFID_SS, config.RFID_RST);
MP3PlayerManager mp3(config.MP3_RX, config.MP3_TX, config.MP3_VOLUME);
WifiManager wifi(config.WIFI_SSID, config.WIFI_PASSWORD);
DataSender sender(config.SERVER_URL, config.DEVICE_ID);
WatchdogManager watchdog(20);

enum SystemState currentSystemState = INITIALIZATION;

struct SystemHealth {
  bool wifiConnected = false;
  bool gpsReady = false;
  bool rfidReady = false;
  bool serverReachable = false;
  unsigned long lastGPSUpdate = 0;
  unsigned long lastServerContact = 0;
} systemHealth;

void setup() {

  Serial.begin(115200);
  delay(300);

  Serial.println("\n=========================================");
  Serial.println("VEHICLE TRACKING SYSTEM ESP32");
  Serial.println("=========================================");
  Serial.printf("Device ID: %s\n", config.DEVICE_ID);
  Serial.printf("Server: %s\n", config.SERVER_URL);
  Serial.println("Build: " __DATE__ " " __TIME__);
  Serial.printf("Free Heap: %d KB\n", ESP.getFreeHeap() / 1024);
  Serial.println("=========================================");
  
  config.print();

  gps.begin();
  rfid.begin();
  mp3.begin();
  /* wifi.connect(); */

 Serial.println("Attempting WiFi connection...");
  if (wifi.connect()) {
    Serial.printf("WiFi connected! IP: %s\n", wifi.getIP().c_str());
    Serial.printf("RSSI: %d dBm\n", wifi.getRSSI());
  } else {
    Serial.println("WiFi connection failed!");
    Serial.println("Available networks:");
    WiFi.scanNetworks();
  }

  sender.send(0, 0, 0, 0, 999);  // dummy handshake

  watchdog.begin();
}

void updateSystemHealth() {
  systemHealth.wifiConnected = wifi.isConnected();
  
  gps.update();
  if (gps.isValid()) {
    systemHealth.gpsReady = true;
    systemHealth.lastGPSUpdate = millis();
  } else {
    // GPS 30 saniyedir güncel veri vermiyorsa false yap
    if (millis() - systemHealth.lastGPSUpdate > 30000) {
      systemHealth.gpsReady = false;
    }
  }
  
  // RFID durumunu kontrol et
  systemHealth.rfidReady = rfid.isHealthy(); 
}

void sendGPSData() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend < config.SEND_INTERVAL_MS) return;
  lastSend = millis();
  
  updateSystemHealth();
  
  // GPS koordinatları al
  double lat, lng;
  float spd = 0, hdg = 0, acc = 999;
  
  if (systemHealth.gpsReady && gps.isValid()) {
    lat = gps.latitude();
    lng = gps.longitude();
    spd = gps.speed();
    hdg = gps.heading();
    acc = gps.accuracy();
    
    Serial.printf("GPS OK: %.6f,%.6f\n", lat, lng);
  } else {
    lat = 39.9334;
    lng = 32.8597;
    
    Serial.println("GPS No Fix - using default");
  }
  
  // Server'a gönder
  if (systemHealth.wifiConnected) {
    if (sender.send(lat, lng, spd, hdg, acc)) {
      systemHealth.serverReachable = true;
      systemHealth.lastServerContact = millis();
      Serial.println("Data sent");
    } else {
      systemHealth.serverReachable = false;
      Serial.println("Send failed");
    }
  } else {
    Serial.println("Offline mode");
    systemHealth.serverReachable = false;
    Serial.printf("Wifi baglanamadı, durum: %s\n", wifi.getConnectionStatus());
    wifi.reconnect();
  }
}

void handleRFIDCard(const String& cardId) {
  Serial.printf("RFID: %s\n", cardId.c_str());
  
  systemHealth.rfidReady = true;
  
  if (systemHealth.wifiConnected) {
    double lat = systemHealth.gpsReady ? gps.latitude() : 39.9334;
    double lng = systemHealth.gpsReady ? gps.longitude() : 32.8597;
    
    if (sender.send(lat, lng, 0, 0, 999, cardId)) {
      systemHealth.serverReachable = true;
      systemHealth.lastServerContact = millis();
      Serial.println("RFID data sent");
    } else {
      systemHealth.serverReachable = false;
      Serial.println("RFID send failed");
    }
  }
}

// System health monitoring
void printSystemHealth() {
  Serial.println("=== SYSTEM HEALTH ===");
  Serial.printf("WiFi: %s\n", systemHealth.wifiConnected ? "Connected" : "Disconnected");
  Serial.printf("GPS: %s", systemHealth.gpsReady ? "Ready" : "No Fix");
  if (systemHealth.lastGPSUpdate > 0) {
    Serial.printf(" (Last: %lus ago)", (millis() - systemHealth.lastGPSUpdate) / 1000);
  }
  Serial.println();
  Serial.printf("RFID: %s\n", systemHealth.rfidReady ? "Ready" : "Error");
  Serial.printf("Server: %s", systemHealth.serverReachable ? "Reachable" : "Unreachable");
  if (systemHealth.lastServerContact > 0) {
    Serial.printf(" (Last: %lus ago)", (millis() - systemHealth.lastServerContact) / 1000);
  }
  Serial.println();
  Serial.println("========================");
}

void loop() {
  watchdog.feed();
  
  // RFID kontrolü
  String card = rfid.readCard();
  if (card.length() > 0) {
    handleRFIDCard(card);
  }
  
  // GPS veri gönderme
  sendGPSData();
  
  // Sistem durumu (daha seyrek)
  static unsigned long lastHealthPrint = 0;
  if (millis() - lastHealthPrint > 60000) { // 1 dakikaya çıkar
    lastHealthPrint = millis();
    printSystemHealth();
  }
  
  // WiFi kopmuşsa yeniden bağlan
  if (!wifi.isConnected()) {
    Serial.println("WiFi reconnecting...");
    wifi.reconnect(1, 1000); // 1 deneme, 1 saniye bekle
  }
  
  delay(500); // Biraz daha rahat
}