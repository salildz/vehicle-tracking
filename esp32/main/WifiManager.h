#pragma once
#include <WiFi.h>

class WifiManager {
public:
  static bool begin(const char* ssid, const char* pass) {
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(100);
    Serial.printf("Wi-Fi starting: %s\n", ssid);
    WiFi.begin(ssid, pass);
    unsigned long t0 = millis();
    while (WiFi.status() != WL_CONNECTED) {
      Serial.print('.');
      delay(500);
      if (millis() - t0 > 30000) {
        Serial.println();
        Serial.printf("Connection couldn't be established in %lus, status=%d\n",
                      (millis()-t0)/1000, WiFi.status());
        return false;
      }
    }
    Serial.println("\nWi-Fi connected, IP=" + WiFi.localIP().toString());
    return true;
  }

  static bool ensureConnected(const char* ssid, const char* pass) {
    if (WiFi.status() == WL_CONNECTED) return true;
    Serial.println("Wi-Fi connection is broken, reconnecting.");
    return begin(ssid, pass);
  }
};