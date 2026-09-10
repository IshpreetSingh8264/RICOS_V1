import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { sosAPI, groupsAPI, type SOSReport, type TeamRecommendation } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  User,
  Loader2,
  FileText,
  Navigation,
  CheckCircle,
  Users,
  Star,
  Zap,
  Package,
  X,
  ArrowRight,
  RefreshCw,
  Shield,
} from 'lucide-react';

const SOSReportsPage = () => {
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SOSReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showTeamDrawer, setShowTeamDrawer] = useState(false);
  const [teamRecLoading, setTeamRecLoading] = useState(false);
  const [teamRecs, setTeamRecs] = useState<TeamRecommendation[]>([]);
  const [teamRecError, setTeamRecError] = useState<string | null>(null);
  const [assigningTeam, setAssigningTeam] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ricos_token');
      if (!token) { setError('No authentication token found'); return; }
      const response = await sosAPI.getAllActiveReports(token);
      if (response.success) setReports(response.reports || []);
      else setReports([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load SOS reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (report: SOSReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
    setShowTeamDrawer(false);
    setTeamRecs([]);
    setAssignSuccess(null);
    setTeamRecError(null);
  };

  const handleRecommendTeam = async (report: SOSReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
    setShowTeamDrawer(true);
    setTeamRecs([]);
    setTeamRecError(null);
    setAssignSuccess(null);
    setTeamRecLoading(true);
    try {
      const token = localStorage.getItem('ricos_token');
      if (!token) throw new Error('Not authenticated');
      const result = await groupsAPI.recommendTeams(report.id, token);
      setTeamRecs(result.recommendations || []);
      if (result.recommendations.length === 0)
        setTeamRecError('No field teams with known location found. Teams need to ping their GPS first.');
    } catch (err: any) {
      setTeamRecError(err.message || 'Failed to get recommendations');
    } finally {
      setTeamRecLoading(false);
    }
  };

  const handleAssignTeam = async (team: TeamRecommendation) => {
    const token = localStorage.getItem('ricos_token');
    if (!token || !selectedReport) return;
    setAssigningTeam(team.group_id);
    try {
      await groupsAPI.assignGroup(team.group_id, { disaster_report_id: selectedReport.id }, token);
      setAssignSuccess(`"${team.group_name}" has been assigned to this SOS alert.`);
      setTeamRecs((prev) =>
        prev.map((t) => t.group_id === team.group_id ? { ...t, already_assigned: true, status: 'deployed' } : t)
      );
      // Mutate local reports state so the card reflects 'team_assigned' immediately
      setReports((prev) =>
        prev.map((r) => r.id === selectedReport.id ? { ...r, status: 'team_assigned' } : r)
      );
      // Also update the selectedReport ref so modal badges update too
      setSelectedReport((prev) => prev ? { ...prev, status: 'team_assigned' } : prev);
    } catch (err: any) {
      setTeamRecError(err.message || 'Failed to assign team');
    } finally {
      setAssigningTeam(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString();
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return { dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-400 border border-red-500/30' };
      case 'moderate': return { dot: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' };
      case 'mild': return { dot: 'bg-yellow-500', badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' };
      default: return { dot: 'bg-slate-500', badge: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' };
    }
  };

  const getStatusStyle = (status: string): { className: string; label: string } => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { className: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', label: 'Pending' };
      case 'team_assigned':
        return { className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', label: 'Team Assigned' };
      case 'in_progress':
        return { className: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', label: 'Help En Route' };
      case 'resolved':
        return { className: 'bg-green-500/15 text-green-400 border border-green-500/30', label: 'Resolved' };
      case 'approved':
        return { className: 'bg-green-500/15 text-green-400 border border-green-500/30', label: 'Approved' };
      case 'rejected':
        return { className: 'bg-red-500/15 text-red-400 border border-red-500/30', label: 'Rejected' };
      default:
        return { className: 'bg-slate-500/15 text-slate-400 border border-slate-500/30', label: status || 'Unknown' };
    }
  };

  const getTeamStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-green-500/20 text-green-400 border border-green-500/40',
      deployed: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
      rescuing: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
      offline: 'bg-slate-500/20 text-slate-400 border border-slate-500/40',
    };
    return map[status] || map.offline;
  };

  const openInMaps = (lat: number, lng: number) => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');

  // Status-aware deploy button label
  const getDeployButtonLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'team_assigned': return 'Reassign Team';
      case 'in_progress': return 'Reassign Team';
      case 'resolved': return 'Resolved';
      default: return 'Deploy Team';
    }
  };

  const statCards = [
    { label: 'Total Alerts', value: reports.length, icon: AlertTriangle, iconColor: 'text-red-400', iconBg: 'bg-red-500/10', accent: 'from-red-500 to-transparent', border: 'border-red-500/20' },
    { label: 'Pending', value: reports.filter(r => r.status?.toLowerCase() === 'pending').length, icon: Clock, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10', accent: 'from-orange-500 to-transparent', border: 'border-orange-500/20' },
    { label: 'Team Assigned', value: reports.filter(r => ['team_assigned', 'in_progress'].includes(r.status?.toLowerCase())).length, icon: Shield, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500 to-transparent', border: 'border-blue-500/20' },
    { label: 'Resolved', value: reports.filter(r => r.status?.toLowerCase() === 'resolved').length, icon: CheckCircle, iconColor: 'text-green-400', iconBg: 'bg-green-500/10', accent: 'from-green-500 to-transparent', border: 'border-green-500/20' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading SOS reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Reports</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                SOS <span className="gradient-text">Reports</span>
              </h1>
              <p className="text-slate-400 text-sm">Emergency alerts — assign field teams to respond</p>
            </div>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <motion.div
              key={card.label}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                  <card.icon className={card.iconColor} size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <motion.div variants={fadeInUp} className="text-center py-16">
            <div className="glass-card p-8 max-w-md mx-auto">
              <AlertTriangle className="w-14 h-14 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No SOS Alerts</h3>
              <p className="text-slate-400">No active emergency alerts right now.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((report, index) => {
              const sevStyle = getSeverityStyle(report.severity);
              const statusStyle = getStatusStyle(report.status);
              const isResolved = report.status?.toLowerCase() === 'resolved';
              const isAssigned = ['team_assigned', 'in_progress'].includes(report.status?.toLowerCase());
              // Left border color based on status
              const borderColor = isResolved
                ? 'border-green-500/20 hover:border-green-500/40'
                : isAssigned
                  ? 'border-blue-500/20 hover:border-blue-500/40'
                  : 'border-red-500/20 hover:border-red-500/40';
              const leftAccent = isResolved
                ? 'bg-green-500'
                : isAssigned
                  ? 'bg-blue-500'
                  : 'bg-red-500';
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -2 }}
                  className={`relative overflow-hidden rounded-xl border ${borderColor} bg-slate-900/60 backdrop-blur-sm p-5 transition-all`}
                >
                  <div className={`absolute inset-y-0 left-0 w-1 ${leftAccent} rounded-l-xl`} />
                  <div className="pl-2">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {report.user_name}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(report.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevStyle.badge}`}>
                          {report.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{report.city || 'Unknown City'}{report.pincode ? `, ${report.pincode}` : ''}</span>
                    </div>

                    {report.phone_number && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${report.phone_number}`} className="hover:text-blue-400 transition-colors">
                          {report.phone_number}
                        </a>
                      </div>
                    )}

                    {report.notes && (
                      <div className="mb-3 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400 line-clamp-2">{report.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openDetailsModal(report)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-lg text-sm transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => openInMaps(report.latitude, report.longitude)}
                        className="px-3 py-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-lg transition-all"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => !isResolved && handleRecommendTeam(report)}
                        disabled={isResolved}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isAssigned
                            ? 'bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300'
                            : isResolved
                              ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {getDeployButtonLabel(report.status)}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Details + Team Assignment Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { setShowDetailsModal(false); setShowTeamDrawer(false); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${showTeamDrawer ? 'w-full max-w-4xl' : 'w-full max-w-2xl'} max-h-[90vh] flex`}
              >
                {/* Left: Report Details */}
                <div className={`${showTeamDrawer ? 'w-1/2 border-r border-slate-700/50' : 'w-full'} overflow-y-auto flex-shrink-0`}>
                  <div className="p-6">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-bold text-lg text-white">SOS Alert</span>
                        </div>
                        <p className="text-slate-400 text-sm">{selectedReport.user_name} · {formatTimestamp(selectedReport.created_at)}</p>
                      </div>
                      <button
                        onClick={() => { setShowDetailsModal(false); setShowTeamDrawer(false); }}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mb-5 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getSeverityStyle(selectedReport.severity).badge}`}>
                        {selectedReport.severity}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(selectedReport.status).className}`}>
                        {getStatusStyle(selectedReport.status).label}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Person Info */}
                      <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" /> Person in Emergency
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-0.5">Name</p>
                            <p className="font-semibold text-white">{selectedReport.user_name}</p>
                          </div>
                          {selectedReport.age && (
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Age / Gender</p>
                              <p className="font-medium text-white">{selectedReport.age}{selectedReport.gender && ` / ${selectedReport.gender}`}</p>
                            </div>
                          )}
                          {selectedReport.phone_number && (
                            <div className="col-span-2">
                              <p className="text-slate-500 text-xs mb-0.5">Phone</p>
                              <a href={`tel:${selectedReport.phone_number}`} className="font-semibold text-blue-400 hover:underline flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                {selectedReport.phone_number}
                              </a>
                            </div>
                          )}
                          {selectedReport.blood_group && (
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Blood Group</p>
                              <p className="font-bold text-red-400 text-lg">{selectedReport.blood_group}</p>
                            </div>
                          )}
                          {selectedReport.emergency_contact_name && (
                            <div className="col-span-2 pt-2 border-t border-slate-700/50 mt-1">
                              <p className="text-slate-500 text-xs mb-1">Emergency Contact</p>
                              <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 text-xs">
                                <div>
                                  <p className="font-semibold text-white">{selectedReport.emergency_contact_name}</p>
                                  {selectedReport.emergency_contact_relation && (
                                    <p className="text-slate-400">{selectedReport.emergency_contact_relation}</p>
                                  )}
                                </div>
                                {selectedReport.emergency_contact_phone && (
                                  <a href={`tel:${selectedReport.emergency_contact_phone}`} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors">
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedReport.medical_conditions && (
                          <div className="mt-3 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-xs font-semibold mb-1">Medical Conditions</p>
                            <p className="text-yellow-200/80 text-xs">{selectedReport.medical_conditions}</p>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" /> Location
                        </h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">City</span>
                            <span className="text-white font-medium">{selectedReport.city || 'Unknown'}</span>
                          </div>
                          {selectedReport.pincode && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Pincode</span>
                              <span className="text-white">{selectedReport.pincode}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Coordinates</span>
                            <span className="text-white font-mono text-xs">
                              {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => openInMaps(selectedReport.latitude, selectedReport.longitude)}
                          className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-green-700/40 hover:bg-green-700/60 border border-green-600/30 text-green-300 rounded-lg text-sm transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Open in Maps
                        </button>
                      </div>

                      {selectedReport.notes && (
                        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-yellow-400" /> Notes
                          </h4>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedReport.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => { setShowDetailsModal(false); setShowTeamDrawer(false); }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-xl text-sm font-medium transition-all"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleRecommendTeam(selectedReport)}
                        disabled={selectedReport.status?.toLowerCase() === 'resolved'}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all"
                      >
                        <Users className="w-4 h-4" />
                        {showTeamDrawer ? 'Refresh Teams' : getDeployButtonLabel(selectedReport.status)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Team Recommendation Drawer */}
                <AnimatePresence>
                  {showTeamDrawer && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '50%', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden flex-shrink-0"
                    >
                      <div className="w-full h-full p-5 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Team Recommendations
                          </h3>
                          <button
                            onClick={() => setShowTeamDrawer(false)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {assignSuccess && (
                          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-green-300 text-sm">{assignSuccess}</p>
                          </div>
                        )}

                        {teamRecLoading && (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                          </div>
                        )}

                        {teamRecError && !teamRecLoading && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-red-300 text-sm">{teamRecError}</p>
                          </div>
                        )}

                        {!teamRecLoading && teamRecs.length > 0 && (
                          <div className="space-y-3">
                            {teamRecs.map((team, i) => (
                              <motion.div
                                key={team.group_id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-500 text-black' :
                                        i === 1 ? 'bg-slate-400 text-black' :
                                          i === 2 ? 'bg-amber-700 text-white' :
                                            'bg-slate-700 text-white'
                                      }`}>
                                      {i + 1}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-white text-sm">{team.group_name}</p>
                                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${getTeamStatusBadge(team.status)}`}>
                                        {team.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400" />
                                    <span className="text-yellow-400 font-bold text-sm">{team.composite_score}%</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 my-2 text-xs">
                                  {[
                                    { label: 'Distance', value: `${team.distance_km} km` },
                                    { label: 'Resources', value: `${team.resource_match_score}%` },
                                    { label: 'Battery', value: team.battery_level != null ? `${team.battery_level}%` : 'N/A' },
                                  ].map(({ label, value }) => (
                                    <div key={label} className="text-center p-1.5 bg-slate-700/40 border border-slate-700/50 rounded-lg">
                                      <p className="text-slate-400 text-xs">{label}</p>
                                      <p className="font-bold text-white">{value}</p>
                                    </div>
                                  ))}
                                </div>

                                {team.matched_resources.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {team.matched_resources.map((r, ri) => (
                                      <span key={ri} className="text-xs bg-green-500/10 text-green-300 border border-green-500/20 px-1.5 py-0.5 rounded">
                                        <Package className="w-2.5 h-2.5 inline mr-1" />
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {team.already_assigned && (
                                  <p className="text-xs text-orange-400 mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Currently on another assignment
                                  </p>
                                )}

                                <button
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all"
                                  disabled={assigningTeam === team.group_id || assignSuccess !== null}
                                  onClick={() => handleAssignTeam(team)}
                                >
                                  {assigningTeam === team.group_id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  )}
                                  {assignSuccess && teamRecs.find(t => t.group_id === team.group_id)?.already_assigned
                                    ? 'Assigned'
                                    : 'Confirm Assignment'
                                  }
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default SOSReportsPage;
