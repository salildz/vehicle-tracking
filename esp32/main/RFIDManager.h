#pragma once
#include <SPI.h>
#include <MFRC522.h>

class RFIDManager {
public:
  RFIDManager(uint8_t ssPin, uint8_t rstPin)
    : _reader(ssPin, rstPin) {}

  void begin() {
    SPI.begin();
    _reader.PCD_Init();
  }

  String pollUID() {
    if (!_reader.PICC_IsNewCardPresent()) return "";
    if (!_reader.PICC_ReadCardSerial()) return "";
    String uid;
    for (byte i = 0; i < _reader.uid.size; i++) {
      if (_reader.uid.uidByte[i] < 0x10) uid += '0';
      uid += String(_reader.uid.uidByte[i], HEX);
    }
    _reader.PICC_HaltA();
    return uid;
  }

  bool isAuthorized(const String& uid) {
    return uid == "12345678"; // Yetkili UID örneği
  }

private:
  MFRC522 _reader;
};