import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardAPI } from '@/lib/api';
import type { Incident } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import { getSeverityConfig } from '@/lib/dashboard-utils';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  AlertTriangle,
  MapPin,
  Users,
  Calendar,
  FileText,
  Loader2,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'LOW' | 'MODERATE' | 'SEVERE' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('ricos_token');
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const data = await dashboardAPI.getIncidents(token, {
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined,
          severity: severityFilter || undefined,
        });
        setIncidents(data.incidents);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        // Auto-expand all location groups so incidents are visible by default
        const keys = new Set<string>();
        data.incidents.forEach((inc) => {
          const city = inc.city || inc.village || 'Unknown Location';
          const pincode = inc.pincode || 'No Pincode';
          keys.add(`${city}-${pincode}`);
        });
        setExpandedLocations(keys);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to load incidents data');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [currentPage, searchQuery, severityFilter]);

  const toggleLocation = (key: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedLocations(newExpanded);
  };

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSeverityFilter = (value: string) => {
    setSeverityFilter(value as any);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group incidents by city and pincode
  const groupedIncidents = incidents.reduce((acc, incident) => {
    const city = incident.city || incident.village || 'Unknown Location';
    const pincode = incident.pincode || 'No Pincode';
    const key = `${city}|${pincode}`;

    if (!acc[key]) {
      acc[key] = { city, pincode, incidents: [], totalAffected: 0, highestSeverity: 'LOW' };
    }

    acc[key].incidents.push(incident);
    acc[key].totalAffected += incident.affected_population || 0;

    if (incident.severity === 'SEVERE') {
      acc[key].highestSeverity = 'SEVERE';
    } else if (incident.severity === 'MODERATE' && acc[key].highestSeverity !== 'SEVERE') {
      acc[key].highestSeverity = 'MODERATE';
    }

    return acc;
  }, {} as Record<string, { city: string; pincode: string; incidents: Incident[]; totalAffected: number; highestSeverity: string }>);

  const sortedLocations = Object.values(groupedIncidents).sort(
    (a, b) => b.incidents.length - a.incidents.length
  );

  const severityButtons: { label: string; value: '' | 'SEVERE' | 'MODERATE' | 'LOW' }[] = [
    { label: 'All', value: '' },
    { label: 'Severe', value: 'SEVERE' },
    { label: 'Moderate', value: 'MODERATE' },
    { label: 'Low', value: 'LOW' },
  ];

  const statCards = [
    { label: 'Total Incidents', value: incidents.length, icon: AlertTriangle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10', accent: 'from-red-500/20 to-transparent', border: 'border-red-500/20' },
    { label: 'Severe Cases', value: incidents.filter((i) => i.severity === 'SEVERE').length, icon: AlertTriangle, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10', accent: 'from-orange-500/20 to-transparent', border: 'border-orange-500/20' },
    { label: 'People Affected', value: incidents.reduce((sum, i) => sum + (i.affected_population || 0), 0), icon: Users, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500/20 to-transparent', border: 'border-blue-500/20' },
    { label: 'Affected Locations', value: sortedLocations.length, icon: MapPin, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10', accent: 'from-purple-500/20 to-transparent', border: 'border-purple-500/20' },
  ];

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
        <h1 className="text-3xl font-bold text-white">
          Disaster <span className="gradient-text">Incidents</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Active incident reports submitted by users across affected areas ({total} total)
        </p>
      </motion.div>

      {/* Search + Filter */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search by city, pincode, or notes..."
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-dark w-full pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {severityButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleSeverityFilter(btn.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    severityFilter === btn.value
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={fadeInUp}
              className={`relative overflow-hidden rounded-xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={card.iconColor} size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold text-white mt-0.5">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Incidents List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-blue-400" size={32} />
            <p className="text-slate-400 text-sm">Loading incidents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <Info className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Active Incidents</h3>
          <p className="text-slate-400 text-sm">
            There are currently no active disaster incidents reported by users.
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} className="space-y-3">
          {sortedLocations.map((location, i) => {
            const locationKey = `${location.city}-${location.pincode}`;
            const isExpanded = expandedLocations.has(locationKey);
            const sevCfg = getSeverityConfig(location.highestSeverity);

            return (
              <motion.div
                key={locationKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <div className="glass-card rounded-xl overflow-hidden">
                  {/* Location Header — collapsible */}
                  <button
                    onClick={() => toggleLocation(locationKey)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="text-blue-400 flex-shrink-0" size={18} />
                      <div>
                        <h2 className="text-base font-bold text-white">{location.city}</h2>
                        <p className="text-xs text-slate-400">Pincode: {location.pincode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {location.incidents.length > 1 && (
                        <span className="px-2 py-0.5 bg-orange-500/15 border border-orange-500/40 rounded text-xs text-orange-400">
                          {location.incidents.length} Reports
                        </span>
                      )}
                      <span className={`px-2 py-0.5 ${sevCfg.bg} border ${sevCfg.border} rounded text-xs ${sevCfg.color}`}>
                        {location.highestSeverity}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/40 rounded text-xs text-blue-400">
                        {location.totalAffected.toLocaleString()} affected
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="text-slate-500 ml-1" size={16} />
                      ) : (
                        <ChevronDown className="text-slate-500 ml-1" size={16} />
                      )}
                    </div>
                  </button>

                  {/* Expandable incident cards */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 p-4 pt-0 pl-10 border-t border-slate-800/80">
                          {location.incidents.map((incident, index) => {
                            const incSev = getSeverityConfig(incident.severity);
                            return (
                              <div
                                key={incident.id}
                                className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl"
                              >
                                <div className="space-y-3">
                                  {/* Incident header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-red-500/10 rounded-lg">
                                        <AlertTriangle className="text-red-400" size={16} />
                                      </div>
                                      <div>
                                        <h3 className="text-sm font-semibold text-white">
                                          Report #{index + 1}
                                          {location.incidents.length > 1 && (
                                            <span className="text-xs text-orange-400 ml-2">(Duplicate Location)</span>
                                          )}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                          Reported on {formatDate(incident.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-0.5 ${incSev.bg} border ${incSev.border} rounded text-xs ${incSev.color} flex-shrink-0`}>
                                      {incident.severity}
                                    </span>
                                  </div>

                                  {/* Details grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2">
                                      <Users className="text-slate-500" size={14} />
                                      <div>
                                        <p className="text-xs text-slate-500">Affected</p>
                                        <p className="text-sm text-white">{incident.affected_population || 0} people</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="text-slate-500" size={14} />
                                      <div>
                                        <p className="text-xs text-slate-500">Trapped</p>
                                        <p className="text-sm text-white">
                                          {incident.stuck_people_found ? 'People Trapped' : 'None Reported'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="text-slate-500" size={14} />
                                      <div>
                                        <p className="text-xs text-slate-500">Last Updated</p>
                                        <p className="text-sm text-white">{formatDate(incident.updatedAt)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Resources Needed */}
                                  {incident.resources_needed && incident.resources_needed.length > 0 && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1.5">Resources Needed:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {incident.resources_needed.map((resource, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/40 rounded text-xs text-blue-400"
                                          >
                                            {resource}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {incident.notes && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="text-slate-500 mt-0.5 flex-shrink-0" size={14} />
                                      <div>
                                        <p className="text-xs text-slate-500 mb-0.5">Notes:</p>
                                        <p className="text-sm text-slate-300">{incident.notes}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Water Level */}
                                  {incident.water_level && (
                                    <div>
                                      <p className="text-xs text-slate-500">Water Level:</p>
                                      <p className="text-sm text-white">{incident.water_level}</p>
                                    </div>
                                  )}

                                  {/* Coordinates */}
                                  {incident.latitude && incident.longitude && (
                                    <p className="text-xs text-slate-600">
                                      Coordinates: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[36px] px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </motion.div>
    </DashboardLayout>
  );
};

export default IncidentsPage;
