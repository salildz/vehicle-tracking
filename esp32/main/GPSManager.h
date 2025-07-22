#pragma once
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

class GPSManager {
public:
  GPSManager(uint8_t rxPin, uint8_t txPin, uint32_t baud = 9600)
    : _rx(rxPin), _tx(txPin), _baud(baud), _serial(1) {}

  void begin() {
    _serial.begin(_baud, SERIAL_8N1, _rx, _tx);
  }

  void update() {
    while (_serial.available() > 0) {
      _gps.encode(_serial.read());
    }
  }

  bool isValid() const {
    return _gps.location.isValid();
  }

  double latitude()  {
    return _gps.location.lat();
  }

  double longitude() {
    return _gps.location.lng();
  }

  float speed() {
    return _gps.speed.kmph();
  }

  float heading() {
    return _gps.course.deg();
  }

  float accuracy() {
    return _gps.hdop.hdop();
  }

private:
  uint8_t _rx, _tx;
  uint32_t _baud;
  HardwareSerial _serial;
  TinyGPSPlus _gps;
};
