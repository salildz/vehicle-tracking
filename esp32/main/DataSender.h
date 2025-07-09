#pragma once
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>

class DataSender {
public:
  DataSender(const char* serverUrl) : _url(serverUrl) {}

  bool send(const String& uid, double lat, double lng) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️ HTTP Gönderme: Wi-Fi bağlı değil!");
      return false;
    }

    HTTPClient http;
    Serial.printf("➡️ HTTP BEGIN: %s\n", _url);
    if (!http.begin(_url)) {
      Serial.println("⚠️ HTTP begin() başarısız!");
      return false;
    }

    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["uid"]       = uid;
    doc["latitude"]  = lat;
    doc["longitude"] = lng;
    doc["timestamp"] = millis();
    String body;
    serializeJson(doc, body);
    Serial.printf("📤 POST BODY: %s\n", body.c_str());

    int code = http.POST(body);
    if (code > 0) {
      Serial.printf("📥 HTTP response code: %d\n", code);
      String resp = http.getString();
      Serial.printf("📄 Response body: %s\n", resp.c_str());

      if (code >= 200 && code < 300) {
        Serial.println("✅ HTTP POST başarılı");
        http.end();
        return true;
      } else {
        Serial.println("❌ HTTP POST başarısız (sunucu hatası)");
        http.end();
        return false;
      }
    } else {
      String err = http.errorToString(code);
      Serial.printf("❌ HTTP POST hatası: %s (code=%d)\n", err.c_str(), code);
      http.end();
      return false;
    }
  }

private:
  const char* _url;
};