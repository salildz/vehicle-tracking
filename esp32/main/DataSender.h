#pragma once
#include <HTTPClient.h>
#include <ArduinoJson.h>

class DataSender {
public:
  struct ServerResponse {
    bool success = false;
    bool authorized = false;
    String sessionId;
    String driverName;
    String message;
  };

  DataSender(const String& serverUrl, const String& deviceId)
    : _url(serverUrl), _deviceId(deviceId) {}

  bool send(double lat, double lng, float speed, float heading, float accuracy,
            const String& rfidCardId = "")
  {
    if (WiFi.status() != WL_CONNECTED) return false;

    StaticJsonDocument<512> doc;
    doc["deviceId"]  = _deviceId;
    doc["latitude"]  = lat;
    doc["longitude"] = lng;
    doc["speed"]     = speed;
    doc["heading"]   = heading;
    doc["accuracy"]  = accuracy;
/*     doc["timestamp"] = millis(); */

    if (rfidCardId.length() > 0)
      doc["rfidCardId"] = rfidCardId;

    String json;
    serializeJson(doc, json);

    bool success = sendRawJson(json);

    return success;
  }

  ServerResponse getLastResponse() const {
    return _last;
  }

  bool sendRawJson(const String& payload) {
    HTTPClient http;
    http.begin(_url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);

    Serial.printf("Sending to: %s\n", _url.c_str());
    Serial.printf("Payload: %s\n", payload.c_str());

    int statusCode = http.POST(payload);
    String response = http.getString();
    
    Serial.printf("HTTP Status: %d\n", statusCode);
    Serial.printf("Response: %s\n", response.c_str());
    
    http.end();

    return parseResponse(response, statusCode);
  }

private:
  String _url;
  String _deviceId;
  ServerResponse _last;

  bool parseResponse(const String& json, int code) {
    StaticJsonDocument<1024> doc;
    if (deserializeJson(doc, json)) {
      _last.success = false;
      _last.message = "JSON parse error";
      return false;
    }

    _last.success = (code >= 200 && code < 300);
    _last.message = doc["message"] | "";

    if (doc.containsKey("data")) {
      JsonObject data = doc["data"];
      _last.authorized = data["driverAuthorized"] | false;
      _last.sessionId = data["sessionId"] | "";

      if (data.containsKey("driver")) {
        _last.driverName = (String)data["driver"]["firstName"] + " " + (String)data["driver"]["lastName"];
      }
    }

    return _last.success;
  }
};
