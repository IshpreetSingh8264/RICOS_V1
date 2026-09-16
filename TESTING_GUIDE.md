# Quick Testing Guide for NGO Dashboard Updates

## Prerequisites
- Backend running on port 8081 (Official Backend)
- Frontend running (development server)
- Database with sample data (NGO accounts, groups, disaster reports)
- Valid JWT token for NGO/Govt/Volunteer user

## Step-by-Step Testing

### 1. Start the Backend
```powershell
cd BE
npm run start:official
```
Should start on `http://localhost:8081`

### 2. Start the Frontend
```powershell
cd FE
npm run dev
```
Should start on `http://localhost:5173` (or similar)

### 3. Test Dashboard Stats API

**Using curl (PowerShell):**
```powershell
# Replace <YOUR_TOKEN> with actual JWT token
$token = "<YOUR_TOKEN>"
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test dashboard stats
Invoke-WebRequest -Uri "http://localhost:8081/dashboard/stats" -Headers $headers -Method GET | ConvertFrom-Json

# Test incidents
Invoke-WebRequest -Uri "http://localhost:8081/dashboard/incidents" -Headers $headers -Method GET | ConvertFrom-Json
```

### 4. Test Frontend Flow

#### Login:
1. Go to `http://localhost:5173`
2. Click "Login"
3. Login with NGO/Govt/Volunteer credentials
4. Should redirect to dashboard

#### Dashboard Home:
1. Verify you see:
   - ✅ Active Incidents count (real number)
   - ✅ People Affected count
   - ✅ Active Missions count
   - ✅ Inventory Items count
   - ✅ No "Recent Activities" section
   - ✅ No "Organization Information" section
   - ✅ Active Missions card shows group count or "No active missions"
   - ✅ Quick Actions buttons are clickable

2. Test Quick Actions:
   - Click "Disaster Map" → Should go to `/map`
   - Click "Updates & News" → Should go to `/news`
   - Click "Manage Resources" → Should go to `/inventory`

#### Sidebar Navigation:
1. Check sidebar includes:
   - ✅ Home
   - ✅ Map
   - ✅ News
   - ✅ Disasters (NEW!)
   - ✅ Groups
   - ✅ Inventory (for NGO/Volunteer only)

2. Click each item and verify navigation works

#### Incidents Page:
1. Click "Disasters" in sidebar
2. Should see `/incidents` route
3. Verify display:
   - ✅ Page title "Disaster Incidents"
   - ✅ Stats summary at top (Total, Severe, People Affected)
   - ✅ List of incident cards OR "No Active Incidents" message
   - ✅ Each incident card shows:
     - Location info
     - Severity badge (colored)
     - Affected population
     - Resources needed as badges
     - Notes
     - Timestamps

### 5. Test with Different User Types

**NGO User:**
- Should see: Home, Map, News, Disasters, Groups, Inventory
- Dashboard should show their own groups and inventory

**Government User:**
- Should see: Home, Map, News, Disasters, Groups
- No Inventory option (correct)

**Volunteer User:**
- Should see: Home, Map, News, Disasters, Groups, Inventory
- Dashboard should show their own groups and inventory

**Regular User:**
- Should NOT see Disasters in sidebar
- Should only see: Home, Map, News

### 6. Test Edge Cases

#### No Data Scenarios:
1. Login with new NGO account (no groups, no inventory)
   - Active Missions: Should show 0
   - Inventory Items: Should show 0
   - Active Missions card: "No active missions at the moment"

2. Database with no incident reports:
   - Active Incidents: Should show 0
   - Incidents page: Should show "No Active Incidents" message

#### Loading States:
1. Open Network tab in browser DevTools
2. Throttle connection to "Slow 3G"
3. Refresh dashboard
4. Should see loading spinner before data appears

#### Error States:
1. Stop backend server
2. Refresh dashboard
3. Should see error message in red alert

## Expected API Response Examples

### Dashboard Stats Success:
```json
{
  "activeIncidents": 3,
  "peopleHelped": 850,
  "activeMissions": 2,
  "totalInventoryItems": 25,
  "resourcesAllocated": 150,
  "responseRate": 100
}
```

### Incidents Success:
```json
{
  "total": 3,
  "incidents": [
    {
      "id": "uuid-here",
      "responder_id": "uuid-here",
      "pincode": "400001",
      "city": "Mumbai",
      "severity": "SEVERE",
      "affected_population": 500,
      "stuck_people_found": true,
      "resources_needed": ["food", "medical", "rescue_boat"],
      "notes": "Heavy flooding in coastal areas",
      "images": [],
      "status": "approved",
      "createdAt": "2025-11-16T10:00:00Z",
      "updatedAt": "2025-11-16T10:00:00Z"
    }
  ]
}
```

## Common Issues & Solutions

### Issue: Stats showing 0 for everything
**Solution:** 
- Check if database has data (groups, disaster_reports, inventory_items)
- Verify JWT token is correct and belongs to NGO/Govt/Volunteer
- Check backend logs for any errors

### Issue: "No authentication token found" error
**Solution:**
- Check localStorage for 'token' key
- Re-login if token expired
- Verify token is being sent in Authorization header

### Issue: Incidents page shows "Failed to load"
**Solution:**
- Verify backend is running on port 8081
- Check browser console for CORS errors
- Verify dashboard module is imported in official_backend.module.ts

### Issue: Navigation not working
**Solution:**
- Check that React Router is properly configured
- Verify all routes are defined in App.tsx
- Check browser console for routing errors

## Performance Checks

1. **Dashboard Load Time:**
   - Should load within 1-2 seconds with normal connection
   - Stats should appear without flickering

2. **Incidents Page Load:**
   - Should handle 50+ incidents smoothly
   - Cards should render progressively with animations

3. **Navigation:**
   - Route changes should be instant
   - No full page reloads between dashboard pages

## Success Criteria

✅ All stats show real data from database
✅ Incidents page displays all approved disaster reports
✅ Navigation works for all sidebar items
✅ Quick action buttons navigate correctly
✅ Loading and error states work properly
✅ Different user types see appropriate menu items
✅ No console errors or warnings
✅ Responsive design works on mobile/tablet
✅ Active missions correctly shows group count
✅ Removed sections don't appear

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Login works for NGO user
- [ ] Dashboard loads with real statistics
- [ ] Active Incidents shows correct count
- [ ] People Affected shows correct count
- [ ] Active Missions shows correct count
- [ ] Inventory Items shows correct count
- [ ] Recent Activities section is removed
- [ ] Organization Info section is removed
- [ ] Active Missions card links to groups
- [ ] Quick Actions - Map button works
- [ ] Quick Actions - News button works
- [ ] Quick Actions - Inventory button works
- [ ] Sidebar shows "Home" option
- [ ] Sidebar shows "Disasters" option
- [ ] Disasters page loads
- [ ] Incidents display correctly
- [ ] Severity badges have correct colors
- [ ] Resources needed show as badges
- [ ] No active incidents message works
- [ ] Loading spinner appears briefly
- [ ] Error handling works when backend is down
- [ ] Navigation between pages is smooth
- [ ] Test with Government user
- [ ] Test with Volunteer user

---

**Last Updated:** November 16, 2025
**Status:** Ready for Testing
