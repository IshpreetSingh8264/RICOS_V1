import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, MapPin, Droplets, Package, FileText, Loader2, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { mapAPI, type DisasterReportData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DisasterReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-populated GPS location from the map page */
  userLocation?: { latitude: number; longitude: number } | null;
}

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low Risk', color: 'bg-yellow-500', description: 'Minor impact, minimal resources needed' },
  { value: 'MODERATE', label: 'Moderate Risk', color: 'bg-orange-500', description: 'Significant impact, resources needed' },
  { value: 'SEVERE', label: 'Severe Risk', color: 'bg-red-500', description: 'Critical impact, urgent resources needed' },
] as const;

const RESOURCE_OPTIONS = [
  'Food',
  'Water',
  'Medical Supplies',
  'Shelter',
  'Rescue Boats',
  'Ambulance',
  'Clothing',
  'Blankets',
  'First Aid',
  'Communication Equipment',
];

const DisasterReportDialog: React.FC<DisasterReportDialogProps> = ({ isOpen, onClose, onSuccess, userLocation }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'ok' | 'error'>('idle');

  // GPS coordinates for accurate pincode/polygon lookup
  const [reportCoords, setReportCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Pre-populate GPS from map page's existing location cache
  useEffect(() => {
    if (isOpen && userLocation) {
      setReportCoords(userLocation);
      setGpsStatus('ok');
    }
  }, [isOpen, userLocation]);

  // If no userLocation provided, try to fetch GPS on dialog open
  useEffect(() => {
    if (!isOpen || userLocation || reportCoords) return;
    if (!('geolocation' in navigator)) return;

    setGpsStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsStatus('ok');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [isOpen, userLocation, reportCoords]);

  const [formData, setFormData] = useState<DisasterReportData>({
    pincode: '',
    city: '',
    village: '',
    severity: 'MODERATE',
    water_level: '',
    affected_population: undefined,
    stuck_people_found: false,
    resources_needed: [],
    notes: '',
  });

  const handleInputChange = (field: keyof DisasterReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleResource = (resource: string) => {
    setFormData(prev => ({
      ...prev,
      resources_needed: prev.resources_needed?.includes(resource)
        ? prev.resources_needed.filter(r => r !== resource)
        : [...(prev.resources_needed || []), resource],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    // Validation
    if (!formData.pincode && !formData.city) {
      setError('Please provide either pincode or city');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Always include GPS coordinates for accurate polygon lookup
      const payload: DisasterReportData = {
        ...formData,
        ...(reportCoords && {
          latitude: reportCoords.latitude,
          longitude: reportCoords.longitude,
        }),
      };
      const response = await mapAPI.submitDisasterReport(token, payload);
      
      setSuccessMessage(response.message || 'Disaster report submitted successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          pincode: '',
          city: '',
          village: '',
          severity: 'MODERATE',
          water_level: '',
          affected_population: undefined,
          stuck_people_found: false,
          resources_needed: [],
          notes: '',
        });
        setSuccessMessage(null);
        setReportCoords(null);
        setGpsStatus('idle');
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Disaster report error:', err);
      console.error('Error status:', err.status);
      const errorMessage = err.message || 'Failed to submit report';
      
      // Check if it's an authentication error (401)
      if (err.status === 401 || errorMessage.toLowerCase().includes('unauthorized') || errorMessage.includes('401')) {
        setError('⚠️ Authentication Error: Your session is invalid. Please LOG OUT and LOG BACK IN to get a new session.');
      } else if (errorMessage.includes('session') || errorMessage.includes('log in')) {
        setError('Your session has expired. Please log out and log back in to continue.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Report Disaster</h2>
              <p className="text-sm text-slate-400">Provide details about the affected area</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="text-slate-400" size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Location Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                <MapPin size={20} />
                <span>Location Details</span>
              </div>
              {/* GPS status badge */}
              <div className="flex items-center gap-1.5 text-xs">
                {gpsStatus === 'fetching' && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Loader2 size={12} className="animate-spin" /> Acquiring GPS...
                  </span>
                )}
                {gpsStatus === 'ok' && reportCoords && (
                  <span className="flex items-center gap-1 text-green-400">
                    <Navigation size={12} /> GPS locked — polygon will be exact
                  </span>
                )}
                {gpsStatus === 'error' && (
                  <span className="text-orange-400">No GPS — pincode used for area lookup</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="e.g., 144001"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Ludhiana"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Village/Area
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  placeholder="e.g., Village name or area"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Severity Level */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <AlertTriangle size={20} />
              <span>Severity Level <span className="text-red-500">*</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('severity', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.severity === option.value
                      ? `${option.color} border-white text-white`
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs mt-1 opacity-80">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Disaster Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Droplets size={20} />
              <span>Disaster Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Water Level
                </label>
                <input
                  type="text"
                  value={formData.water_level}
                  onChange={(e) => handleInputChange('water_level', e.target.value)}
                  placeholder="e.g., 5 feet"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Affected Population
                </label>
                <input
                  type="number"
                  value={formData.affected_population || ''}
                  onChange={(e) => handleInputChange('affected_population', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 120"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="stuck_people"
                checked={formData.stuck_people_found}
                onChange={(e) => handleInputChange('stuck_people_found', e.target.checked)}
                className="w-5 h-5 bg-slate-800 border-slate-700 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="stuck_people" className="text-slate-300 cursor-pointer">
                People stuck/trapped in the area
              </label>
            </div>
          </div>

          {/* Resources Needed */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Package size={20} />
              <span>Resources Needed</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {RESOURCE_OPTIONS.map((resource) => (
                <button
                  key={resource}
                  type="button"
                  onClick={() => toggleResource(resource)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    formData.resources_needed?.includes(resource)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {resource}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileText size={20} />
              <span>Additional Notes</span>
            </div>

            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Provide any additional information about the disaster..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle size={20} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DisasterReportDialog;
