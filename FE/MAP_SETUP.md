# Punjab Map Setup Guide

## Features Implemented

### ✅ Core Map Features
- **Custom Punjab Boundary**: Displays accurate Punjab state boundary with colored outline
- **Real-time User Location**: Uses device geolocation with accuracy circle
- **Major Cities Markers**: 8 major Punjab cities with interactive popups
- **Responsive Design**: Fully responsive map that adapts to all screen sizes
- **Dark Theme**: Integrated with your app's dark theme

### ✅ Interactive Elements
- **City Popups**: Click on any city marker to view details
- **User Location Tracking**: Live updates of user's position
- **Fly to Location**: Button to quickly navigate to user's location
- **Map Controls**: Zoom, pan, rotate, and pitch controls
- **Geolocate Control**: Built-in control to center on user location

### ✅ Visual Features
- **Animated User Marker**: Pulsing blue dot for user location
- **Accuracy Circle**: Visual representation of GPS accuracy
- **Custom Styling**: Dark theme matching your dashboard
- **Legend**: Clear map legend showing all elements
- **Stats Cards**: Quick overview of map statistics

## Setup Instructions

### 1. Get a Mapbox Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Create a free account (Free tier: 50,000 map loads/month)
3. Go to "Access Tokens" section
4. Copy your default public token or create a new one

### 2. Configure Environment Variables

Update the `.env` file in the root of FE directory:

\`\`\`bash
VITE_MAPBOX_TOKEN=your_actual_mapbox_token_here
\`\`\`

### 3. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

### 4. Enable Location Access

When you first visit the map page, your browser will ask for location permissions. Click "Allow" to see your live location on the map.

## Map Components

### Punjab Boundary (`/public/geojson/punjab.geojson`)
- GeoJSON file containing Punjab state boundary
- Can be updated with more accurate boundaries if needed
- Currently uses approximate coordinates

### Major Cities
The map includes 8 major Punjab cities:
- Amritsar
- Ludhiana  
- Jalandhar
- Chandigarh
- Bathinda
- Pathankot
- Patiala
- Mohali

## Customization Guide

### Adding New Cities

Edit `PUNJAB_CITIES` array in `MapPage.tsx`:

\`\`\`typescript
const PUNJAB_CITIES = [
  { name: 'Your City', coordinates: [longitude, latitude], population: '000K' },
  // ... existing cities
];
\`\`\`

### Changing Map Style

Update the `mapStyle` prop in the Map component:

\`\`\`typescript
<Map
  mapStyle="mapbox://styles/mapbox/streets-v12" // or satellite-v9, light-v11, etc.
  // ... other props
/>
\`\`\`

Available Mapbox styles:
- `mapbox://styles/mapbox/dark-v11` (current)
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/satellite-streets-v12`

### Adding Custom Markers/Layers

You can add disaster zones, relief camps, or other markers:

\`\`\`typescript
// Add a disaster zone marker
<Marker
  longitude={75.8573}
  latitude={30.9010}
  anchor="bottom"
>
  <div className="bg-red-500 p-2 rounded-full">
    <AlertTriangle className="text-white" size={20} />
  </div>
</Marker>
\`\`\`

### Customizing Punjab Boundary Colors

Edit the layer styles in `MapPage.tsx`:

\`\`\`typescript
const boundaryLayerStyle = {
  id: 'punjab-boundary',
  type: 'fill',
  paint: {
    'fill-color': '#your-color-hex',
    'fill-opacity': 0.1,
  },
};
\`\`\`

## Future Enhancements

### Planned Features
- [ ] Disaster zone polygons
- [ ] Relief camp markers
- [ ] Hospital/emergency services locations
- [ ] Real-time incident reporting
- [ ] Heatmap of affected areas
- [ ] Route planning for rescue teams
- [ ] Weather overlay
- [ ] Population density layer
- [ ] Clustering for multiple markers

### Adding Disaster Zones

\`\`\`typescript
// Example disaster zone overlay
<Source
  id="disaster-zone"
  type="geojson"
  data={{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [75.8, 30.9],
        [75.9, 30.9],
        [75.9, 31.0],
        [75.8, 31.0],
        [75.8, 30.9]
      ]]
    }
  }}
>
  <Layer
    id="disaster-zone-fill"
    type="fill"
    paint={{
      'fill-color': '#ff0000',
      'fill-opacity': 0.3
    }}
  />
</Source>
\`\`\`

## Troubleshooting

### Map Not Loading
- Check if Mapbox token is correctly set in `.env`
- Ensure `VITE_` prefix is present in environment variable
- Restart dev server after changing `.env`

### Location Not Working
- Check browser permissions for location access
- Ensure you're using HTTPS (required for geolocation API)
- In development, localhost works without HTTPS

### Punjab Boundary Not Showing
- Check if `/public/geojson/punjab.geojson` file exists
- Verify GeoJSON format is valid
- Check browser console for loading errors

### Styling Issues
- Ensure `mapbox-gl.css` is imported
- Check if custom styles in `map.css` are loading
- Verify Tailwind classes are compiling

## API Costs

### Mapbox Free Tier
- 50,000 map loads per month (free)
- Unlimited map views after initial load
- Rate limit: 600 requests per minute

For production use, monitor your usage at: https://account.mapbox.com/

## Alternative: MapTiler

If you prefer MapTiler over Mapbox:

1. Get API key from [https://cloud.maptiler.com/](https://cloud.maptiler.com/)
2. Update mapStyle:
\`\`\`typescript
mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_MAPTILER_KEY"
\`\`\`

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl Documentation](https://visgl.github.io/react-map-gl/)
- [GeoJSON Format Spec](https://geojson.org/)
- [Punjab Geographic Data](https://data.gov.in/)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Test with demo token first
4. Check network tab for API calls
