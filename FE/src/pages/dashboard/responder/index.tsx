import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/lib/api';
import type { DashboardStats } from '@/lib/api';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  AlertTriangle,
  MapPin,
  Users,
  Package,
  CheckCircle,
  Newspaper,
  Loader2,
  Activity,
  ArrowRight,
} from 'lucide-react';

const ResponderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('ricos_token');
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const data = await dashboardAPI.getStats(token);
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getResponderTypeLabel = () => {
    if (user?.responderType === 'ngo') return 'NGO';
    if (user?.responderType === 'government') return 'Government Agency';
    if (user?.responderType === 'volunteer') return 'Volunteer Group';
    return 'Responder';
  };

  const getResponderBadgeColor = () => {
    if (user?.responderType === 'ngo') return 'bg-green-500/20 border-green-500/50 text-green-400';
    if (user?.responderType === 'government') return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
    if (user?.responderType === 'volunteer') return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
    return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active Incidents',
      value: stats?.activeIncidents ?? 0,
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      accent: 'from-red-500/20 to-transparent',
      border: 'border-red-500/20',
    },
    {
      label: 'People Affected',
      value: stats?.peopleHelped ?? 0,
      icon: Users,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      accent: 'from-blue-500/20 to-transparent',
      border: 'border-blue-500/20',
    },
    {
      label: 'Active Missions',
      value: stats?.activeMissions ?? 0,
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      accent: 'from-emerald-500/20 to-transparent',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Inventory Items',
      value: stats?.totalInventoryItems ?? 0,
      icon: Package,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      accent: 'from-purple-500/20 to-transparent',
      border: 'border-purple-500/20',
    },
  ];

  const quickActions = [
    {
      label: 'Disaster Map',
      description: 'View active zones',
      icon: MapPin,
      iconColor: 'text-blue-400',
      route: '/map',
    },
    {
      label: 'Updates & News',
      description: 'Latest information',
      icon: Newspaper,
      iconColor: 'text-emerald-400',
      route: '/news',
    },
    {
      label: 'Manage Resources',
      description: 'Track inventory',
      icon: Package,
      iconColor: 'text-purple-400',
      route: '/inventory',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={fadeInUp} className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-white">
            Welcome,{' '}
            <span className="gradient-text">
              {user?.organization || user?.name || 'Responder'}
            </span>
          </h1>
          <span className={`px-3 py-1 border rounded-full text-xs font-semibold tracking-wide ${getResponderBadgeColor()}`}>
            {getResponderTypeLabel()}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          {getResponderTypeLabel()} Dashboard — Manage operations and respond to emergencies
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
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
              {/* Gradient accent strip */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={card.iconColor} size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Active Missions Status */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Active Missions</h2>
          </div>
          {stats && stats.activeMissions > 0 ? (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm">
                You have{' '}
                <span className="text-blue-400 font-semibold">{stats.activeMissions}</span>{' '}
                active field group{stats.activeMissions !== 1 ? 's' : ''} currently working on ground.{' '}
                <button
                  onClick={() => navigate('/groups')}
                  className="text-blue-400 underline hover:text-blue-300 transition-colors"
                >
                  View Groups
                </button>
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm">
                No active missions at the moment. Ready to respond when needed!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className="group flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all duration-200 text-left"
                >
                  <div className="p-2.5 bg-slate-700/60 group-hover:bg-slate-700 rounded-lg transition-colors">
                    <Icon className={action.iconColor} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{action.label}</p>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </div>
                  <ArrowRight className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResponderDashboard;
