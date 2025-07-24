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
  UNAUTHORIZED_SESSION = 4
};

// Global objects
SystemConfig config;
GPSManager gps(config.GPS_RX, config.GPS_TX, config.GPS_BAUD);
RFIDManager rfid(config.RFID_SS, config.RFID_RST);
MP3PlayerManager mp3(config.MP3_RX, config.MP3_TX, config.MP3_VOLUME);
WifiManager wifi(config.WIFI_SSID, config.WIFI_PASSWORD, config.WIFI_RETRY_MAX);
DataSender sender(config.SERVER_URL, config.DEVICE_ID);
WatchdogManager watchdog(30);

SystemState currentSystemState = INITIALIZATION;

struct SystemHealth {
  bool wifiConnected = false;
  bool gpsReady = false;
  bool rfidReady = false;
  bool serverReachable = false;
  unsigned long lastGPSUpdate = 0;
  unsigned long lastServerContact = 0;
  unsigned long lastWiFiCheck = 0;
} systemHealth;

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=========================================");
  Serial.println("VEHICLE TRACKING SYSTEM ESP32");
  Serial.println("=========================================");
  Serial.printf("Device ID: %s\n", config.DEVICE_ID);
  Serial.printf("Server: %s\n", config.SERVER_URL);
  Serial.println("Build: " __DATE__ " " __TIME__);
  Serial.printf("Free Heap: %d KB\n", ESP.getFreeHeap() / 1024);
  Serial.println("=========================================");

  config.print();

  // Initialize hardware modules
  Serial.println("Initializing hardware modules...");

  gps.begin();
  Serial.println("GPS initialized");

  rfid.begin();
  Serial.println("RFID initialized");

  mp3.begin();
  Serial.println("MP3 initialized");

  // Initialize WiFi with retry logic
  Serial.println("Initializing WiFi...");
  initializeWiFi();

  // Test server connectivity if WiFi is connected
  if (systemHealth.wifiConnected) {
    testServerConnection();
  }

  // Initialize watchdog last
  watchdog.begin();
  Serial.println("Watchdog initialized");

  Serial.println("System initialization complete");
  Serial.println("=========================================");
  mp3.playTrack(config.TRACK_ENTRY);
}

void initializeWiFi() {
  const int maxInitAttempts = 3;
  int attempt = 1;

  while (attempt <= maxInitAttempts && !systemHealth.wifiConnected) {
    Serial.printf("WiFi initialization attempt %d/%d\n", attempt, maxInitAttempts);

    if (wifi.connect(15000)) {  // 15 second timeout
      systemHealth.wifiConnected = true;
      systemHealth.lastWiFiCheck = millis();
      Serial.println("WiFi initialization successful");
      break;
    } else {
      Serial.printf("WiFi attempt %d failed\n", attempt);
      attempt++;

      if (attempt <= maxInitAttempts) {
        Serial.println("Waiting 3 seconds before retry...");
        delay(3000);
      }
    }
  }

  if (!systemHealth.wifiConnected) {
    Serial.println("WiFi initialization failed - continuing in offline mode");
    currentSystemState = WIFI_ERROR;

    // Show available networks for debugging
    Serial.println("Available networks:");
    wifi.scanNetworks(true);
  }
}

void testServerConnection() {
  Serial.println("Testing server connectivity...");

  if (sender.send(39.9334, 32.8597, 0, 0, 999)) {  // Test with Ankara coordinates
    systemHealth.serverReachable = true;
    systemHealth.lastServerContact = millis();
    Serial.println("Server connectivity test successful");
  } else {
    systemHealth.serverReachable = false;
    Serial.println("Server connectivity test failed");
  }
}

void updateSystemHealth() {
  // Update WiFi status
  systemHealth.wifiConnected = wifi.isConnected();

  // Update GPS status
  gps.update();
  if (gps.isValid()) {
    systemHealth.gpsReady = true;
    systemHealth.lastGPSUpdate = millis();
  } else {
    // GPS timeout check (30 seconds)
    if (systemHealth.lastGPSUpdate > 0 && (millis() - systemHealth.lastGPSUpdate > 30000)) {
      systemHealth.gpsReady = false;
    }
  }

  // Update RFID status
  systemHealth.rfidReady = rfid.isHealthy();
}

void handleWiFiMaintenance() {
  unsigned long currentTime = millis();

  // Check WiFi status every 15 seconds
  if (currentTime - systemHealth.lastWiFiCheck < 15000) {
    return;
  }
  systemHealth.lastWiFiCheck = currentTime;

  bool wasConnected = systemHealth.wifiConnected;
  systemHealth.wifiConnected = wifi.isConnected();

  // Connection lost
  if (wasConnected && !systemHealth.wifiConnected) {
    Serial.println("WiFi connection lost");
    currentSystemState = WIFI_ERROR;
  }

  // Try to reconnect if disconnected and should attempt
  if (!systemHealth.wifiConnected && wifi.shouldReconnect()) {
    Serial.println("Attempting WiFi reconnection...");

    if (wifi.reconnect(2, 2000)) {  // 2 attempts, 2 second base delay
      systemHealth.wifiConnected = true;
      Serial.println("WiFi reconnection successful");

      // Test server connectivity after reconnection
      testServerConnection();

      // Update state if we were in WiFi error state
      if (currentSystemState == WIFI_ERROR) {
        currentSystemState = INITIALIZATION;
      }
    } else {
      Serial.println("WiFi reconnection failed");
    }
  }
}

