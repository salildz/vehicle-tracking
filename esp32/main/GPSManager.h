#pragma once
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

class GPSManager {
public:
  GPSManager(HardwareSerial& serial, int rxPin, int txPin)
    : _serial(serial), _rx(rxPin), _tx(txPin) {}

  void begin(uint32_t baud=9600) {
    _serial.begin(baud, SERIAL_8N1, _rx, _tx);
  }

  bool update() {
    while (_serial.available()) {
      if (_gps.encode(_serial.read())) updated = true;
    }
    return updated;
  }

  double latitude() {
    updated = false;
    return _gps.location.lat();
  }

  double longitude() {
    return _gps.location.lng();
  }

private:
  HardwareSerial& _serial;
  int _rx, _tx;
  TinyGPSPlus _gps;
  bool updated = false;
};