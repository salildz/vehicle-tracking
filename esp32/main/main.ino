#include "SystemConfig.h"
#include "Logger.h"
#include "GPSManager.h"
#include "RFIDManager.h"
#include "MP3PlayerManager.h"
#include "WifiManager.h"
#include "DataSender.h"
#include "WatchdogManager.h"

// Modül örneklerini oluştur
SystemConfig config;
GPSManager gps(config.GPS_RX, config.GPS_TX);
RFIDManager rfid(config.RFID_SS, config.RFID_RST);
MP3PlayerManager mp3(config.MP3_RX, config.MP3_TX, config.MP3_VOLUME);
WifiManager wifi(config.WIFI_SSID, config.WIFI_PASSWORD);
DataSender sender(config.SERVER_URL, config.DEVICE_ID);
WatchdogManager watchdog(10);

void setup() {
  Serial.begin(115200);
  delay(300);
  config.print();

  gps.begin(config.GPS_BAUD);
  rfid.begin();
  mp3.begin();
  wifi.connect();

  sender.send(0, 0, 0, 0, 999);  // dummy handshake

  watchdog.begin();
}

void loop() {
  watchdog.feed();

  String rfidCardId = rfid.readCard();
  if(rfidCardId){
    Logger::info(rfidCardId);
  }

  delay(1000);
}
