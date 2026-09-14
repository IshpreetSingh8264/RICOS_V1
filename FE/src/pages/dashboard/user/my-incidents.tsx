import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { userIncidentAPI, type UserIncident } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
} from 'lucide-react';

const MyIncidentsPage = () => {
  const [incidents, setIncidents] = useState<UserIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyIncidents();
  }, []);

  const fetchMyIncidents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ricos_token');
      if (!token) { setError('No authentication token found'); return; }

      const response = await userIncidentAPI.getMyIncidents(token);
      if (response.success) setIncidents(response.incidents);
    } catch (err: any) {
      setError(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'bg-red-500/20 border border-red-500/40 text-red-400';
      case 'MODERATE':
        return 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400';
      case 'LOW':
      case 'MINOR':
        return 'bg-blue-500/20 border border-blue-500/40 text-blue-400';
      default:
        return 'bg-slate-500/20 border border-slate-500/40 text-slate-400';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-500/20 border border-green-500/40 text-green-400';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 border border-blue-500/40 text-blue-400';
      case 'PENDING':
        return 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400';
      default:
        return 'bg-slate-500/20 border border-slate-500/40 text-slate-400';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statCards = [
    {
      label: 'Total Reports',
      value: (incidents && incidents.length) || 0,
      icon: AlertTriangle,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      accent: 'from-blue-500 to-cyan-400',
      border: 'border-blue-500/20',
    },
    {
      label: 'Severe / Critical',
      value: incidents?.filter(i => i.severity === 'SEVERE' || i.severity === 'CRITICAL').length || 0,
      icon: AlertCircle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      accent: 'from-red-500 to-rose-400',
      border: 'border-red-500/20',
    },
    {
      label: 'Resolved',
      value: incidents?.filter(i => i.status === 'RESOLVED').length || 0,
      icon: CheckCircle,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      accent: 'from-green-500 to-emerald-400',
      border: 'border-green-500/20',
    },
    {
      label: 'People Trapped',
      value: incidents?.filter(i => i.stuck_people_found).length || 0,
      icon: Users,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      accent: 'from-orange-500 to-amber-400',
      border: 'border-orange-500/20',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="animate-spin text-blue-400" size={40} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center gap-3 p-5 rounded-xl border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-white">Error Loading Reports</h3>
              <p className="text-slate-400 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="space-y-1">
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <FileText className="text-blue-400" size={28} />
            My Reports
          </h1>
          <p className="text-slate-400">
            Track all incidents and SOS alerts you've reported through RICOS
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={fadeInUp}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden rounded-xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5`}
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                    <Icon className={card.iconColor} size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Reports List */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold text-white mb-4">All Reports</h2>

          {!incidents || incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-slate-700/50 bg-slate-900/60">
              <FileText className="text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 font-medium">No incident reports yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Use the SOS button on your dashboard to report emergencies
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 backdrop-blur-sm p-5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {incident.is_sos && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/30 border border-red-500/50 text-red-300">
                            <AlertTriangle size={11} />
                            SOS ALERT
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityClass(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        {incident.stuck_people_found && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400">
                            <Users size={11} />
                            People Trapped
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <MapPin size={13} />
                        <span>
                          {incident.city || 'Unknown City'}, PIN: {incident.pincode || 'N/A'}
                        </span>
                      </div>

                      {/* Coordinates */}
                      {incident.latitude && incident.longitude && (
                        <p className="text-xs text-slate-500 mb-2">
                          Coordinates: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                        </p>
                      )}

                      {/* Notes */}
                      {incident.notes && (
                        <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                          <p className="text-sm text-slate-300">{incident.notes}</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-slate-500 text-xs mt-3">
                        <Clock size={11} />
                        <span>Reported on {formatDate(incident.createdAt)}</span>
                      </div>
                    </div>

                    {/* Map Button */}
                    <button
                      onClick={() => {
                        if (incident.latitude && incident.longitude) {
                          window.open(
                            `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
                            '_blank'
                          );
                        }
                      }}
                      disabled={!incident.latitude || !incident.longitude}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <MapPin size={13} />
                      View Map
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyIncidentsPage;
