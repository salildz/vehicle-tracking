#pragma once
#include <Arduino.h>

class Logger {
public:
  enum Level { INFO, WARN, ERROR };

  static void log(Level level, const String& msg) {
    const char* prefix =
      (level == INFO)  ? "[INFO] " :
      (level == WARN)  ? "[WARN] " :
                         "[ERROR]";
    Serial.println(String(prefix) + msg);
  }

  static void info(const String& msg)  { log(INFO, msg); }
  static void warn(const String& msg)  { log(WARN, msg); }
  static void error(const String& msg) { log(ERROR, msg); }
};
