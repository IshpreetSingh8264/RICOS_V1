import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Map, { Marker, Source, Layer, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, AlertTriangle, Phone, User, Calendar, Clock, Users, Battery } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mapAPI, dashboardAPI, sosAPI, type DisasterArea, type SOSReport, type GroupLocation } from '@/lib/api';
import DisasterReportDialog from '@/components/DisasterReportDialog';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/map.css';

// Major cities across India with tier classification
const MAJOR_CITIES = [
  // Punjab - Tier 1 (Major cities, always visible)
  { name: 'Amritsar', coordinates: [74.8723, 31.6340], population: '1.1M', state: 'Punjab', tier: 1 },
  { name: 'Ludhiana', coordinates: [75.8573, 30.9010], population: '1.6M', state: 'Punjab', tier: 1 },
  { name: 'Jalandhar', coordinates: [75.5762, 31.3260], population: '862K', state: 'Punjab', tier: 1 },
  { name: 'Chandigarh', coordinates: [76.7794, 30.7333], population: '1.05M', state: 'Chandigarh', tier: 1 },
  { name: 'Patiala', coordinates: [76.3869, 30.3398], population: '406K', state: 'Punjab', tier: 1 },
  { name: 'Bathinda', coordinates: [74.9519, 30.2110], population: '285K', state: 'Punjab', tier: 1 },
  { name: 'Mohali', coordinates: [76.7222, 30.7046], population: '146K', state: 'Punjab', tier: 1 },
  
  // Punjab - Tier 2 (Medium cities, visible at zoom > 8)
  { name: 'Pathankot', coordinates: [75.6522, 32.2746], population: '174K', state: 'Punjab', tier: 2 },
  { name: 'Hoshiarpur', coordinates: [75.9118, 31.5340], population: '168K', state: 'Punjab', tier: 2 },
  { name: 'Moga', coordinates: [75.1705, 30.8157], population: '150K', state: 'Punjab', tier: 2 },
  { name: 'Batala', coordinates: [75.2050, 31.8089], population: '156K', state: 'Punjab', tier: 2 },
  { name: 'Abohar', coordinates: [74.1950, 30.1444], population: '145K', state: 'Punjab', tier: 2 },
  { name: 'Malerkotla', coordinates: [75.8783, 30.5316], population: '137K', state: 'Punjab', tier: 2 },
  { name: 'Khanna', coordinates: [76.2219, 30.7057], population: '128K', state: 'Punjab', tier: 2 },
  { name: 'Phagwara', coordinates: [75.7739, 31.2248], population: '100K', state: 'Punjab', tier: 2 },
  { name: 'Muktsar', coordinates: [74.5169, 30.4757], population: '117K', state: 'Punjab', tier: 2 },
  { name: 'Barnala', coordinates: [75.5483, 30.3779], population: '116K', state: 'Punjab', tier: 2 },
  { name: 'Firozpur', coordinates: [74.6130, 30.9257], population: '110K', state: 'Punjab', tier: 2 },
  { name: 'Kapurthala', coordinates: [75.3807, 31.3800], population: '99K', state: 'Punjab', tier: 2 },
  { name: 'Rupnagar', coordinates: [76.5270, 30.9644], population: '67K', state: 'Punjab', tier: 2 },
  { name: 'Sangrur', coordinates: [75.8447, 30.2453], population: '89K', state: 'Punjab', tier: 2 },
  
  // Punjab - Tier 3 (Small cities, visible at zoom > 9)
  { name: 'Mansa', coordinates: [75.3936, 29.9988], population: '83K', state: 'Punjab', tier: 3 },
  { name: 'Nawanshahr', coordinates: [76.1161, 31.1254], population: '52K', state: 'Punjab', tier: 3 },
  { name: 'Gurdaspur', coordinates: [75.4048, 32.0421], population: '81K', state: 'Punjab', tier: 3 },
  { name: 'Faridkot', coordinates: [74.7575, 30.6704], population: '92K', state: 'Punjab', tier: 3 },
  { name: 'Fazilka', coordinates: [74.0281, 30.4028], population: '77K', state: 'Punjab', tier: 3 },
  { name: 'Samana', coordinates: [76.1918, 30.1460], population: '44K', state: 'Punjab', tier: 3 },
  { name: 'Sunam', coordinates: [75.7989, 30.1281], population: '59K', state: 'Punjab', tier: 3 },
  { name: 'Dhuri', coordinates: [75.8683, 30.3685], population: '53K', state: 'Punjab', tier: 3 },
  { name: 'Nabha', coordinates: [76.1527, 30.3768], population: '67K', state: 'Punjab', tier: 3 },
  { name: 'Malout', coordinates: [74.4950, 30.1906], population: '47K', state: 'Punjab', tier: 3 },
  { name: 'Jagraon', coordinates: [75.4733, 30.7877], population: '54K', state: 'Punjab', tier: 3 },
  { name: 'Rajpura', coordinates: [76.5943, 30.4787], population: '68K', state: 'Punjab', tier: 3 },
  { name: 'Zira', coordinates: [74.9917, 30.9683], population: '31K', state: 'Punjab', tier: 3 },
  { name: 'Kharar', coordinates: [76.6467, 30.7445], population: '65K', state: 'Punjab', tier: 3 },
  { name: 'Dera Bassi', coordinates: [76.8444, 30.5895], population: '44K', state: 'Punjab', tier: 3 },
  
  ];

