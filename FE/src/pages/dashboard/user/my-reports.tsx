import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { userIncidentAPI, type UserIncident } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import { getSeverityConfig, getStatusConfig } from '@/lib/dashboard-utils';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
  FileText,
  Navigation,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
  Radio,
  Users,
} from 'lucide-react';

const MyReportsPage = () => {
  const [reports, setReports] = useState<UserIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<UserIncident | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ricos_token');
      if (!token) { setError('No authentication token found'); return; }

      const response = await userIncidentAPI.getMyIncidents(token);
      if (response.success) {
        setReports(response.incidents || []);
      } else {
        setReports([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

  const getTimeSince = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const openInMaps = (lat?: number, lng?: number) => {
    if (lat == null || lng == null) return;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

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
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="flex items-center gap-3 p-5 rounded-xl border border-red-500/30 bg-red-500/10 max-w-md w-full">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-white">Error Loading Reports</h3>
              <p className="text-slate-400 text-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
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
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              My <span className="gradient-text">Reports</span>
            </h1>
            <p className="text-slate-400">All your submitted incident and SOS reports</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-lg text-sm transition-all"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </motion.div>

        {/* Summary stat strip */}
        {reports.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
              <div className="grid grid-cols-4 gap-4 text-center divide-x divide-slate-700/50">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-3xl font-bold text-white">{reports.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">SOS Alerts</p>
                  <p className="text-3xl font-bold text-red-400">
                    {reports.filter(r => r.is_sos).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {reports.filter(r => r.status?.toLowerCase() === 'pending').length}
                  </p>
                </div>
                <div>
                   <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Responded</p>
                   <p className="text-3xl font-bold text-green-400">
                     {reports.filter(r => ['approved', 'team_assigned', 'in_progress', 'resolved'].includes(r.status?.toLowerCase() ?? '')).length}
                   </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reports list */}
        {reports.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-slate-700/50 bg-slate-900/60">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-blue-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Reports Yet</h3>
              <p className="text-slate-400 text-sm text-center max-w-sm">
                You haven't submitted any incident reports yet. Use the SOS button or the incident form to report an emergency.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} className="space-y-4">
            {reports.map((report, index) => {
              const sevCfg = getSeverityConfig(report.severity);
              const statusCfg = getStatusConfig(report.status);
              return (
                <motion.div
                  key={report.id}
                  variants={fadeInUp}
                  custom={index}
                  onClick={() => setSelectedReport(report)}
                  className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 backdrop-blur-sm p-5 cursor-pointer transition-all group"
                >
                  <div className={`absolute inset-y-0 left-0 w-0.5 ${report.is_sos ? 'bg-red-500/70' : 'bg-blue-500/50'}`} />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {report.is_sos && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                            <Radio size={10} className="animate-pulse" />
                            SOS
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sevCfg.bg} border ${sevCfg.border} ${sevCfg.color}`}>
                          {report.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${statusCfg.bg} border ${statusCfg.border} ${statusCfg.color}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                        <Clock size={11} />
                        {formatTimestamp(report.createdAt)} &bull; {getTimeSince(report.createdAt)}
                      </p>
                      <div className="space-y-0.5 mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <MapPin size={13} className="text-blue-400 flex-shrink-0" />
                          <span className="font-medium">{report.city || 'Unknown City'}, PIN: {report.pincode || 'N/A'}</span>
                        </div>
                        {report.latitude != null && report.longitude != null && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 ml-5">
                            <Navigation size={11} />
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                      {report.notes && (
                        <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-300 line-clamp-2">{report.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2 md:min-w-[120px]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ring-4 ${
                        report.status?.toLowerCase() === 'pending'
                          ? 'bg-yellow-500 ring-yellow-500/30'
                          : report.status?.toLowerCase() === 'team_assigned'
                          ? 'bg-blue-500 ring-blue-500/30'
                          : report.status?.toLowerCase() === 'in_progress'
                          ? 'bg-orange-500 ring-orange-500/30'
                          : report.status?.toLowerCase() === 'resolved' || report.status?.toLowerCase() === 'approved'
                          ? 'bg-green-500 ring-green-500/30'
                          : report.status?.toLowerCase() === 'rejected'
                          ? 'bg-red-600 ring-red-600/30'
                          : 'bg-slate-600 ring-slate-500/30'
                      }`}>
                        {report.status?.toLowerCase() === 'pending' ? (
                          <Clock className="w-6 h-6 text-white" />
                        ) : report.status?.toLowerCase() === 'team_assigned' ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : report.status?.toLowerCase() === 'in_progress' ? (
                          <Navigation className="w-6 h-6 text-white" />
                        ) : report.status?.toLowerCase() === 'resolved' || report.status?.toLowerCase() === 'approved' ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : report.status?.toLowerCase() === 'rejected' ? (
                          <XCircle className="w-6 h-6 text-white" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        report.status?.toLowerCase() === 'pending' ? 'text-yellow-400'
                        : report.status?.toLowerCase() === 'team_assigned' ? 'text-blue-400'
                        : report.status?.toLowerCase() === 'in_progress' ? 'text-orange-400'
                        : report.status?.toLowerCase() === 'resolved' || report.status?.toLowerCase() === 'approved' ? 'text-green-400'
                        : report.status?.toLowerCase() === 'rejected' ? 'text-red-400'
                        : 'text-slate-400'
                      }`}>
                        {report.status?.toLowerCase() === 'pending' ? 'Awaiting Response'
                          : report.status?.toLowerCase() === 'team_assigned' ? 'Team Assigned'
                          : report.status?.toLowerCase() === 'in_progress' ? 'Help En Route'
                          : report.status?.toLowerCase() === 'resolved' || report.status?.toLowerCase() === 'approved' ? 'Resolved'
                          : report.status?.toLowerCase() === 'rejected' ? 'Rejected'
                          : report.status || 'Unknown'}
                      </p>
                      <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                        View details →
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
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
                className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedReport.is_sos ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                      {selectedReport.is_sos
                        ? <Radio className="text-red-400" size={20} />
                        : <FileText className="text-blue-400" size={20} />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedReport.is_sos ? 'SOS Report' : 'Incident Report'} Details
                      </h2>
                      <p className="text-xs text-slate-400">ID: {selectedReport.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedReport.is_sos && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                        <Radio size={10} className="animate-pulse" />
                        SOS Alert
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getSeverityConfig(selectedReport.severity).bg} border ${getSeverityConfig(selectedReport.severity).border} ${getSeverityConfig(selectedReport.severity).color}`}>
                      {selectedReport.severity}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusConfig(selectedReport.status).bg} border ${getStatusConfig(selectedReport.status).border} ${getStatusConfig(selectedReport.status).color}`}>
                      {selectedReport.status}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-blue-400" />
                      Location Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'City', value: selectedReport.city || 'Unknown' },
                        { label: 'Village', value: selectedReport.village || '—' },
                        { label: 'Pincode', value: selectedReport.pincode || 'N/A' },
                        ...(selectedReport.latitude != null && selectedReport.longitude != null
                          ? [{ label: 'Coordinates', value: `${selectedReport.latitude.toFixed(6)}, ${selectedReport.longitude.toFixed(6)}` }]
                          : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-slate-400">{label}:</span>
                          <span className="font-medium text-white text-xs font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                    {selectedReport.latitude != null && selectedReport.longitude != null && (
                      <button
                        onClick={() => openInMaps(selectedReport.latitude, selectedReport.longitude)}
                        className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation size={15} />
                        Open in Google Maps
                      </button>
                    )}
                  </div>

                  {/* Incident Details */}
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                      <AlertTriangle size={16} className="text-slate-400" />
                      Incident Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Affected People', value: selectedReport.affected_population ?? '—' },
                        { label: 'People Trapped', value: selectedReport.stuck_people_found ? 'Yes' : 'No' },
                        ...(selectedReport.water_level ? [{ label: 'Water Level', value: selectedReport.water_level }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-slate-400">{label}:</span>
                          <span className="font-medium text-white text-xs">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    {selectedReport.resources_needed && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-400 mb-1.5">Resources Needed:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(typeof selectedReport.resources_needed === 'string'
                            ? selectedReport.resources_needed.split(',').map(r => r.trim()).filter(Boolean)
                            : []
                          ).map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/40 rounded text-xs text-blue-400">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-slate-400" />
                      Timeline
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Submitted', value: formatTimestamp(selectedReport.createdAt) },
                        { label: 'Last Updated', value: formatTimestamp(selectedReport.updatedAt) },
                        { label: 'Time Since', value: getTimeSince(selectedReport.createdAt) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-slate-400">{label}:</span>
                          <span className="font-medium text-white text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedReport.notes && (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <h3 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2 text-sm">
                        <FileText size={16} />
                        Notes
                      </h3>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedReport.notes}
                      </p>
                    </div>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default MyReportsPage;
