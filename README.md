# 🚗 Vehicle Tracking System

A comprehensive real-time vehicle tracking and fleet management system built with modern technologies. This system provides live GPS tracking, driver authentication via RFID, route analytics, and comprehensive fleet management capabilities.

## 🌟 Features

### 🔍 Real-time Tracking
- **Live GPS Monitoring**: Real-time vehicle location tracking with WebSocket connections
- **Interactive Maps**: Leaflet-based maps with custom vehicle markers and route visualization
- **Multi-vehicle Dashboard**: Monitor entire fleet simultaneously with status indicators
- **Automatic Session Management**: Smart session handling based on GPS and RFID data

### 👤 Driver Management
- **RFID Authentication**: Secure driver identification using RFID cards
- **Driver Profiles**: Complete driver information management
- **Session Authorization**: Automatic authorized/unauthorized session classification
- **Driver Performance Analytics**: Individual driver statistics and performance metrics

### 🚛 Fleet Management
- **Vehicle Registration**: Complete vehicle information with ESP32 device mapping
- **Fleet Overview**: Real-time status of all vehicles in the fleet
- **Vehicle Analytics**: Individual vehicle performance and usage statistics
- **Maintenance Tracking**: Vehicle usage data for maintenance scheduling

### 📊 Analytics & Reporting
- **Route History**: Complete journey replay with speed and location data
- **Performance Metrics**: Distance, time, and efficiency analytics
- **Daily/Weekly/Monthly Reports**: Comprehensive reporting system
- **Export Capabilities**: Data export for external analysis
- **Interactive Charts**: Beautiful visualizations using Recharts

### 🔧 Hardware Integration
- **ESP32 Integration**: Custom firmware for GPS and RFID data collection
- **GPS Module Support**: High-accuracy GPS tracking with quality indicators
- **RFID Reader**: MFRC522 RFID module for driver authentication
- **Audio Feedback**: MP3 player for system status notifications
- **Watchdog System**: Hardware reliability and auto-recovery

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Device  │    │   Backend API   │    │  React Client   │
│                 │    │                 │    │                 │
│ • GPS Module    │───▶│ • Express.js    │◀───│ • Material-UI   │
│ • RFID Reader   │    │ • PostgreSQL    │    │ • Leaflet Maps  │
│ • WiFi          │    │ • Socket.IO     │    │ • Real-time UI  │
│ • Audio Alert   │    │ • Sequelize ORM │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 19** with TypeScript
- **Material-UI v7** for modern UI components
- **Leaflet** for interactive maps
- **Socket.IO Client** for real-time communication
- **Recharts** for data visualization
- **Axios** for API communication

#### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Sequelize ORM
- **Socket.IO** for real-time communication
- **Winston** for logging
- **Helmet** & rate limiting for security

#### Hardware
- **ESP32** microcontroller
- **GPS Module** (UART communication)
- **MFRC522 RFID Reader** (SPI communication)
- **MP3 Player Module** for audio feedback
- **Custom C++ firmware** with modular design

#### DevOps
- **Docker Compose** for containerization
- **PostgreSQL** database with optimized indexes
- **Environment-based configuration**
- **Graceful shutdown handling**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- ESP32 development environment (Arduino IDE or PlatformIO)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vehicle-tracking.git
cd vehicle-tracking
```

### 2. Environment Setup
Create `.env` file in the root directory:
```env
# Database
DB_HOST=db
DB_PORT=9042
DB_NAME=vehicle_tracking
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=9040
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here

# Client
CLIENT_URL=http://localhost:9041
SOCKET_URL=http://localhost:9040
```

### 3. Start with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Manual Setup (Alternative)

#### Backend Setup
```bash
cd server
npm install
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm run dev
```

#### Database Setup
```bash
# Create PostgreSQL database
createdb vehicle_tracking

# Database will auto-sync on first run
```

### 5. ESP32 Firmware Setup
1. Open `esp32/main/main.ino` in Arduino IDE
2. Install required libraries:
   - TinyGPS++
   - MFRC522
   - WiFi (ESP32 core)
3. Update `SystemConfig.h` with your WiFi credentials and server URL
4. Flash to ESP32 device

## 📱 Usage

### Web Dashboard
1. Navigate to `http://localhost:9041`
2. Login with admin credentials
3. Access different modules:
   - **Dashboard**: Overview of system status
   - **Live Tracking**: Real-time vehicle monitoring
   - **Analytics**: Performance reports and charts
   - **Drivers**: Driver management
   - **Vehicles**: Fleet management
   - **Route History**: Historical journey data

### ESP32 Device Operation
1. **Power On**: Device initializes and connects to WiFi
2. **GPS Acquisition**: Waits for GPS fix (uses default coordinates if no fix)
3. **RFID Ready**: Scans for driver cards continuously
4. **Data Transmission**: Sends GPS data every 5 seconds
5. **Session Management**: Automatically manages driving sessions

