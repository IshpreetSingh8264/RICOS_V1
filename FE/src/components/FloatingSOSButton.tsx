import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, CheckCircle, X, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const rawUserBackendUrl = (import.meta.env.VITE_USER_BACKEND_URL || '').trim();
const API_BASE =
  rawUserBackendUrl && rawUserBackendUrl !== '/'
    ? rawUserBackendUrl.replace(/\/+$/, '')
    : 'http://localhost:8080';

interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface FloatingSOSButtonProps {
  className?: string;
}

const FloatingSOSButton = ({ className = '' }: FloatingSOSButtonProps) => {
  const { user } = useAuth();

  // ALL hooks must be declared before any conditional return
  const [isPressed, setIsPressed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sosId, setSosId] = useState<string | null>(null);
  const [location, setLocation] = useState<SOSLocation | null>(null);
  const [cachedLocation, setCachedLocation] = useState<SOSLocation | null>(null);
  const [cachedLocationTs, setCachedLocationTs] = useState<number | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation || !user) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCachedLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setCachedLocationTs(Date.now());
      },
      (err) => {
        console.warn('Background location watch error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // Only show for regular users — but hooks must be above this guard
  const userType = user?.userType || user?.accountType;
  if (userType && userType !== 'user') return null;
  if (!user) return null;

  const getCurrentPosition = (options: PositionOptions): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  const captureLocation = async (): Promise<SOSLocation> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            navigator.geolocation.clearWatch(watchId);
            resolve(pos);
          },
          (error) => {
            navigator.geolocation.clearWatch(watchId);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 15000,
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (watchError: any) {
      console.warn('watchPosition failed for SOS, trying fallback:', watchError);

      if (watchError?.code === 3) {
        try {
          const fallbackPos = await getCurrentPosition({
            enableHighAccuracy: false,
            maximumAge: 30000,
            timeout: 15000,
          });

          return {
            latitude: fallbackPos.coords.latitude,
            longitude: fallbackPos.coords.longitude,
            accuracy: fallbackPos.coords.accuracy,
          };
        } catch (fallbackError: any) {
          console.error('Geolocation fallback failed:', fallbackError);
          throw new Error('Unable to get location');
        }
      }

      if (watchError?.code === 1) {
        throw new Error('Location permission denied. Please allow location access and try again.');
      }

      throw new Error('Unable to get location');
    }
  };

  const sendSOS = async (sosLocation: SOSLocation) => {
    setIsSending(true);
    setError(null);
    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: sosLocation.latitude,
          longitude: sosLocation.longitude,
          accuracy: sosLocation.accuracy,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error ${response.status}`);
      }

      const data = await response.json();
      setSosId(data.id || data.sos_id || null);
      setSuccess(true);
      setShowDetailsModal(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('SOS Error:', err);
      setError(err.message || 'Failed to send SOS');
    } finally {
      setIsSending(false);
    }
  };

  const triggerSOS = async () => {
    try {
      setIsSending(true);
      setError(null);

      const cacheAgeMs = cachedLocationTs ? Date.now() - cachedLocationTs : Number.POSITIVE_INFINITY;
      const isCacheFresh = cachedLocation && cacheAgeMs <= 120000;
      const sosLocation = isCacheFresh ? cachedLocation : await captureLocation();

      setLocation(sosLocation);
      await sendSOS(sosLocation);
    } catch (err: any) {
      console.error('Error triggering SOS:', err);
      setError(err.message || 'Failed to trigger SOS');
      setIsSending(false);
    }
  };

  const handleSOSClick = async () => {
    if (isMobile) {
      tapCountRef.current += 1;
      if (tapCountRef.current === 1) {
        setIsPressed(true);
        tapTimerRef.current = setTimeout(() => {
          tapCountRef.current = 0;
          setIsPressed(false);
        }, 500);
      } else if (tapCountRef.current === 2) {
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapCountRef.current = 0;
        setIsPressed(false);
        await triggerSOS();
      }
    } else {
      await triggerSOS();
    }
  };

  const submitAdditionalDetails = async () => {
    if (!sosId || !additionalDetails.trim()) {
      setShowDetailsModal(false);
      return;
    }
    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) throw new Error('Authentication required');

      await fetch(`${API_BASE}/sos/${sosId}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ optionalDetails: additionalDetails }),
      });

      setShowDetailsModal(false);
      setAdditionalDetails('');
    } catch (err: any) {
      console.error('Error submitting details:', err);
      setError(err.message || 'Failed to submit details');
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={handleSOSClick}
          disabled={isSending}
          className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isSending
              ? 'bg-orange-500 cursor-not-allowed'
              : isPressed
              ? 'bg-red-600 scale-95'
              : 'bg-red-500 hover:bg-red-600 hover:scale-110'
          } disabled:opacity-70`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: isSending ? 1 : 1.1 }}
        >
          {isSending ? (
            <Loader2 className="text-white animate-spin" size={28} />
          ) : success ? (
            <CheckCircle className="text-white" size={28} />
          ) : (
            <AlertTriangle className="text-white" size={28} />
          )}
          {!isSending && !success && (
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          )}
        </motion.button>

        {/* Mobile tap-again hint */}
        <AnimatePresence>
          {isMobile && isPressed && !isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 right-0 bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-xl"
            >
              Tap again to confirm SOS
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error tooltip */}
        <AnimatePresence>
          {error && !showDetailsModal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 right-0 bg-red-950 border border-red-700 text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-xl"
            >
              <div className="flex items-start gap-2">
                <X className="flex-shrink-0 mt-0.5 text-red-400" size={14} />
                <span className="text-red-200">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Additional Details Modal — native dark, no shadcn */}
      <AnimatePresence>
        {showDetailsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-green-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="text-green-400" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">SOS Sent Successfully</h2>
                      <p className="text-xs text-slate-400">Your emergency alert has been dispatched</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* SOS ID */}
                  {sosId && (
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-xs text-slate-400">SOS ID</p>
                        <p className="text-sm font-mono text-green-300 font-semibold">{sosId}</p>
                      </div>
                    </div>
                  )}

                  {/* Location captured */}
                  {location && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <MapPin className="text-blue-400 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-xs text-slate-400">Location captured</p>
                        <p className="text-sm font-mono text-slate-200">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        {location.accuracy && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Accuracy: ±{Math.round(location.accuracy)}m
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional details */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      Additional Details{' '}
                      <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Describe your emergency situation — e.g. trapped on 2nd floor, water rising..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg text-white text-sm placeholder-slate-500 resize-none transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertTriangle className="text-red-400 flex-shrink-0" size={14} />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={submitAdditionalDetails}
                      disabled={!additionalDetails.trim()}
                      className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      Submit Details
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Emergency hotline: <span className="font-bold text-slate-300">112</span> (India) — Help is on the way
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingSOSButton;
