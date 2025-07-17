#pragma once
#include <esp_task_wdt.h>

class WatchdogManager {
public:
  WatchdogManager(uint32_t timeoutSeconds = 10) 
    : _timeout(timeoutSeconds) {}

  void begin() {
    esp_task_wdt_deinit();  // Eski watchdog'u iptal et
    esp_task_wdt_config_t config = {
      .timeout_ms = _timeout * 1000,
      .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
      .trigger_panic = true
    };
    esp_task_wdt_init(&config);
    esp_task_wdt_add(NULL); // Mevcut task'i kaydet
    _lastFeed = millis();
  }

  void feed() {
    esp_task_wdt_reset();
    _lastFeed = millis();
  }

  unsigned long timeSinceLastFeed() const {
    return millis() - _lastFeed;
  }

private:
  uint32_t _timeout;
  unsigned long _lastFeed = 0;
};
