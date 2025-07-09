#pragma once
#include <Arduino.h>

class MP3PlayerManager {
public:
  MP3PlayerManager() : mp3(nullptr), isBeeping(false), lastBeepTime(0) {}

  void begin(HardwareSerial& serial) {
    mp3 = &serial;
    delay(500);
  }

  void setVolume(uint8_t level) {
    if (!mp3) return;
    if (level > 30) level = 30;
    sendCommand(0x06, 0x00, level);
  }

  void playTrack(uint16_t trackNum) {
    if (!mp3) return;
    sendCommand(0x03, (uint8_t)(trackNum >> 8), (uint8_t)(trackNum & 0xFF));
  }

  void loopBeep() {
    if (!isBeeping || millis() - lastBeepTime >= 2000) {
      playTrack(2);
      lastBeepTime = millis();
      isBeeping = true;
    }
  }

  void stopBeep() {
    isBeeping = false;
  }

private:
  HardwareSerial* mp3;
  bool isBeeping;
  unsigned long lastBeepTime;

  void sendCommand(uint8_t cmd, uint8_t param1 = 0, uint8_t param2 = 0) {
    uint8_t buf[10] = {
      0x7E, 0xFF, 0x06, cmd, 0x00, param1, param2, 0x00, 0x00, 0xEF
    };
    uint16_t sum = 0;
    for (int i = 1; i < 7; ++i) sum += buf[i];
    sum = 0xFFFF - sum + 1;
    buf[7] = (uint8_t)(sum >> 8);
    buf[8] = (uint8_t)(sum & 0xFF);
    mp3->write(buf, 10);
    delay(200);
  }
};