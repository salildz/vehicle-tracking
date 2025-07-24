#pragma once
#include <WiFi.h>
#include <Arduino.h>

class WifiManager {
public:
  WifiManager(const char* ssid, const char* password, const int maxRetry)
    : _ssid(ssid), _password(password), _maxRetry(maxRetry), _lastConnectionAttempt(0), 
      _connectionAttempts(0), _isInitialized(false) {}

  // Primary connection method
  bool connect(uint32_t timeoutMs = 15000) {
    if (!_ssid || !_password) {
      Serial.println("ERROR: WiFi credentials not set");
      return false;
    }

    Serial.printf("Connecting to WiFi: %s\n", _ssid);
    
    // Proper WiFi initialization
    if (!_isInitialized) {
      WiFi.mode(WIFI_OFF);
      delay(500);
      WiFi.mode(WIFI_STA);
      WiFi.setAutoReconnect(false);
      WiFi.persistent(false);
      _isInitialized = true;
    }

    // Start connection
    WiFi.begin(_ssid, _password);
    
    unsigned long startTime = millis();
    int dotCount = 0;
    wl_status_t lastStatus = WL_IDLE_STATUS;
    
    while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < timeoutMs) {
      delay(300);
      Serial.print(".");
      dotCount++;
      
      wl_status_t currentStatus = WiFi.status();
      
      // Handle connection failures immediately
      if (currentStatus == WL_CONNECT_FAILED) {
        Serial.print("\nConnection failed, retrying...");
        WiFi.disconnect();
        delay(1000);
        WiFi.begin(_ssid, _password);
      }
      
      // Progress indicator every 10 dots
      if (dotCount % 10 == 0) {
        Serial.printf(" [%ds]", (millis() - startTime) / 1000);
        Serial.println();
      }
      
      lastStatus = currentStatus;
    }
    
    Serial.println();
    
    _lastConnectionAttempt = millis();
    
