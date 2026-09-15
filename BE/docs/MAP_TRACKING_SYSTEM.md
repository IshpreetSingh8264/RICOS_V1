# 🗺️ Live Map Tracking & Disaster Area System

## Overview
Complete system for live responder tracking and disaster area mapping with real-time updates.

---

## 📊 Database Schema

### 1. ResponderLocation (Live Tracking)
```prisma
model ResponderLocation {
  id            String   @id @default(uuid())
  responder_id  String
  latitude      Float
  longitude     Float
  accuracy      Float?
  status        String   // available, deployed, rescuing, offline
  battery_level Int?
  timestamp     DateTime @default(now())
}
```

### 2. DisasterReport (Area Submissions)
```prisma
model DisasterReport {
  id                   String   @id @default(uuid())
  responder_id         String
  pincode              String?
  city                 String?
  village              String?
  latitude             Float?
  longitude            Float?
  severity             String   // LOW, MODERATE, SEVERE
  water_level          String?
  affected_population  Int?
  stuck_people_found   Boolean
  resources_needed     String?
  notes                String?
  images               String?  // JSON array
  polygon              Json?    // GeoJSON from pincode
  status               String   // pending, approved, rejected
  approved_by          String?
  approved_at          DateTime?
}
```

### 3. PincodePolygon (Geographic Data)
```prisma
model PincodePolygon {
  id        String @id
  pincode   String @unique
  state     String
  district  String?
  polygon   Json   // GeoJSON polygon
}
```

---

## 🚀 API Endpoints

### 1. Update Responder Location
**POST** `/map/location`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "latitude": 30.900965,
  "longitude": 75.857277,
  "accuracy": 15.5,
  "status": "deployed",
  "battery_level": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

**Status Values:**
- `available` - Team is ready
- `deployed` - Team is on mission
- `rescuing` - Actively rescuing
- `offline` - Not available

---

### 2. Submit Disaster Report
**POST** `/map/report`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "pincode": "144001",
  "severity": "SEVERE",
  "water_level": "5 feet",
  "affected_population": 120,
  "stuck_people_found": true,
  "resources_needed": ["food", "medical", "rescue_boat"],
  "notes": "Urgent rescue needed in Block C",
  "images": ["url1", "url2"]
}
```

**OR** (with GPS):
```json
{
  "latitude": 30.900965,
  "longitude": 75.857277,
  "city": "Ludhiana",
  "severity": "MODERATE",
  "affected_population": 50,
  "resources_needed": ["food", "water"]
}
```

**Response:**
```json
{
  "success": true,
  "report_id": "uuid-here"
}
```

---

### 3. Get Live Map Data
**GET** `/map/live`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "responders": [
    {
      "responder_id": "resp-001",
      "responder_name": "Rescue Squad Ludhiana",
      "responder_type": "ngo",
      "latitude": 30.900965,
      "longitude": 75.857277,
      "status": "deployed",
      "battery_level": 75,
      "last_updated": "2025-11-16T10:30:00Z"
    }
  ],
  "disaster_areas": [
    {
      "report_id": "rep-001",
      "pincode": "144001",
      "severity": "SEVERE",
      "affected_population": 120,
      "polygon": { /* GeoJSON */ },
      "status": "approved",
      "submitted_by": "resp-001",
      "timestamp": "2025-11-16T09:00:00Z"
    }
  ]
}
```

---

### 4. Get Pending Reports (Admin Only)
**GET** `/map/reports/pending`

**Response:**
```json
{
  "success": true,
  "reports": [ /* all pending reports */ ]
}
```

---

### 5. Approve/Reject Report (Admin Only)
**PATCH** `/map/reports/:id/approve`

**Body:**
```json
{
  "status": "approved"  // or "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report approved",
  "report": { /* updated report */ }
}
```

---

## 🎯 Frontend Integration

### 1. Real-Time Location Updates (Responder App)

```typescript
// Send location every 10 seconds
setInterval(async () => {
  const position = await getCurrentPosition();
  
  await fetch('http://localhost:8080/map/location', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      status: 'deployed',
      battery_level: await getBatteryLevel()
    })
  });
}, 10000);
```

### 2. Submit Disaster Report

```typescript
const submitReport = async (data) => {
  const response = await fetch('http://localhost:8080/map/report', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pincode: data.pincode,
      severity: data.severity, // LOW, MODERATE, SEVERE
      water_level: data.waterLevel,
      affected_population: data.affectedCount,
      stuck_people_found: data.stuckPeople,
      resources_needed: data.resources, // array
      notes: data.notes,
      images: data.imageUrls // array
    })
  });
  
  return response.json();
};
```

