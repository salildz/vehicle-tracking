#pragma once
#include <WiFi.h>

class WifiManager {
public:
  WifiManager(const char* ssid, const char* password)
    : _ssid(ssid), _password(password) {}

  bool connect(uint32_t timeoutMs = 15000) {
    WiFi.mode(WIFI_OFF);
    delay(1000);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false); // Power management kapat
    
    WiFi.begin(_ssid, _password);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
      delay(500);
      if (WiFi.status() == WL_CONNECT_FAILED) {
        WiFi.disconnect();
        WiFi.begin(_ssid, _password);
      }
    }

    return WiFi.status() == WL_CONNECTED;
  }

  bool reconnect(uint8_t maxAttempts = 3, uint32_t delayMs = 3000) {
    for (uint8_t attempt = 0; attempt < maxAttempts; ++attempt) {
      if (connect()) return true;
      delay(delayMs);
    }
    return false;
  }

  bool isConnected() const {
    return WiFi.status() == WL_CONNECTED;
  }

  String getConnectionStatus() const {
    switch(WiFi.status()) {
      case WL_CONNECTED: return "Connected";
      case WL_NO_SSID_AVAIL: return "SSID not found";
      case WL_CONNECT_FAILED: return "Connect failed";
      case WL_CONNECTION_LOST: return "Connection lost";
      case WL_DISCONNECTED: return "Disconnected";
      default: return "Unknown (" + String(WiFi.status()) + ")";
    }
  }

  String getIP() const {
    return WiFi.localIP().toString();
  }

  int getRSSI() const {
    return WiFi.RSSI();
  }

  void disconnect() {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
  }

private:
  const char* _ssid;
  const char* _password;
};
