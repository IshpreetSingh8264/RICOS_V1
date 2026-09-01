# RICOS - Real-time Inventory & Coordination System

## Overview
RICOS is a comprehensive disaster management platform designed to facilitate efficient resource allocation, team coordination, and disaster response. It connects Users, NGOs, Government bodies, and Volunteers in a unified ecosystem.

## 🚀 Key Features

### 1. Advanced Authentication System
- **Multi-role Support**: Seamless signup/signin for Users, NGOs, Government officials, and Volunteers.
- **Unified Login**: Centralized `AllUsers` table for secure credential management.
- **JWT Security**: Role-based access control with secure token management.
- **Smart Detection**: Automatic routing based on user type.

### 2. Inventory Management
- **Resource Tracking**: Real-time tracking of medical kits, food supplies, and equipment.
- **Smart Allocation**: Dynamic tracking of `total_quantity` vs `remaining_quantity`.
- **Ownership Control**: Strict role-based access for NGOs and Volunteers.
- **Automated Updates**: System-managed inventory levels based on group allocations.

### 3. Group & Team Management
- **Dynamic Teams**: Create specialized response units/groups on the fly.
- **Resource Provisioning**: Allocate inventory items directly to specific groups.
- **TTL Management**: Auto-expiry settings for temporary task forces (5, 20, 30 days).
- **Independent Access**: Dedicated login portals for field teams with auto-generated credentials.
- **Lifecycle Management**: Activate, deactivate, or disband teams with automatic resource recovery.

### 4. Interactive Mapping & Visualization
- **Live Responder Tracking**: Real-time GPS tracking of field units (NGOs, Volunteers).
- **Disaster Reporting**: Users and responders can submit reports with geolocation and photos.
- **Geospatial Visualization**: Color-coded disaster zones (Severity: Low 🟨, Moderate 🟧, Severe 🟥).
- **Admin Validation**: Verification system for disaster reports before public broadcast.
- **Live Map**: Interactive map powered by Mapbox/Leaflet with real-time updates.

### 5. News & Information
- **AI-Powered News**: Aggregates disaster news using Google News scraping (Selenium + undetected-chromedriver).
- **Smart Filtering**: Location-based news delivery relevant to the user's area.
- **Credibility Check**: Integrated LLM chat to verify news authenticity.
- **Real-time Updates**: 15-minute refresh intervals for latest information.

## 🛠️ Technical Architecture

### Microservices Backend (NestJS)
- **Common Service (Port 3000)**: Handles core authentication and authorization.
- **User Backend (Port 8080)**: Manages citizen-centric features and interactions.
- **Official Backend (Port 8081)**: Powers administrative functions for NGOs, Government, and Volunteers.

### Frontend (React + Vite)
- **Modern UI**: Built with Tailwind CSS and ShadCN UI components.
- **Responsive Design**: Mobile-first approach for field usage.
- **State Management**: Robust context-based state handling for auth and data.

### Database (PostgreSQL + Prisma)
- **Unified Schema**: Optimized relational schema for complex user-resource-group relationships.
- **Data Integrity**: strict foreign key constraints and transaction management.

## 🔒 Security Measures
- **Password Hashing**: Bcrypt encryption for all credentials.
- **Role Guards**: Strict API endpoint protection using custom decorators.
- **Data Isolation**: Organization-level data separation for privacy and security.
- **Token Management**: Secure JWT implementation with configurable expiry.

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- PostgreSQL
- Docker (optional)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run migrations: `npx prisma migrate dev`
5. Start services:
   ```bash
   npm run start:dev common
   npm run start:dev official_backend
   npm run start:dev user_backend
   ```

## 📚 Documentation
Detailed documentation is available in the `/docs` directory:
- `COMPLETE_API_DOCUMENTATION.md`: Full API reference
- `IMPLEMENTATION_SUMMARY.md`: Technical implementation details
- `auth-api.txt`: Authentication guide
- `MAP_TRACKING_SYSTEM.md`: Map & Tracking details
- `NEWS_API.md`: News API integration details

---
**Status**: Production Ready ✅
**Version**: 1.0.0
