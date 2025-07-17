#pragma once
#include <MFRC522.h>
#include <SPI.h>

class RFIDManager {
public:
  RFIDManager(uint8_t ssPin, uint8_t rstPin)
    : _ssPin(ssPin), _rstPin(rstPin), _mfrc522(ssPin, rstPin) {}

  void begin() {
    SPI.begin();
    _mfrc522.PCD_Init();
    _initialized = true;
  }

  String readCard() {
    if (!_initialized) return "";

    if (!_mfrc522.PICC_IsNewCardPresent() || !_mfrc522.PICC_ReadCardSerial())
      return "";

    String uid = getUID();
    _mfrc522.PICC_HaltA();
    _mfrc522.PCD_StopCrypto1();

    unsigned long now = millis();
    if (uid == _lastUID && (now - _lastReadTime < _debounceMs)) {
      return "";
    }

    _lastUID = uid;
    _lastReadTime = now;
    return uid;
  }

  bool isHealthy() const {
    return _initialized;
  }

private:
  uint8_t _ssPin, _rstPin;
  MFRC522 _mfrc522;
  bool _initialized = false;

  String _lastUID = "";
  unsigned long _lastReadTime = 0;
  const unsigned long _debounceMs = 1000;

  String getUID() const {
    String uid = "";
    for (byte i = 0; i < _mfrc522.uid.size; i++) {
      if (_mfrc522.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(_mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    return uid;
  }
};
