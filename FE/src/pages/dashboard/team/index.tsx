import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  RefreshCw,
  Package,
  Waves,
  Info,
  Loader2,
  Radio,
  Target,
  Phone,
  User,
  Heart,
  Flag,
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { groupsAPI, formatErrorMessage } from '@/lib/api';
import type { GroupCurrentAssignmentResponse, UpdateGroupLocationData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Deployment status options the field team can self-report
const STATUS_OPTIONS = [
  {
    value: 'available',
    label: 'Available',
    icon: Radio,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30',
    activeBg: 'bg-emerald-500/30 border-emerald-400',
  },
  {
    value: 'deployed',
    label: 'Deployed',
    icon: Target,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30',
    activeBg: 'bg-blue-500/30 border-blue-400',
  },
  {
    value: 'rescuing',
    label: 'Rescuing',
    icon: Navigation,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30',
    activeBg: 'bg-orange-500/30 border-orange-400',
  },
] as const;

type DeploymentStatus = 'available' | 'deployed' | 'rescuing';

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40', label: 'Low' },
  MODERATE: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40', label: 'Moderate' },
  SEVERE: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', label: 'Severe' },
};

const TeamPage: React.FC = () => {
  const { token, user } = useAuth();

  const [assignment, setAssignment] = useState<GroupCurrentAssignmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingLoading, setPingLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<DeploymentStatus>('available');
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [operationError, setOperationError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!token) return;
    try {
      const res = await groupsAPI.getMyAssignment(token);
      setAssignment(res);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssignment();
    const interval = setInterval(fetchAssignment, 30_000);
    return () => clearInterval(interval);
  }, [fetchAssignment]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handlePingLocation = async () => {
    if (!token || !user?.userId) return;
    setPingLoading(true);
    setPingError(null);
    setPingSuccess(false);

    if (!navigator.geolocation) {
      setPingError('Geolocation is not supported by this browser.');
      setPingLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data: UpdateGroupLocationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            status: currentStatus,
            battery_level: undefined,
          };

          try {
            const nav = navigator as any;
            if (nav.getBattery) {
              const battery = await nav.getBattery();
              data.battery_level = Math.round(battery.level * 100);
            }
          } catch {
            // Battery API not available
          }

          await groupsAPI.updateMyLocation(user.userId, data, token);
          setLastPing(new Date());
          setPingSuccess(true);
          setTimeout(() => setPingSuccess(false), 3000);
        } catch (err) {
          setPingError('Failed to send location: ' + formatErrorMessage(err));
        } finally {
          setPingLoading(false);
        }
      },
      (err) => {
        setPingError(`GPS error: ${err.message}`);
        setPingLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleStatusChange = async (newStatus: DeploymentStatus) => {
    if (!token || !user?.userId || newStatus === currentStatus) return;
    setStatusLoading(true);
    setOperationError(null);

    const updateStatus = async (lat: number, lng: number, accuracy?: number) => {
      try {
        // Update location status
        await groupsAPI.updateMyLocation(user.userId, { latitude: lat, longitude: lng, accuracy, status: newStatus }, token);
        // Also update operation status (propagates to disaster report if rescuing)
        await groupsAPI.updateMyOperationStatus(newStatus, token);
        setCurrentStatus(newStatus);
      } catch (err) {
        setOperationError('Status update failed: ' + formatErrorMessage(err));
      } finally {
        setStatusLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateStatus(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        () => updateStatus(0, 0),
      );
    } else {
      await updateStatus(0, 0);
    }
  };

  const handleCompleteMission = async () => {
    if (!token) return;
    setCompleteLoading(true);
    setOperationError(null);
    try {
      await groupsAPI.completeMyAssignment(token);
      setCompleteSuccess(true);
      // Re-fetch after a brief delay to reflect resolved state
      setTimeout(() => {
        fetchAssignment();
        setCompleteSuccess(false);
        setCurrentStatus('available');
      }, 2500);
    } catch (err) {
      setOperationError('Failed to complete mission: ' + formatErrorMessage(err));
    } finally {
      setCompleteLoading(false);
    }
  };

  const inc = assignment?.assignment?.incident;
  const citizen = assignment?.assignment?.citizen;
  const severityConf = inc ? (SEVERITY_CONFIG[inc.severity] ?? SEVERITY_CONFIG.MODERATE) : null;

  const resourcesList: string[] = (() => {
    if (!inc?.resources_needed) return [];
    try {
      return JSON.parse(inc.resources_needed);
    } catch {
      return inc.resources_needed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  })();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                My <span className="gradient-text">Mission</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {user?.name ? `Team: ${user.name}` : 'Field team dashboard'}
              </p>
            </div>
            <button
              onClick={fetchAssignment}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Updated {formatTimeAgo(lastRefresh.toISOString())}</span>
            </button>
          </div>
        </motion.div>

        {/* Operation Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-xl p-5 space-y-3"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Operation Status</p>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon, color, bg, activeBg }) => {
              const isActive = currentStatus === value;
              return (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  disabled={statusLoading}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    isActive ? `${activeBg} ${color}` : `${bg} ${color} opacity-60 hover:opacity-100`
                  } disabled:opacity-40`}
                >
                  {statusLoading && isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Mark Mission Complete — shown when assignment exists */}
          {assignment?.assignment && (
            <AnimatePresence>
              {completeSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 font-semibold text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mission complete — report resolved!
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleCompleteMission}
                  disabled={completeLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 hover:border-green-500/60 text-green-400 hover:text-green-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Mark Mission Complete
                </motion.button>
              )}
            </AnimatePresence>
          )}

          {operationError && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {operationError}
            </div>
          )}
        </motion.div>

        {/* Ping Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">GPS Location</p>
            {lastPing && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                Last ping {formatTimeAgo(lastPing.toISOString())}
              </span>
            )}
          </div>

          <button
            onClick={handlePingLocation}
            disabled={pingLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              pingSuccess
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
            } disabled:opacity-60`}
          >
            {pingLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting GPS...
              </>
            ) : pingSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Location sent successfully
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Ping My Location
              </>
            )}
          </button>

          <AnimatePresence>
            {pingError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {pingError}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Battery className="w-3.5 h-3.5" />
            Ping regularly so HQ can see your position on the map
          </p>
        </motion.div>

        {/* Assignment card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Current Assignment
            </h2>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading mission details...</div>
          ) : assignment?.assignment ? (
            <div className="p-5 space-y-4">
              {/* Severity + assigned time */}
              <div className="flex items-center gap-2 flex-wrap">
                {severityConf && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${severityConf.bg} ${severityConf.color}`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {severityConf.label} Severity
                  </span>
                )}
                {inc?.is_sos && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 border border-red-500/40 text-red-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    SOS Alert
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  Assigned {formatTimeAgo(assignment.assignment.assigned_at)}
                </span>
              </div>

              {/* Location */}
              {(inc?.city || inc?.pincode || inc?.latitude) && (
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Incident Location</p>
                    <p className="text-sm font-medium text-white">
                      {[inc?.city, inc?.pincode].filter(Boolean).join(', ') || 'See coordinates below'}
                    </p>
                    {inc?.latitude && inc?.longitude && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {inc.latitude.toFixed(5)}, {inc.longitude.toFixed(5)}
                      </p>
                    )}
                    {inc?.latitude && inc?.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${inc.latitude},${inc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 mt-1 inline-flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        Get directions
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Citizen contact info (only for SOS or user-submitted reports) */}
              {citizen && (citizen.full_name || citizen.phone_number) && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Citizen Contact
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {citizen.full_name && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Name</p>
                        <p className="font-semibold text-white">{citizen.full_name}</p>
                      </div>
                    )}
                    {citizen.blood_group && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Blood Group</p>
                        <p className="font-bold text-red-400 text-lg">{citizen.blood_group}</p>
                      </div>
                    )}
                    {citizen.phone_number && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                        <a
                          href={`tel:${citizen.phone_number}`}
                          className="font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {citizen.phone_number}
                        </a>
                      </div>
                    )}
                  </div>

                  {citizen.medical_conditions && (
                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-400 text-xs font-semibold mb-1 flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        Medical Conditions
                      </p>
                      <p className="text-yellow-200/80 text-xs">{citizen.medical_conditions}</p>
                    </div>
                  )}

                  {citizen.allergies && (
                    <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-orange-400 text-xs font-semibold mb-1">Allergies</p>
                      <p className="text-orange-200/80 text-xs">{citizen.allergies}</p>
                    </div>
                  )}

                  {(citizen.emergency_contact_name || citizen.emergency_contact_phone) && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">Emergency Contact</p>
                      <div className="flex items-center gap-3 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
                        <div className="flex-1 min-w-0">
                          {citizen.emergency_contact_name && (
                            <p className="text-sm font-medium text-white truncate">{citizen.emergency_contact_name}</p>
                          )}
                          {citizen.emergency_contact_relation && (
                            <p className="text-xs text-slate-400">{citizen.emergency_contact_relation}</p>
                          )}
                        </div>
                        {citizen.emergency_contact_phone && (
                          <a
                            href={`tel:${citizen.emergency_contact_phone}`}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors flex-shrink-0"
                          >
                            <Phone className="w-3 h-3" />
                            {citizen.emergency_contact_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Water level */}
              {inc?.water_level && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Waves className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Water Level</p>
                    <p className="text-sm font-medium text-blue-400 capitalize">
                      {inc.water_level.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(inc?.notes || assignment.assignment.notes) && (
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                    <p className="text-sm text-slate-300">
                      {assignment.assignment.notes || inc?.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Resources needed */}
              {resourcesList.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    Resources needed at site
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {resourcesList.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No active mission</p>
              <p className="text-slate-500 text-sm mt-1">
                Stand by — HQ will dispatch you when needed
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <WifiOff className="w-3.5 h-3.5" />
                Keep pinging your location so HQ can see you on the map
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;