void sendGPSData() {
  static unsigned long lastSend = 0;
  unsigned long currentTime = millis();

  if (currentTime - lastSend < config.SEND_INTERVAL_MS) {
    return;
  }
  lastSend = currentTime;

  updateSystemHealth();

  // Determine GPS coordinates
  double lat, lng;
  float spd = 0, hdg = 0, acc = 999;

  if (systemHealth.gpsReady && gps.isValid()) {
    lat = gps.latitude();
    lng = gps.longitude();
    spd = gps.speed();
    hdg = gps.heading();
    acc = gps.accuracy();
    Serial.printf("GPS OK: %.6f,%.6f (Speed: %.1f km/h)\n", lat, lng, spd);
  } else {
    // Use default coordinates (Ankara)
    lat = 39.9334;
    lng = 32.8597;
    Serial.println("GPS No Fix - using default coordinates");
  }

  // Send to server if WiFi connected
  if (systemHealth.wifiConnected) {
    if (sender.send(lat, lng, spd, hdg, acc)) {
      systemHealth.serverReachable = true;
      systemHealth.lastServerContact = currentTime;
      Serial.println("Data sent successfully");

      // Update system state based on authorization
      if (sender.isAuthorized()) {
        currentSystemState = AUTHORIZED_SESSION;
      } else {
        currentSystemState = UNAUTHORIZED_SESSION;
      }
    } else {
      systemHealth.serverReachable = false;
      Serial.println("Data send failed");
    }
  } else {
    Serial.println("Offline mode - data not transmitted");
    systemHealth.serverReachable = false;
  }
}

void handleRFIDCard(const String& cardId) {
  Serial.printf("RFID Card detected: %s\n", cardId.c_str());
  mp3.playTrack(config.TRACK_CARD_READ);
  systemHealth.rfidReady = true;

  if (systemHealth.wifiConnected) {
    double lat = systemHealth.gpsReady ? gps.latitude() : 39.9334;
    double lng = systemHealth.gpsReady ? gps.longitude() : 32.8597;

    if (sender.send(lat, lng, 0, 0, 999, cardId)) {
      systemHealth.serverReachable = true;
      systemHealth.lastServerContact = millis();

      auto response = sender.getLastResponse();
      if (response.authorized) {
        Serial.printf("Driver authorized: %s\n", response.driverName.c_str());
        //mp3.playTrack(config.TRACK_AUTHORIZED);
        currentSystemState = AUTHORIZED_SESSION;
      } else {
        Serial.println("Driver not authorized");
        //mp3.playTrack(config.TRACK_UNAUTHORIZED);
        currentSystemState = UNAUTHORIZED_SESSION;
      }

      Serial.println("RFID data sent successfully");
    } else {
      systemHealth.serverReachable = false;
      Serial.println("RFID data send failed");
      //mp3.playTrack(config.TRACK_ERROR);
    }
  } else {
    Serial.println("No WiFi - RFID logged locally only");
   // mp3.playTrack(config.TRACK_ERROR);
  }
}

void printSystemHealth() {
  Serial.println("=== SYSTEM HEALTH ===");
  Serial.printf("WiFi: %s", systemHealth.wifiConnected ? "Connected" : "Disconnected");
  if (systemHealth.wifiConnected) {
    Serial.printf(" (%s, %d dBm)", wifi.getIP().c_str(), wifi.getRSSI());
  }
  Serial.println();

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

  Serial.printf("State: %d\n", (int)currentSystemState);
  Serial.printf("Free Heap: %d KB\n", ESP.getFreeHeap() / 1024);
  Serial.printf("Uptime: %lus\n", millis() / 1000);
  Serial.println("========================");
}

void loop() {
  // Feed watchdog
  static unsigned long lastWatchdogFeed = 0;
  if (millis() - lastWatchdogFeed > 5000) {  // Every 5 seconds
    lastWatchdogFeed = millis();
    watchdog.feed();
  }

  // Play sound
  static unsigned long lastSoundPlay = 0;
  if (millis() - lastSoundPlay > 2000) {  // Every 2 seconds
    lastSoundPlay = millis();

    switch (currentSystemState) {
      case UNAUTHORIZED_SESSION:
      mp3.playTrack(config.TRACK_UNAUTHORIZED);
        break;
      case WIFI_ERROR:
      mp3.playTrack(config.TRACK_WIFI_FAIL);
        break;
    }
  }

  // Handle RFID cards
  String card = rfid.readCard();
  if (card.length() > 0) {
    handleRFIDCard(card);
  }

  // Send GPS data
  sendGPSData();

  // WiFi maintenance
  handleWiFiMaintenance();

  // System health reporting (every 30 seconds)
  static unsigned long lastHealthPrint = 0;
  if (millis() - lastHealthPrint > 15000) {
    lastHealthPrint = millis();
    printSystemHealth();
  }

  // Prevent tight loop
  delay(250);
}