### RFID Card Setup
1. Register drivers in the web dashboard
2. Associate RFID card IDs with driver profiles
3. Cards are automatically recognized when scanned

## 🔧 Configuration

### ESP32 Configuration
Modify `esp32/main/SystemConfig.h`:
```cpp
// WiFi Settings
const char* WIFI_SSID = "YourWiFiNetwork";
const char* WIFI_PASSWORD = "YourPassword";

// Server Settings
const char* SERVER_URL = "http://your-server.com/api/device/gps-data";

// Timing Settings
const unsigned long SEND_INTERVAL_MS = 5000;  // GPS data interval
const unsigned long RFID_DEBOUNCE_MS = 1000;  // RFID scan interval
```

## 📊 API Documentation

### Device Endpoints
```http
POST /api/device/gps-data
Content-Type: application/json

{
  "deviceId": "ESP32-001",
  "latitude": 41.0082,
  "longitude": 28.9784,
  "speed": 45.5,
  "heading": 180.0,
  "accuracy": 3.5,
  "rfidCardId": "A1B2C3D4"  // Optional
}
```

### Management Endpoints
- `GET /api/drivers` - List all drivers
- `POST /api/drivers` - Create new driver
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Register new vehicle
- `GET /api/analytics/sessions` - Get session history
- `GET /api/analytics/daily-stats` - Get daily statistics

### WebSocket Events
- `locationUpdate` - Real-time GPS updates
- `sessionStarted` - New session notifications
- `sessionEnded` - Session completion
- `driverChanged` - Driver change events

## 🏭 Database Schema

### Core Tables
- **drivers**: Driver information and RFID mapping
- **vehicles**: Vehicle registration with ESP32 device IDs
- **driving_sessions**: Trip sessions with start/end times
- **location_logs**: GPS coordinate history with timestamps

### Key Relationships
```sql
drivers 1:N driving_sessions
vehicles 1:N driving_sessions  
driving_sessions 1:N location_logs
```

## 🛠️ Development

### Project Structure
```
vehicle-tracking/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration files
│   └── package.json
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json
├── esp32/                  # Hardware firmware
│   └── main/               # Arduino sketch files
├── docker-compose.yml      # Container orchestration
└── README.md
```

### Development Commands
```bash
# Backend development
cd server && npm run dev

# Frontend development  
cd client && npm run dev

# Build for production
npm run build

# Database migrations
npm run db:migrate

# Run tests
npm test
```

### Adding New Features
1. **Backend**: Add routes in `server/src/routes/`
2. **Frontend**: Create components in `client/src/components/`
3. **Hardware**: Extend modules in `esp32/main/`
4. **Database**: Update models in `server/src/models/`

## 🔒 Security Features

- **Rate Limiting**: API endpoint protection
- **Input Sanitization**: SQL injection prevention
- **CORS Configuration**: Cross-origin request security
- **Security Headers**: Helmet.js implementation
- **Authentication**: JWT-based auth system
- **Request Validation**: Express-validator middleware

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries for location data
- **Real-time Updates**: Efficient WebSocket implementation
- **Memory Management**: ESP32 watchdog and cleanup
- **Caching**: Strategic data caching for analytics
- **Lazy Loading**: Component-based code splitting

## 🔍 Monitoring & Debugging

### Logging
- **Server**: Winston-based structured logging
- **ESP32**: Serial output with debug levels
- **Client**: Browser console with error boundaries

### Health Checks
- `/health` endpoint for server status
- ESP32 system health reporting
- Database connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ESLint configuration for TypeScript
- Prettier for code formatting
- Conventional commits preferred

## 🚨 Troubleshooting

### Common Issues

#### ESP32 Won't Connect
- Check WiFi credentials in `SystemConfig.h`
- Verify server URL accessibility
- Check serial monitor for error messages

#### Database Connection Errors
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

#### Real-time Updates Not Working
- Check WebSocket connection in browser dev tools
- Verify server Socket.IO configuration
- Check firewall settings

#### GPS Not Working
- Verify GPS module wiring
- Check for clear sky view
- Monitor serial output for GPS data

### Support
For issues and questions:
- Check existing [GitHub Issues](https://github.com/yourusername/vehicle-tracking/issues)
- Create new issue with detailed description
- Include logs and system information

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app for drivers
- [ ] Geofencing and alerts
- [ ] Advanced analytics with AI
- [ ] Multi-tenant support
- [ ] Advanced reporting system
- [ ] Integration with third-party APIs

### Hardware Enhancements
- [ ] 4G/LTE module support
- [ ] OBD-II integration
- [ ] Fuel consumption tracking
- [ ] Temperature sensors
- [ ] Camera integration

---