// Punjab center coordinates
const PUNJAB_CENTER = {
  longitude: 75.3412,
  latitude: 31.1471,
  zoom: 7.5,
};

// Using free MapLibre style (no token needed)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface UserLocation {
  longitude: number;
  latitude: number;
  accuracy?: number;
}

interface IncidentCluster {
  incidents: any[];
  latitude: number;
  longitude: number;
  city: string;
  pincode: string;
  highestSeverity: 'SEVERE' | 'MODERATE' | 'LOW';
  totalAffected: number;
}

const MapPage = () => {
  const mapRef = useRef<MapRef>(null);
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewState, setViewState] = useState(PUNJAB_CENTER);
  const [punjabBoundary, setPunjabBoundary] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedCity, setSelectedCity] = useState<typeof MAJOR_CITIES[0] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [disasterAreas, setDisasterAreas] = useState<DisasterArea[]>([]);
  const [selectedDisasterArea, setSelectedDisasterArea] = useState<DisasterArea | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentCluster | null>(null);
  const [sosReports, setSosReports] = useState<SOSReport[]>([]);
  const [selectedSOS, setSelectedSOS] = useState<SOSReport | null>(null);
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [groupLocations, setGroupLocations] = useState<GroupLocation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupLocation | null>(null);
  
  // Check if user is NGO admin to show SOS markers
  const isNGOAdmin = user?.userType === 'ngo' || user?.userType === 'govt';

  // Check if user can report disasters (NGO, Govt, Volunteer only)
  const canReportDisaster = user?.userType === 'ngo' || user?.userType === 'govt' || user?.userType === 'volunteer';

  // Cluster incidents by location (city + pincode)
  const clusteredIncidents = useMemo(() => {
    const clusters: Record<string, IncidentCluster> = {};

    incidents.forEach((incident) => {
      if (!incident.latitude || !incident.longitude) return;
      
      const key = `${incident.city || 'Unknown'}-${incident.pincode || 'N/A'}`;
      
      if (!clusters[key]) {
        clusters[key] = {
          incidents: [incident],
          latitude: incident.latitude,
          longitude: incident.longitude,
          city: incident.city || 'Unknown',
          pincode: incident.pincode || 'N/A',
          highestSeverity: incident.severity,
          totalAffected: incident.affected_population || 0,
        };
      } else {
        const cluster = clusters[key];
        cluster.incidents.push(incident);
        cluster.totalAffected += incident.affected_population || 0;
        
        // Update highest severity
        const severityOrder = { SEVERE: 3, MODERATE: 2, LOW: 1 };
        if (severityOrder[incident.severity as keyof typeof severityOrder] > 
            severityOrder[cluster.highestSeverity as keyof typeof severityOrder]) {
          cluster.highestSeverity = incident.severity;
        }
      }
    });

    return Object.values(clusters);
  }, [incidents]);

  // Load Punjab GeoJSON boundary from Indian states data
  useEffect(() => {
    fetch('/indian-state-geodata.json')
      .then(res => res.json())
      .then(data => {
        // Filter for Punjab state only
        const punjabFeature = data.features.find(
          (feature: any) => feature.properties.NAME_1 === 'Punjab'
        );
        
        if (punjabFeature) {
          setPunjabBoundary({
            type: 'FeatureCollection',
            features: [punjabFeature]
          });
        } else {
          console.warn('Punjab boundary not found in GeoJSON data');
        }
      })
      .catch(err => console.error('Error loading Punjab boundary:', err));
  }, []);

  // Load disaster areas and incidents from backend
  const loadDisasterAreas = async () => {
    if (!token) return;
    
    try {
      const response = await mapAPI.getLiveMapData(token);
      if (response.success) {
        setDisasterAreas(response.disaster_areas);
        setGroupLocations(response.group_locations || []);
      }
      
      // Also load incidents for clustering
      try {
        const incidentsData = await dashboardAPI.getIncidents(token, {
          limit: 1000, // Get all incidents for map view
        });
        setIncidents(incidentsData.incidents);
      } catch (incidentsError: any) {
        // Standard users will get a 403, which is expected
        const status = incidentsError?.statusCode ?? incidentsError?.status;
        if (status !== 403 && !incidentsError?.message?.includes('403')) {
          console.error('Error loading incidents for map view:', incidentsError);
        }
      }
      
      // Load SOS reports for NGO admins only
      if (isNGOAdmin) {
        const sosResponse = await sosAPI.getAllActiveReports(token);
        if (sosResponse.success) {
          setSosReports(sosResponse.reports || []);
        }
      }
    } catch (error) {
      console.error('Error loading disaster areas:', error);
    }
  };

  // Handle URL parameters for SOS navigation
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (lat && lng && type === 'sos' && id) {
      // Pan to the SOS location
      setViewState({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        zoom: 15,
      });

      // Find and select the SOS report
      const sosReport = sosReports.find(s => s.id === id);
      if (sosReport) {
        setSelectedSOS(sosReport);
        setShowSOSDialog(true);
      }
    }
  }, [searchParams, sosReports]);

  // Load disaster areas on mount and periodically
  useEffect(() => {
    if (!token) return;
    
    loadDisasterAreas();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDisasterAreas, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy,
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error.message);
          setIsLoadingLocation(false);
          
          // Fallback: try with lower accuracy if high accuracy fails
          if (error.code === 3) { // TIMEOUT
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  longitude: position.coords.longitude,
                  latitude: position.coords.latitude,
                  accuracy: position.coords.accuracy,
                });
              },
              (fallbackError) => {
                console.error('Fallback location failed:', fallbackError.message);
              },
              {
                enableHighAccuracy: false,
                maximumAge: 30000,
                timeout: 15000,
              }
            );
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 15000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fly to user location
  const flyToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 12,
        duration: 2000,
      });
    }
  };

  // Punjab boundary layer style
  const boundaryLayerStyle = {
    id: 'punjab-boundary',
    type: 'fill' as const,
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.1,
    },
  };

  const boundaryOutlineStyle = {
    id: 'punjab-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 0.8,
    },
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">
              Punjab <span className="gradient-text">Disaster Map</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Real-time disaster zones and affected areas in Punjab
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
        {canReportDisaster && (
              <button
                onClick={() => setIsReportDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors shadow-glow-red"
              >
                <AlertTriangle size={15} />
                Report Incident
              </button>
            )}


            {userLocation && (
              <button
                onClick={flyToUserLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-glow-sm"
              >
                <Navigation size={15} />
                My Location
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="relative w-full h-[calc(100vh-250px)] min-h-[600px]">
            {isLoadingLocation && (
              <div className="absolute top-4 left-4 z-10 bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm text-white">Getting your location...</span>
              </div>
            )}

            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt: any) => setViewState(evt.viewState)}
              mapStyle={MAP_STYLE}
              style={{ width: '100%', height: '100%' }}
              onLoad={() => setMapLoaded(true)}
            >
              {/* Navigation Controls */}
              <NavigationControl position="top-right" />
              
              {/* Geolocate Control */}
              <GeolocateControl
                position="top-right"
                trackUserLocation
                showAccuracyCircle
              />

              {/* Punjab Boundary */}
              {punjabBoundary && mapLoaded && (
                <Source id="punjab" type="geojson" data={punjabBoundary}>
                  <Layer {...boundaryLayerStyle} />
                  <Layer {...boundaryOutlineStyle} />
                </Source>
              )}

              {/* Disaster Area Polygons */}
              {mapLoaded && disasterAreas.map((area) => {
                if (!area.polygon) return null;

                const getSeverityColor = (severity: string) => {
                  switch (severity) {
                    case 'SEVERE':
                      return '#ef4444'; // red-500
                    case 'MODERATE':
                      return '#f97316'; // orange-500
                    case 'LOW':
                      return '#eab308'; // yellow-500
                    default:
                      return '#6b7280'; // gray-500
                  }
                };

                const getSeverityOpacity = (severity: string) => {
                  switch (severity) {
                    case 'SEVERE':
                      return 0.4;
                    case 'MODERATE':
                      return 0.3;
                    case 'LOW':
                      return 0.2;
                    default:
                      return 0.1;
                  }
                };

                return (
                  <Source
                    key={area.report_id}
                    id={`disaster-${area.report_id}`}
                    type="geojson"
                    data={area.polygon}
                  >
                    <Layer
                      id={`disaster-fill-${area.report_id}`}
                      type="fill"
                      paint={{
                        'fill-color': getSeverityColor(area.severity),
                        'fill-opacity': getSeverityOpacity(area.severity),
                      }}
                    />
                    <Layer
                      id={`disaster-outline-${area.report_id}`}
                      type="line"
                      paint={{
                        'line-color': getSeverityColor(area.severity),
                        'line-width': 2,
                        'line-opacity': 0.8,
                      }}
                    />
                  </Source>
                );
              })}

              {/* Disaster Area Center Markers */}
              {disasterAreas.map((area) => {
                if (!area.polygon || !area.polygon.coordinates) return null;

                // Calculate center of polygon (simple centroid)
                let centerLat = 0;
                let centerLng = 0;
                let pointCount = 0;

                try {
                  const coords = area.polygon.type === 'Polygon' 
                    ? area.polygon.coordinates[0]
                    : area.polygon.coordinates[0][0];

                  coords.forEach((coord: number[]) => {
                    centerLng += coord[0];
                    centerLat += coord[1];
                    pointCount++;
                  });

                  centerLng /= pointCount;
                  centerLat /= pointCount;
                } catch (e) {
                  return null;
                }

                return (
                  <Marker
                    key={`marker-${area.report_id}`}
                    longitude={centerLng}
                    latitude={centerLat}
                    anchor="center"
                    onClick={(e: any) => {
                      e.originalEvent.stopPropagation();
                      setSelectedDisasterArea(area);
                    }}
                  >
                    <div className="cursor-pointer transform hover:scale-110 transition-transform">
                      <div className="p-2 bg-red-500/80 rounded-full backdrop-blur-sm border-2 border-white shadow-lg">
                        <AlertTriangle className="text-white" size={20} />
                      </div>
                    </div>
                  </Marker>
                );
              })}

              {/* Incident Cluster Markers */}
              {clusteredIncidents.map((cluster, idx) => {
                const getSeverityColor = (severity: string) => {
                  switch (severity) {
                    case 'SEVERE': return '#ef4444';
                    case 'MODERATE': return '#f97316';
                    case 'LOW': return '#eab308';
                    default: return '#6b7280';
                  }
                };

                const count = cluster.incidents.length;
                const size = count === 1 ? 32 : Math.min(40 + (count * 2), 60);

                return (
                  <Marker
                    key={`incident-cluster-${idx}`}
                    longitude={cluster.longitude}
                    latitude={cluster.latitude}
                    anchor="center"
                    onClick={(e: any) => {
                      e.originalEvent.stopPropagation();
                      setSelectedIncident(cluster);
                    }}
                  >
                    <div className="cursor-pointer transform hover:scale-110 transition-transform">
                      <div 
                        className="relative flex items-center justify-center rounded-full backdrop-blur-sm border-2 border-white shadow-lg"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: `${getSeverityColor(cluster.highestSeverity)}CC`,
                        }}
                      >
                        <AlertTriangle className="text-white" size={count === 1 ? 16 : 20} />
                        {count > 1 && (
                          <div className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-red-600">
                            {count}
                          </div>
                        )}
                      </div>
                    </div>
                  </Marker>
                );
              })}

              {/* User Location Marker */}
              {userLocation && (
                <>
                  {/* Accuracy Circle */}
                  {userLocation.accuracy && (
                    <Source
                      id="user-accuracy"
                      type="geojson"
                      data={{
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [userLocation.longitude, userLocation.latitude],
                        },
                        properties: {},
                      }}
                    >
                      <Layer
                        id="user-accuracy-circle"
                        type="circle"
                        paint={{
                          'circle-radius': Math.min(userLocation.accuracy / 2, 100),
                          'circle-color': '#3b82f6',
                          'circle-opacity': 0.2,
                        }}
                      />
                    </Source>
                  )}

                  {/* User Marker */}
                  <Marker
                    longitude={userLocation.longitude}
                    latitude={userLocation.latitude}
                    anchor="center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping">
                        <div className="w-4 h-4 bg-blue-500 rounded-full opacity-75"></div>
                      </div>
                      <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                  </Marker>
                </>
              )}

              {/* SOS Markers (NGO Admins only) */}
              {isNGOAdmin && sosReports.map((sosReport) => (
                <Marker
                  key={`sos-${sosReport.id}`}
                  longitude={sosReport.longitude}
                  latitude={sosReport.latitude}
                  anchor="center"
                >
                  <div 
                    className="cursor-pointer transform hover:scale-125 transition-transform animate-pulse"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('SOS marker clicked:', sosReport);
                      setSelectedSOS(sosReport);
                      setShowSOSDialog(true);
                    }}
                  >
                    <div className="relative w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    {/* Pulsing ring effect */}
                    <div className="absolute inset-0 animate-ping opacity-75 pointer-events-none">
                      <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                    </div>
                  </div>
                </Marker>
              ))}



              {/* Group / Field Team Markers */}
              {isNGOAdmin && groupLocations.map((group) => {
                const statusColors: Record<string, string> = {
                  available: '#22c55e',  // green-500
                  deployed: '#3b82f6',   // blue-500
                  rescuing: '#f97316',   // orange-500
                  offline: '#6b7280',    // gray-500
                };
                const color = statusColors[group.status] || '#6b7280';

                return (
                  <Marker
                    key={`group-${group.group_id}`}
                    longitude={group.longitude}
                    latitude={group.latitude}
                    anchor="center"
                  >
                    <div
                      className="cursor-pointer transform hover:scale-125 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-3 border-white shadow-xl flex items-center justify-center"
                        style={{ backgroundColor: color, border: '2px solid white' }}
                      >
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Marker>
                );
              })}

              {/* Group Popup */}
              {selectedGroup && (
                <Popup
                  longitude={selectedGroup.longitude}
                  latitude={selectedGroup.latitude}
                  anchor="top"
                  onClose={() => setSelectedGroup(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="custom-popup"
                >
                  <div className="bg-slate-800 text-white p-4 rounded-lg min-w-[240px]">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="text-blue-400" size={18} />
                      <h3 className="font-bold text-base">{selectedGroup.group_name}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Org</span>
                        <span className="font-medium">{selectedGroup.org_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          selectedGroup.status === 'available' ? 'bg-green-500/20 text-green-400' :
                          selectedGroup.status === 'deployed' ? 'bg-blue-500/20 text-blue-400' :
                          selectedGroup.status === 'rescuing' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>{selectedGroup.status}</span>
                      </div>
                      {selectedGroup.battery_level != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1"><Battery size={12} /> Battery</span>
                          <span className="font-medium">{selectedGroup.battery_level}%</span>
                        </div>
                      )}
                      {selectedGroup.resources.length > 0 && (
                        <div>
                          <span className="text-slate-400 block mb-1">Resources</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedGroup.resources.slice(0, 3).map((r, i) => (
                              <span key={i} className="text-xs bg-slate-700 px-2 py-0.5 rounded">{r}</span>
                            ))}
                            {selectedGroup.resources.length > 3 && (
                              <span className="text-xs text-slate-400">+{selectedGroup.resources.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedGroup.active_assignment && (
                        <div className="pt-2 border-t border-slate-700">
                          <span className="text-xs text-blue-400 font-medium">Assigned to incident</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        Updated: {new Date(selectedGroup.last_updated).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Popup>
              )}



              {/* City Markers */}
              {MAJOR_CITIES.filter(city => {
                // Hide markers when zoomed out too far (< 6) or zoomed in too far (> 14)
                if (viewState.zoom < 6 || viewState.zoom > 14) return false;
                
                // Show Tier 1 cities when zoom is between 6 and 14
                if (city.tier === 1) return true;
                // Show Tier 2 cities when zoom > 8
                if (city.tier === 2) return viewState.zoom > 8;
                // Show Tier 3 cities when zoom > 9
                if (city.tier === 3) return viewState.zoom > 9;
                return false;
              }).map((city) => (
                <Marker
                  key={city.name}
                  longitude={city.coordinates[0]}
                  latitude={city.coordinates[1]}
                  anchor="bottom"
                  onClick={(e: any) => {
                    e.originalEvent.stopPropagation();
                    setSelectedCity(city);
                  }}
                >
                  <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    <div className="relative flex items-center justify-center">
                      {/* Red triangular marker pointing down with white stripe */}
                      <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-lg">
                        {/* Main red triangle */}
                        <path d="M10 2 L18 18 L2 18 Z" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                        {/* White horizontal stripe */}
                        <line x1="5" y1="13" x2="15" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </Marker>
              ))}

              {/* City Popup */}
              {selectedCity && (
                <Popup
                  longitude={selectedCity.coordinates[0]}
                  latitude={selectedCity.coordinates[1]}
                  anchor="top"
                  onClose={() => setSelectedCity(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="custom-popup"
                >
                  <div className="bg-slate-800 text-white p-3 rounded-lg">
                    <h3 className="font-bold text-lg mb-1">{selectedCity.name}</h3>
                    <p className="text-sm text-slate-300">Population: {selectedCity.population}</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedCity.state}</p>
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400">
                        Lat: {selectedCity.coordinates[1].toFixed(4)}, 
                        Lng: {selectedCity.coordinates[0].toFixed(4)}
                      </p>
                    </div>
                  </div>
                </Popup>
              )}

              {/* Disaster Area Popup */}
              {selectedDisasterArea && selectedDisasterArea.polygon && (
                (() => {
                  try {
                    const coords = selectedDisasterArea.polygon.type === 'Polygon' 
                      ? selectedDisasterArea.polygon.coordinates[0]
                      : selectedDisasterArea.polygon.coordinates[0][0];

                    let centerLng = 0;
                    let centerLat = 0;
                    let pointCount = 0;

                    coords.forEach((coord: number[]) => {
                      centerLng += coord[0];
                      centerLat += coord[1];
                      pointCount++;
                    });

                    centerLng /= pointCount;
                    centerLat /= pointCount;

                    const getSeverityLabel = (severity: string) => {
                      switch (severity) {
                        case 'SEVERE': return 'Severe Risk';
                        case 'MODERATE': return 'Moderate Risk';
                        case 'LOW': return 'Low Risk';
                        default: return severity;
                      }
                    };

                    const getSeverityColor = (severity: string) => {
                      switch (severity) {
                        case 'SEVERE': return 'text-red-400 bg-red-500/10';
                        case 'MODERATE': return 'text-orange-400 bg-orange-500/10';
                        case 'LOW': return 'text-yellow-400 bg-yellow-500/10';
                        default: return 'text-gray-400 bg-gray-500/10';
                      }
                    };

                    return (
                      <Popup
                        longitude={centerLng}
                        latitude={centerLat}
                        anchor="top"
                        onClose={() => setSelectedDisasterArea(null)}
                        closeButton={true}
                        closeOnClick={false}
                        className="custom-popup"
                      >
                        <div className="bg-slate-800 text-white p-4 rounded-lg min-w-[250px]">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="text-red-500" size={20} />
                            <h3 className="font-bold text-lg">Disaster Area</h3>
                          </div>
                          
                          <div className="space-y-2">
                            <div className={`px-3 py-1 rounded-lg ${getSeverityColor(selectedDisasterArea.severity)}`}>
                              <p className="text-sm font-semibold">
                                {getSeverityLabel(selectedDisasterArea.severity)}
                              </p>
                            </div>

                            {selectedDisasterArea.pincode && (
                              <div>
                                <p className="text-xs text-slate-400">Pincode</p>
                                <p className="text-sm font-semibold">{selectedDisasterArea.pincode}</p>
                              </div>
                            )}

                            {selectedDisasterArea.city && (
                              <div>
                                <p className="text-xs text-slate-400">City</p>
                                <p className="text-sm font-semibold">{selectedDisasterArea.city}</p>
                              </div>
                            )}

                            {selectedDisasterArea.affected_population && (
                              <div>
                                <p className="text-xs text-slate-400">Affected Population</p>
                                <p className="text-sm font-semibold">{selectedDisasterArea.affected_population} people</p>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-700">
                              <p className="text-xs text-slate-400">
                                Reported: {new Date(selectedDisasterArea.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    );
                  } catch (e) {
                    return null;
                  }
                })()
              )}

              {/* Incident Cluster Popup */}
              {selectedIncident && (
                <Popup
                  longitude={selectedIncident.longitude}
                  latitude={selectedIncident.latitude}
                  anchor="top"
                  onClose={() => setSelectedIncident(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="custom-popup"
                >
                  <div className="bg-slate-800 text-white p-4 rounded-lg min-w-[280px] max-w-[400px]">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="text-red-500" size={20} />
                      <h3 className="font-bold text-lg">
                        {selectedIncident.incidents.length > 1 
                          ? `${selectedIncident.incidents.length} Incident Reports` 
                          : 'Incident Report'}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Location</span>
                        <span className="text-sm font-semibold">{selectedIncident.city}, {selectedIncident.pincode}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Severity</span>
                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                          selectedIncident.highestSeverity === 'SEVERE' ? 'bg-red-500/20 text-red-400' :
                          selectedIncident.highestSeverity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {selectedIncident.highestSeverity}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">People Affected</span>
                        <span className="text-sm font-semibold">{selectedIncident.totalAffected.toLocaleString()}</span>
                      </div>

                      {selectedIncident.incidents.length > 1 && (
                        <div className="pt-2 mt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">Reports:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedIncident.incidents.slice(0, 5).map((inc: any, i: number) => (
                              <div key={i} className="text-xs bg-slate-900/50 rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300">Report #{i + 1}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    inc.severity === 'SEVERE' ? 'bg-red-500/20 text-red-400' :
                                    inc.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {inc.severity}
                                  </span>
                                </div>
                                {inc.notes && (
                                  <p className="text-slate-400 mt-1 text-xs truncate">{inc.notes}</p>
                                )}
                              </div>
                            ))}
                            {selectedIncident.incidents.length > 5 && (
                              <p className="text-xs text-slate-500 text-center py-1">
                                +{selectedIncident.incidents.length - 5} more reports
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedIncident.incidents.length === 1 && selectedIncident.incidents[0].notes && (
                        <div className="pt-2 mt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">Notes:</p>
                          <p className="text-sm text-slate-300">{selectedIncident.incidents[0].notes}</p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          Latest: {new Date(selectedIncident.incidents[0].createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>

          {/* Map Legend */}
          <div className="p-4 bg-slate-800/80 border-t border-slate-700/50">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border border-white/50"></div>
                  <span className="text-slate-300">Your Location</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 20 20"><path d="M10 2 L18 18 L2 18 Z" fill="#ef4444" stroke="white" strokeWidth="1.5" /></svg>
                  <span className="text-slate-300">Major Cities</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-1 bg-blue-500"></div>
                  <span className="text-slate-300">Punjab Boundary</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-red-500/40 border border-red-500 rounded"></div>
                  <span className="text-slate-300">Severe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-orange-500/30 border border-orange-500 rounded"></div>
                  <span className="text-slate-300">Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500 rounded"></div>
                  <span className="text-slate-300">Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-white" size={10} />
                  </div>
                  <span className="text-slate-300">Incidents</span>
                </div>
                {isNGOAdmin && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Users className="text-white" size={10} />
                    </div>
                    <span className="text-slate-300">Field Teams</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {disasterAreas.length} disaster areas · {clusteredIncidents.length} incident locations · {groupLocations.length} field teams · {MAJOR_CITIES.length} cities
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Cities', value: MAJOR_CITIES.length, icon: MapPin, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500/20 to-transparent', border: 'border-blue-500/20' },
            { label: 'Incident Reports', value: incidents.length, sub: `${clusteredIncidents.length} locations`, icon: AlertTriangle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10', accent: 'from-red-500/20 to-transparent', border: 'border-red-500/20' },
            { label: 'Location Status', value: userLocation ? 'Active' : 'Searching', icon: Navigation, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', accent: 'from-emerald-500/20 to-transparent', border: 'border-emerald-500/20' },
            { label: 'Area Coverage', value: '50,362 km²', icon: MapPin, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10', accent: 'from-purple-500/20 to-transparent', border: 'border-purple-500/20' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5`}
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                    <Icon className={card.iconColor} size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-xl font-bold text-white mt-0.5">{card.value}</p>
                    {'sub' in card && card.sub && <p className="text-xs text-slate-500">{card.sub}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SOS Details Dialog */}
        <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
          {selectedSOS && (
            <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                  🚨 SOS ALERT
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status Badge */}
                <div className="flex gap-2">
                  <Badge className="bg-red-600 text-white">SEVERE</Badge>
                  <Badge className="bg-yellow-600 text-white">{selectedSOS.status}</Badge>
                </div>

                {/* Person in Emergency */}
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Person in Emergency
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400 block mb-1">Full Name</span>
                      <span className="font-semibold text-white text-base">{selectedSOS.user_name}</span>
                    </div>
                    {selectedSOS.age && (
                      <div>
                        <span className="text-slate-400 block mb-1">Age{selectedSOS.gender && ` / ${selectedSOS.gender}`}</span>
                        <span className="font-semibold text-white">{selectedSOS.age} years</span>
                      </div>
                    )}
                    {selectedSOS.phone_number && (
                      <div>
                        <span className="text-slate-400 block mb-1">Primary Phone</span>
                        <a
                          href={`tel:${selectedSOS.phone_number}`}
                          className="font-semibold text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {selectedSOS.phone_number}
                        </a>
                      </div>
                    )}
                    {selectedSOS.alternate_phone && (
                      <div>
                        <span className="text-slate-400 block mb-1">Alternate Phone</span>
                        <a
                          href={`tel:${selectedSOS.alternate_phone}`}
                          className="font-semibold text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {selectedSOS.alternate_phone}
                        </a>
                      </div>
                    )}
                    {selectedSOS.blood_group && (
                      <div>
                        <span className="text-slate-400 block mb-1">Blood Group</span>
                        <span className="font-semibold text-red-400 text-lg">{selectedSOS.blood_group}</span>
                      </div>
                    )}
                    {selectedSOS.email && (
                      <div>
                        <span className="text-slate-400 block mb-1">Email</span>
                        <span className="font-medium text-white">{selectedSOS.email}</span>
                      </div>
                    )}
                  </div>
                  {selectedSOS.medical_conditions && (
                    <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                      <span className="text-yellow-400 font-semibold block mb-1">⚠️ Medical Conditions</span>
                      <p className="text-yellow-200 text-sm">{selectedSOS.medical_conditions}</p>
                    </div>
                  )}
                </Card>

                {/* Location */}
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-400" />
                    Location
                  </h3>
                  <div className="space-y-3 text-sm">
                    {selectedSOS.current_address && (
                      <div>
                        <span className="text-slate-400 block mb-1">Full Address</span>
                        <span className="font-medium text-white">{selectedSOS.current_address}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block mb-1">City</span>
                        <span className="font-semibold text-white">{selectedSOS.city || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Pincode</span>
                        <span className="font-semibold text-white">{selectedSOS.pincode || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Reported: {new Date(selectedSOS.created_at).toLocaleString()}
                    </div>
                  </div>
                </Card>

                {/* Action Button */}
                <div className="w-full">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      window.open(`https://www.google.com/maps?q=${selectedSOS.latitude},${selectedSOS.longitude}`, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate to Location
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Disaster Report Dialog */}
         <DisasterReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          userLocation={userLocation}
          onSuccess={() => {
            loadDisasterAreas(); // Reload disaster areas after successful submission
          }}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default MapPage;