### 3. Display Live Map

```typescript
import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';

function LiveDisasterMap() {
  const [mapData, setMapData] = useState(null);
  
  // Fetch initial data
  useEffect(() => {
    fetchMapData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchMapData = async () => {
    const response = await fetch('http://localhost:8080/map/live', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setMapData(data);
  };
  
  if (!mapData) return <div>Loading map...</div>;
  
  return (
    <Map
      initialViewState={{
        latitude: 30.9,
        longitude: 75.85,
        zoom: 10
      }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {/* Render responder markers */}
      {mapData.responders.map(responder => (
        <Marker
          key={responder.responder_id}
          latitude={responder.latitude}
          longitude={responder.longitude}
        >
          <div className={`responder-marker ${responder.status}`}>
            🚑
          </div>
        </Marker>
      ))}
      
      {/* Render disaster area polygons */}
      {mapData.disaster_areas.map(area => (
        area.polygon && (
          <Source
            key={area.report_id}
            type="geojson"
            data={area.polygon}
          >
            <Layer
              type="fill"
              paint={{
                'fill-color': 
                  area.severity === 'SEVERE' ? '#ff0000' :
                  area.severity === 'MODERATE' ? '#ff8800' :
                  '#ffff00',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              type="line"
              paint={{
                'line-color': '#000',
                'line-width': 2
              }}
            />
          </Source>
        )
      ))}
    </Map>
  );
}
```

---

## 🔄 Complete Workflow

### Responder Team Flow:
1. **Login** → Get JWT token
2. **Enable GPS** → Start sending location every 10 seconds
3. **Encounter disaster** → Fill form with pincode/GPS + severity
4. **Submit report** → Goes to pending queue
5. **Admin approves** → Appears on live map instantly

### Admin Flow:
1. **View pending reports** → `GET /map/reports/pending`
2. **Review details** → Check severity, photos, location
3. **Approve/Reject** → `PATCH /map/reports/:id/approve`
4. **Approved areas** → Show on public map

### Map Display Flow:
1. **Load initial data** → All responders + approved areas
2. **Poll updates** → Every 30 seconds refresh
3. **Render markers** → Different colors for status
4. **Render polygons** → Color-coded by severity (🟥🟧🟨)

---

## 📱 Recommended Update Frequencies

| Action | Frequency | Reason |
|--------|-----------|--------|
| Location updates | 10 seconds | Balance between real-time & battery |
| Map data refresh | 30 seconds | Keep UI responsive |
| Battery check | 60 seconds | Avoid excessive drain |

---

## 🎨 Color Coding

### Responder Status:
- 🟢 Available (green)
- 🔵 Deployed (blue)
- 🔴 Rescuing (red)
- ⚫ Offline (gray)

### Disaster Severity:
- 🟥 SEVERE (red, opacity 0.4)
- 🟧 MODERATE (orange, opacity 0.3)
- 🟨 LOW (yellow, opacity 0.2)

---

## 🔐 Security Notes

1. **All endpoints require JWT authentication**
2. **Only responders can submit reports**
3. **Only admins can approve/reject reports**
4. **Location data is encrypted in transit**
5. **Images should be uploaded to separate storage (S3/Cloudinary)**

---

## 🚀 Setup Steps

1. **Run migration:**
   ```bash
   cd BE
   npx prisma migrate dev --name add_map_tracking_tables
   npx prisma generate
   ```

2. **Ensure GeoJSON data exists:**
   ```
   BE/geojsonData/data.geojson
   ```

3. **Restart backend:**
   ```bash
   npm run start:dev user_backend
   ```

4. **Test endpoints:**
   - Login as responder
   - Send location update
   - Submit disaster report
   - Check live map data

---

## 📊 Performance Considerations

1. **Indexing:** Already added on `responder_id`, `pincode`, `status`, `severity`
2. **Caching:** Consider Redis for live map data
3. **WebSockets:** For true real-time, implement Socket.IO
4. **Pagination:** Add to pending reports if volume is high

---

## 🎯 Next Steps

1. ✅ Database schema created
2. ✅ API endpoints implemented
3. ⏳ Run Prisma migration
4. ⏳ Test with Postman
5. ⏳ Implement frontend map
6. ⏳ Add WebSocket support (optional)
7. ⏳ Deploy to production

---

**The system is ready to track responders live and display disaster areas on a map! 🗺️**
