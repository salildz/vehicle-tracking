#include "SystemConfig.h"
#include "Logger.h"
#include "GPSManager.h"
#include "RFIDManager.h"
#include "MP3PlayerManager.h"
#include "WifiManager.h"
#include "DataSender.h"
#include "WatchdogManager.h"

enum SystemState {
  INITIALIZATION = 0,
  WIFI_ERROR = 1,
  RESETTING = 2,
  AUTHORIZED_SESSION = 3,
  UNAUTHARIZED_SESSION = 4
};


// Modül örneklerini oluştur
SystemConfig config;
GPSManager gps(config.GPS_RX, config.GPS_TX, config.GPS_BAUD);
RFIDManager rfid(config.RFID_SS, config.RFID_RST);
MP3PlayerManager mp3(config.MP3_RX, config.MP3_TX, config.MP3_VOLUME);
WifiManager wifi(config.WIFI_SSID, config.WIFI_PASSWORD);
DataSender sender(config.SERVER_URL, config.DEVICE_ID);
WatchdogManager watchdog(20);

enum SystemState currentSystemState = INITIALIZATION;

struct SystemHealth {
  bool wifiConnected = false;
  bool gpsReady = false;
  bool rfidReady = false;
  bool serverReachable = false;
  unsigned long lastGPSUpdate = 0;
  unsigned long lastServerContact = 0;
} systemHealth;

void setup() {

  Serial.println("\n=========================================");
  Serial.println("VEHICLE TRACKING SYSTEM ESP32");
  Serial.println("=========================================");
  Serial.printf("Device ID: %s\n", config.DEVICE_ID);
  Serial.printf("Server: %s\n", config.SERVER_URL);
  Serial.println("Build: " __DATE__ " " __TIME__);
  Serial.printf("Free Heap: %d KB\n", ESP.getFreeHeap() / 1024);
  Serial.println("=========================================");
  

  Serial.begin(115200);
  delay(300);
  config.print();

  gps.begin();
  rfid.begin();
  mp3.begin();
  wifi.connect();

  sender.send(0, 0, 0, 0, 999);  // dummy handshake

  watchdog.begin();
}



void loop() {
  watchdog.feed();

  String rfidCardId = rfid.readCard();
  if (rfidCardId) {
    Logger::info(rfidCardId);
  }




  delay(500);
}
