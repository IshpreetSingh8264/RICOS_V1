# Nearby Pincode Fallback Feature

## Overview
The map tracking system now includes an intelligent pincode fallback mechanism. When a disaster report is submitted with a pincode that doesn't have exact GeoJSON polygon data, the system automatically searches for the nearest available pincode within a ±10 range.

## How It Works

### Algorithm
1. **Exact Match First**: The system first attempts to find an exact match for the requested pincode
2. **Nearby Search**: If no exact match is found, it searches for pincodes within ±10 range
3. **Closest Match**: Returns the closest available pincode (prioritizes smallest numerical difference)
4. **Feedback**: Logs the fallback and returns a message to the user

### Example Scenarios

#### Scenario 1: Exact Match
```json
Request: { "pincode": "144001" }
Result: Uses pincode 144001 polygon (if exists)
Message: None (exact match)
```

#### Scenario 2: Nearby Fallback
```json
Request: { "pincode": "141002" }
Result: Uses pincode 141001 or 141003 polygon (whichever exists)
Message: "Pincode 141002 not found. Using nearby pincode 141001 (Ludhiana, Punjab)"
```

#### Scenario 3: No Match
```json
Request: { "pincode": "999999" }
Result: No polygon attached (GPS-based report only)
Message: Warning logged
```

## Implementation Details

### Code Location
`BE/apps/user_backend/src/map/map.service.ts`

### Key Methods

#### `findNearbyPincode(targetPincode: string)`
```typescript
private findNearbyPincode(targetPincode: string): any | null {
  // 1. Try exact match
  // 2. Parse pincode as number
  // 3. Search ±10 range
  // 4. Return closest match
}
```

#### Updated `submitDisasterReport()`
```typescript
async submitDisasterReport(
  responderId: string,
  dto: SubmitDisasterReportDto,
): Promise<{ success: boolean; report_id: string; message?: string }>
```

### Search Range
- **Default Range**: ±10 pincodes
- **Example**: For pincode 141002, searches:
  - Lower: 141001, 141000, 140999, ...
  - Higher: 141003, 141004, 141005, ...

## Response Format

### Exact Match Response
```json
{
  "success": true,
  "report_id": "uuid-here"
}
```

### Nearby Pincode Response
```json
{
  "success": true,
  "report_id": "uuid-here",
  "message": "Pincode 141002 not found. Using nearby pincode 141001 (Ludhiana, Punjab)"
}
```

## Testing

### Test Script
Use `test_nearby_pincode.py` to test the fallback functionality:

```bash
python3 test_nearby_pincode.py
```

### Test Cases
1. **Exact Match**: 144001 (Jalandhar area)
2. **Nearby Fallback**: 141002 → finds 141001 or 141003
3. **Delhi Area**: 110999 → finds nearby Delhi pincode

### Manual Testing
```bash
curl -X POST http://localhost:8080/map/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "141002",
    "severity": "MODERATE",
    "water_level": "2 feet",
    "affected_population": 50,
    "resources_needed": ["food", "water"],
    "notes": "Testing nearby pincode"
  }'
```

## Benefits

### 1. **User Experience**
- Responders don't need to know exact pincodes
- Approximate area information is sufficient
- Reduces submission errors

### 2. **Data Coverage**
- Fills gaps in GeoJSON data
- Provides polygons for nearby areas
- Better map visualization

### 3. **Flexibility**
- Works with incomplete pincode databases
- Gracefully handles missing data
- Falls back to GPS-based reports if needed

## Logging

### Server Logs
```
[MapService] Pincode 141002 not found, using nearby 141001 (distance: 1)
[MapService] No pincode data found for 999999 or nearby areas
```

### Client Messages
The API response includes a `message` field when fallback occurs:
```json
{
  "message": "Pincode 141002 not found. Using nearby pincode 141001 (Ludhiana, Punjab)"
}
```

## Frontend Integration

### Display Fallback Message
```typescript
const response = await submitDisasterReport(reportData);

if (response.message) {
  // Show info toast/notification
  showInfo(response.message);
}
```

### Example UI Message
```
ℹ️ Pincode 141002 not found. Using nearby pincode 141001 (Ludhiana, Punjab)
✓ Report submitted successfully
```

## Configuration

### Adjusting Search Range
Edit the `searchRange` variable in `findNearbyPincode()`:

```typescript
const searchRange = 10;  // Change to 5, 15, 20, etc.
```

### Disabling Fallback
To disable and only use exact matches:

```typescript
if (dto.pincode) {
  const pincodeInfo = this.pincodeData.get(dto.pincode);  // Only exact match
  if (pincodeInfo) {
    polygon = pincodeInfo.polygon;
  }
}
```

## Performance

- **Search Time**: O(n) where n = searchRange (typically 10)
- **Memory**: No additional storage (uses existing Map)
- **Impact**: Negligible (< 1ms for ±10 range)

## Future Enhancements

### Potential Improvements
1. **Geographic Distance**: Use lat/lng instead of numerical difference
2. **Caching**: Cache nearby pincode results
3. **Configurable Range**: Make search range configurable per request
4. **Weighted Search**: Prefer pincodes in same district/state

### Example Geographic Search
```typescript
// Future enhancement: calculate actual geographic distance
const distance = calculateDistance(
  targetLat, targetLng,
  pincodeLat, pincodeLng
);
```

## Summary

The nearby pincode fallback feature makes the disaster reporting system more robust and user-friendly by:
- Automatically finding closest available pincode data
- Providing clear feedback to users
- Filling gaps in GeoJSON coverage
- Maintaining data quality with GPS coordinates

This ensures that responders can submit reports even when exact pincode data is unavailable, while still providing valuable polygon information for map visualization.
