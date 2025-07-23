#pragma once
#include <Arduino.h>

class MP3PlayerManager {
public:
  MP3PlayerManager(uint8_t rxPin, uint8_t txPin, uint8_t volume = 20)
    : _rx(rxPin), _tx(txPin), _volume(volume),
      _mp3(nullptr), _isBeeping(false), _lastBeepTime(0) {}

  void begin() {
    _serial = new HardwareSerial(1); // Serial1 kullanılıyor (UART1)
    _serial->begin(9600, SERIAL_8N1, _rx, _tx);
    delay(500);
    _mp3 = _serial;
    setVolume(_volume);
  }

  void setVolume(uint8_t level) {
    if (!_mp3) return;
    if (level > 30) level = 30;
    sendCommand(0x06, 0x00, level);
  }

  void playTrack(uint16_t trackNum) {
    if (!_mp3) return;
    sendCommand(0x03, (uint8_t)(trackNum >> 8), (uint8_t)(trackNum & 0xFF));
  }

/*   void loopBeep() {
    if (!_mp3) return;
    if (!_isBeeping || millis() - _lastBeepTime >= 2000) {
      playTrack(2); // Beep track
      _lastBeepTime = millis();
      _isBeeping = true;
    }
  } */

/*   void stopBeep() {
    _isBeeping = false;
  } */

private:
  uint8_t _rx, _tx;
  uint8_t _volume;

  HardwareSerial* _serial;
  HardwareSerial* _mp3;
  bool _isBeeping;
  unsigned long _lastBeepTime;

  void sendCommand(uint8_t cmd, uint8_t param1 = 0, uint8_t param2 = 0) {
    uint8_t buf[10] = {
      0x7E, 0xFF, 0x06, cmd, 0x00, param1, param2, 0x00, 0x00, 0xEF
    };
    uint16_t sum = 0;
    for (int i = 1; i < 7; ++i) sum += buf[i];
    sum = 0xFFFF - sum + 1;
    buf[7] = (uint8_t)(sum >> 8);
    buf[8] = (uint8_t)(sum & 0xFF);
    _mp3->write(buf, 10);
    delay(200);
  }
};