    if (WiFi.status() == WL_CONNECTED) {
      _connectionAttempts = 0;
      WiFi.setAutoReconnect(true);
      printConnectionInfo();
      return true;
    } else {
      _connectionAttempts++;
      Serial.printf("Connection failed after %ds (Status: %s)\n", 
                   timeoutMs / 1000, getStatusString().c_str());
      return false;
    }
  }

  // Smart reconnection with backoff
  bool reconnect(uint8_t maxAttempts = 3, uint32_t baseDelayMs = 2000) {
    // Don't attempt reconnection too frequently
    if (millis() - _lastConnectionAttempt < 5000) {
      return false;
    }

    Serial.printf("WiFi reconnecting (attempt %d)...\n", _connectionAttempts + 1);
    
    for (uint8_t attempt = 0; attempt < maxAttempts; attempt++) {
      Serial.printf("  Attempt %d/%d\n", attempt + 1, maxAttempts);
      
      // Reset WiFi state
      WiFi.disconnect(true);
      delay(1000);
      
      // Exponential backoff delay
      uint32_t delayTime = baseDelayMs * (1 << attempt); // 2s, 4s, 8s
      if (attempt > 0) {
        Serial.printf("  Waiting %ds before retry...\n", delayTime / 1000);
        delay(delayTime);
      }
      
      if (connect(10000)) { // 10 second timeout per attempt
        Serial.println("Reconnection successful");
        return true;
      }
    }
    
    Serial.println("All reconnection attempts failed");
    return false;
  }

  // Check connection status
  bool isConnected() const {
    return WiFi.status() == WL_CONNECTED;
  }

  // Get connection strength
  int getRSSI() const {
    return isConnected() ? WiFi.RSSI() : -999;
  }

  // Get IP address
  String getIP() const {
    return isConnected() ? WiFi.localIP().toString() : "0.0.0.0";
  }

  // Get SSID
  String getSSID() const {
    return isConnected() ? WiFi.SSID() : "None";
  }

  // Get MAC address
  String getMAC() const {
    return WiFi.macAddress();
  }

  // Signal quality assessment
  String getSignalQuality() const {
    if (!isConnected()) return "Disconnected";
    
    int rssi = WiFi.RSSI();
    if (rssi > -50) return "Excellent";
    if (rssi > -60) return "Good";
    if (rssi > -70) return "Fair";
    if (rssi > -80) return "Weak";
    return "Very Weak";
  }

  // Get detailed status string
  String getStatusString() const {
    switch (WiFi.status()) {
      case WL_CONNECTED: return "Connected";
      case WL_NO_SSID_AVAIL: return "Network not found";
      case WL_CONNECT_FAILED: return "Connection failed";
      case WL_CONNECTION_LOST: return "Connection lost";
      case WL_DISCONNECTED: return "Disconnected";
      case WL_IDLE_STATUS: return "Idle";
      case WL_SCAN_COMPLETED: return "Scan completed";
      default: return "Unknown (" + String(WiFi.status()) + ")";
    }
  }

  // Connection statistics
  uint32_t getConnectionAttempts() const {
    return _connectionAttempts;
  }

  unsigned long getLastAttemptTime() const {
    return _lastConnectionAttempt;
  }

  // Check if should attempt reconnection
  bool shouldReconnect() const {
    return !isConnected() && 
           (millis() - _lastConnectionAttempt > 10000) && // Wait 10s between attempts
           (_connectionAttempts < _maxRetry); // Don't spam attempts
  }

  // Reset connection statistics
  void resetStats() {
    _connectionAttempts = 0;
    _lastConnectionAttempt = 0;
  }

  // Scan for available networks (safe implementation)
  int scanNetworks(bool showResults = true) {
    if (!_isInitialized) {
      WiFi.mode(WIFI_STA);
      _isInitialized = true;
    }

    Serial.println("Scanning for networks...");
    
    int networks = WiFi.scanNetworks(false, false, false, 300);
    
    if (networks == 0) {
      Serial.println("No networks found");
      return 0;
    }
    
    if (showResults) {
      Serial.printf("Found %d networks:\n", networks);
      for (int i = 0; i < networks; i++) {
        String ssid = WiFi.SSID(i);
        int32_t rssi = WiFi.RSSI(i);
        String security = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Secured";
        
        Serial.printf("  %d: %s (%d dBm) %s", i + 1, ssid.c_str(), rssi, security.c_str());
        
        if (ssid.equals(_ssid)) {
          Serial.print(" <- TARGET");
        }
        Serial.println();
      }
    }
    
    WiFi.scanDelete(); // Clean up
    return networks;
  }

  // Print detailed connection information
  void printConnectionInfo() const {
    if (!isConnected()) {
      Serial.println("WiFi not connected");
      return;
    }
    
    Serial.println("WiFi connected successfully!");
    Serial.printf("  SSID: %s\n", WiFi.SSID().c_str());
    Serial.printf("  IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  Gateway: %s\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("  DNS: %s\n", WiFi.dnsIP().toString().c_str());
    Serial.printf("  Signal: %d dBm (%s)\n", WiFi.RSSI(), getSignalQuality().c_str());
    Serial.printf("  Channel: %d\n", WiFi.channel());
    Serial.printf("  MAC: %s\n", WiFi.macAddress().c_str());
  }

  // Print status summary
  void printStatus() const {
    Serial.println("=== WiFi Status ===");
    Serial.printf("Status: %s\n", getStatusString().c_str());
    Serial.printf("SSID: %s\n", getSSID().c_str());
    Serial.printf("IP: %s\n", getIP().c_str());
    Serial.printf("Signal: %d dBm (%s)\n", getRSSI(), getSignalQuality().c_str());
    Serial.printf("Connection Attempts: %d\n", _connectionAttempts);
    Serial.printf("Last Attempt: %lus ago\n", (millis() - _lastConnectionAttempt) / 1000);
    Serial.println("==================");
  }

  // Safe disconnect
  void disconnect() {
    if (isConnected()) {
      Serial.println("Disconnecting WiFi...");
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      _isInitialized = false;
    }
  }

  // Check if network is available (without full scan)
  bool isNetworkAvailable() const {
    return WiFi.scanComplete() >= 0 && WiFi.SSID().equals(_ssid);
  }

private:
  const char* _ssid;
  const char* _password;
  const int _maxRetry;
  unsigned long _lastConnectionAttempt;
  uint32_t _connectionAttempts;
  bool _isInitialized;
};