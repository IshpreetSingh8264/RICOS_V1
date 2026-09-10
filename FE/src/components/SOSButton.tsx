import { useState } from 'react';
import { AlertTriangle, MapPin, Loader2, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userIncidentAPI } from '@/lib/api';

interface SOSButtonProps {
  onSuccess?: () => void;
}

export default function SOSButton({ onSuccess }: SOSButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    pincode?: string;
    city?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSOSClick = async () => {
    setError(null);
    setSuccess(false);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setShowModal(true);
        },
        async () => {
          // Geolocation denied — try profile address as fallback
          try {
            const token = localStorage.getItem('ricos_token');
            if (token) {
              const userProfile = await fetch(
                `${import.meta.env.VITE_USER_BACKEND_URL || 'http://localhost:8080'}/profile`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
                .then((res) => res.json())
                .catch(() => null);

              if (userProfile?.pincode || userProfile?.city) {
                setLocation({ pincode: userProfile.pincode, city: userProfile.city });
                setError('Using your saved address. Enable location services for better accuracy.');
              } else {
                setLocation(null);
                setError('Location unavailable. Alert will be sent without GPS coordinates.');
              }
            } else {
              setLocation(null);
              setError('Location unavailable. Enable location services for best results.');
            }
          } catch {
            setLocation(null);
          }
          setShowModal(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // Geolocation not supported
      setLocation(null);
      setError('Geolocation is not supported by your browser.');
      setShowModal(true);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) throw new Error('Authentication required');

      await userIncidentAPI.reportIncident(token, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        severity: 'SEVERE',
        notes: additionalDetails || 'Emergency SOS — User needs immediate help',
        stuck_people_found: true,
      } as any);

      setSuccess(true);
      setShowModal(false);
      setAdditionalDetails('');
      onSuccess?.();

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error submitting SOS:', err);
      setError(err.message || 'Failed to send SOS. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationDisplay = () => {
    if (!location) return null;
    if (location.latitude != null && location.longitude != null) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    if (location.city || location.pincode) {
      return [location.city, location.pincode ? `PIN ${location.pincode}` : null]
        .filter(Boolean)
        .join(', ');
    }
    return null;
  };

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={handleSOSClick}
        className="relative overflow-hidden flex items-center gap-3 px-6 py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl shadow-glow-red transition-all duration-200 text-base"
      >
        <AlertTriangle className="animate-pulse flex-shrink-0" size={22} />
        <span>SOS — EMERGENCY</span>
        {/* Subtle shimmer */}
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
      </button>

      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <AlertTriangle className="text-green-400 flex-shrink-0" size={16} />
            <p className="text-green-400 text-sm font-medium">
              Emergency alert sent! Help is on the way.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Out-of-modal error (e.g. geolocation denied before modal opens and we skip modal) */}
      {error && !showModal && !success && (
        <p className="mt-2 text-red-400 text-xs">{error}</p>
      )}

      {/* SOS Modal — native dark, no shadcn */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998]"
            />
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="text-red-400" size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Emergency SOS</h2>
                      <p className="text-xs text-slate-400">
                        Your alert will be sent to all nearby responders
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Location status */}
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <MapPin className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-blue-300">Location Status</p>
                      {locationDisplay() ? (
                        <p className="text-xs text-slate-300 mt-0.5 font-mono">{locationDisplay()}</p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Location unavailable — responders will contact you
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Emergency hotline */}
                  <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <Phone className="text-orange-400 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-orange-300">Emergency Hotline</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        For immediate danger, also call:{' '}
                        <span className="font-bold text-white">112</span>
                      </p>
                    </div>
                  </div>

                  {/* Additional details */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      Tell us more{' '}
                      <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      placeholder="E.g. Trapped on 2nd floor, water rising fast, need urgent evacuation..."
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      rows={3}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg text-white text-sm placeholder-slate-500 resize-none transition-colors disabled:opacity-50"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This helps responders prepare and reach you faster.
                    </p>
                  </div>

                  {/* Inline error */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          Send Emergency Alert
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
