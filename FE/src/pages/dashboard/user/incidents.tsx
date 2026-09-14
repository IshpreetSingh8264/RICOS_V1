import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userIncidentAPI } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  AlertTriangle,
  MapPin,
  Users,
  FileText,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';

interface GroupedIncident {
  city: string;
  pincode: string;
  incidents: any[];
  activeGroups: any[];
}

const severityBadgeClass = (severity: string) => {
  switch (severity.toUpperCase()) {
    case 'SEVERE':
      return 'bg-red-500/20 border border-red-500/40 text-red-400';
    case 'MODERATE':
      return 'bg-orange-500/20 border border-orange-500/40 text-orange-400';
    case 'LOW':
      return 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400';
    default:
      return 'bg-slate-500/20 border border-slate-500/40 text-slate-400';
  }
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getHighestSeverity = (incidents: any[]) => {
  const order: Record<string, number> = { SEVERE: 3, MODERATE: 2, LOW: 1 };
  return incidents.reduce((highest, incident) => {
    const current = order[incident.severity] || 0;
    const highestVal = order[highest] || 0;
    return current > highestVal ? incident.severity : highest;
  }, 'LOW');
};

const statCards = (groupedIncidents: GroupedIncident[]) => [
  {
    label: 'Total Reports',
    value: groupedIncidents.reduce((s, g) => s + g.incidents.length, 0),
    icon: AlertTriangle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    accent: 'from-red-500 to-rose-400',
    border: 'border-red-500/20',
  },
  {
    label: 'Affected Locations',
    value: groupedIncidents.length,
    icon: MapPin,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    accent: 'from-orange-500 to-amber-400',
    border: 'border-orange-500/20',
  },
  {
    label: 'Active Groups',
    value: groupedIncidents.reduce((s, g) => s + g.activeGroups.length, 0),
    icon: Users,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    accent: 'from-blue-500 to-cyan-400',
    border: 'border-blue-500/20',
  },
  {
    label: 'Response Rate',
    value: 'Active',
    icon: CheckCircle,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    accent: 'from-green-500 to-emerald-400',
    border: 'border-green-500/20',
  },
];

const UserIncidentsPage = () => {
  const [groupedIncidents, setGroupedIncidents] = useState<GroupedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('ricos_token');
        if (!token) { setError('No authentication token found'); return; }

        const response = await userIncidentAPI.getAllIncidentsGrouped(token);
        if (response.success) setGroupedIncidents(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const toggleLocation = (key: string) => {
    const next = new Set(expandedLocations);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedLocations(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text">Active Incidents</h1>
        <p className="text-slate-400">Incident reports from citizens across affected areas</p>
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards(groupedIncidents).map((card) => {
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

      {/* Incidents List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : groupedIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-slate-700/50 bg-slate-900/60">
          <Info className="text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">No Incidents Reported</h3>
          <p className="text-slate-400 text-sm">There are currently no incident reports in your area.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {groupedIncidents.map((location) => {
            const locationKey = `${location.city}-${location.pincode}`;
            const isExpanded = expandedLocations.has(locationKey);
            const highestSeverity = getHighestSeverity(location.incidents);

            return (
              <motion.div
                key={locationKey}
                variants={fadeInUp}
                className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm"
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleLocation(locationKey)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                      <MapPin className="text-blue-400" size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{location.city}</h2>
                      <p className="text-xs text-slate-400">Pincode: {location.pincode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {location.incidents.length > 1 && (
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400`}>
                        {location.incidents.length} Reports
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${severityBadgeClass(highestSeverity)}`}>
                      {highestSeverity}
                    </span>
                    {location.activeGroups.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400">
                        {location.activeGroups.length} Responding
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronUp className="text-slate-400 ml-1" size={18} />
                      : <ChevronDown className="text-slate-400 ml-1" size={18} />
                    }
                  </div>
                </button>

                {/* Collapsible Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-slate-700/50 space-y-4">
                        {/* Active Groups */}
                        {location.activeGroups.length > 0 && (
                          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                              <Users size={15} />
                              Active Response Groups
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {location.activeGroups.map((group: any) => (
                                <div key={group.id} className="bg-slate-800/60 rounded-lg p-2.5">
                                  <p className="text-sm font-semibold text-white">{group.group_name}</p>
                                  <p className="text-xs text-slate-400">
                                    {group.ngo?.ngo_name || group.government?.agency_name || group.volunteer?.group_name || 'Unknown'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Incidents */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Incident Reports
                          </h3>
                          {location.incidents.map((incident, index) => (
                            <div
                              key={incident.id}
                              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-3"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-red-500/10 rounded-lg">
                                    <AlertTriangle className="text-red-400" size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">
                                      Report #{index + 1}
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                      {formatDate(incident.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${severityBadgeClass(incident.severity)}`}>
                                  {incident.severity}
                                </span>
                              </div>

                              {/* Notes */}
                              {incident.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                  <FileText className="text-slate-400 mt-0.5 flex-shrink-0" size={13} />
                                  <p className="text-slate-300">{incident.notes}</p>
                                </div>
                              )}

                              {/* Status row */}
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">
                                  Status:{' '}
                                  <span className={`font-semibold ${
                                    incident.status === 'pending' ? 'text-yellow-400' :
                                    incident.status === 'approved' ? 'text-green-400' :
                                    'text-slate-400'
                                  }`}>
                                    {incident.status}
                                  </span>
                                </span>
                                {incident.stuck_people_found && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-medium">
                                    People Trapped
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default UserIncidentsPage;
