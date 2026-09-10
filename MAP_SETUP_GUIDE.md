# 🚀 MAP TRACKING SYSTEM - SETUP & TEST GUIDE

## Prerequisites Checklist

### 1. ✅ Run Prisma Migration
```bash
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1/BE
npx prisma migrate dev --name add_map_tracking_tables
npx prisma generate
```

### 2. ✅ Ensure GeoJSON Data Exists
Check that this file exists:
```
/home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1/BE/geojsonData/data.geojson
```

### 3. ✅ Install Python Dependencies
```bash
pip3 install requests
```

### 4. ✅ Start Backend Services
```bash
# Terminal 1: Common auth service
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1/BE
npm run start:dev common

# Terminal 2: User backend
npm run start:dev user_backend
```

### 5. ✅ Create a Responder User
You need a user with responder privileges. Use one of these:
- **NGO user** (already has responder record)
- **Government user** (already has responder record)
- **Volunteer user** (already has responder record)

Default test user: `john@example.com / SecurePass123`

---

## Running the Test

```bash
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1
python3 test_map_tracking.py
```

### Test Flow:
1. **Login** - Authenticate as responder
2. **Update Location** - Send initial GPS coordinates
3. **Simulate Movement** - Send 3 location updates (10s interval simulation)
4. **Submit Disaster Report** - Report with pincode (gets polygon automatically)
5. **Submit GPS Report** - Report without pincode (GPS-based)
6. **Get Live Map Data** - Fetch all responders + approved areas
7. **Get Pending Reports** - View reports awaiting approval
8. **Approve Report** - Admin action to approve disaster area

---

## Expected Output

```
╔════════════════════════════════════════════════════════════════════╗
║       LIVE MAP TRACKING & DISASTER AREA - COMPREHENSIVE TEST      ║
╚════════════════════════════════════════════════════════════════════╝

============================================================
                 STEP 1: LOGIN AS RESPONDER                  
============================================================

✓ Login successful!
ℹ Token: eyJhbGciOiJIUzI1NiIs...

============================================================
             STEP 2: UPDATE RESPONDER LOCATION                
============================================================

ℹ Sending location: 30.900965, 75.857277
ℹ Status: available
✓ Location updated successfully

============================================================
             STEP 3: SIMULATE RESPONDER MOVEMENT             
============================================================

ℹ Update 1/3: Moving to 30.900965, 75.857277
✓ Location 1 updated - Status: deployed
ℹ Update 2/3: Moving to 30.9015, 75.858
✓ Location 2 updated - Status: deployed
ℹ Update 3/3: Moving to 30.902, 75.859
✓ Location 3 updated - Status: rescuing
✓ Movement simulation completed

...and so on
```

---

## Troubleshooting

### Error: "Property 'responderLocation' does not exist"
**Solution:** Run Prisma migration and generate:
```bash
cd BE
npx prisma migrate dev --name add_map_tracking_tables
npx prisma generate
npm run start:dev user_backend  # restart
```

### Error: "Responder not found for this user"
**Solution:** The user must be an NGO/Govt/Volunteer with a responder record. Check:
```sql
SELECT * FROM responders WHERE ngo_id = 'your-ngo-id';
```

### Error: "Failed to load pincode data"
**Solution:** Ensure `BE/geojsonData/data.geojson` exists with proper format:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "pincode": "144001",
        "state": "Punjab",
        "district": "Ludhiana"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### Error: Connection refused on port 8080
**Solution:** Start the user backend:
```bash
cd BE
npm run start:dev user_backend
```

---

## Quick Test Command

For fastest testing (with defaults):
```bash
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1
python3 test_map_tracking.py
# Press Enter 3 times to use defaults
```

---

## What Gets Tested

✅ **Location Updates**
- Initial location set
- Real-time movement tracking (3 updates)
- Status changes (available → deployed → rescuing)
- Battery level tracking

✅ **Disaster Reports**
- Pincode-based report (auto-loads polygon)
- GPS-based report (no pincode)
- Severity levels (SEVERE, MODERATE, LOW)
- Resource requirements tracking
- Population count

✅ **Live Map Data**
- All active responders with last location
- All approved disaster areas
- Polygon data for map rendering
- Real-time status

✅ **Admin Workflow**
- View pending reports
- Approve/reject reports
- Reports appear on map after approval

---

## After Successful Test

You can integrate the map frontend with these endpoints:

### Real-time Location Updates (Every 10 seconds):
```javascript
POST /map/location
{
  "latitude": 30.900965,
  "longitude": 75.857277,
  "status": "deployed",
  "battery_level": 75
}
```

### Submit Disaster Report:
```javascript
POST /map/report
{
  "pincode": "144001",
  "severity": "SEVERE",
  "affected_population": 120
}
```

### Get Live Map Data:
```javascript
GET /map/live
// Returns all responders + approved disaster areas
```

---

## Next Steps

1. ✅ Run migration
2. ✅ Run test script
3. ✅ Verify all tests pass
4. 🔄 Implement frontend map with MapLibre/Mapbox
5. 🔄 Add WebSocket support for true real-time (optional)
6. 🔄 Deploy to production

---

**System is ready for live responder tracking! 🗺️🚀**
