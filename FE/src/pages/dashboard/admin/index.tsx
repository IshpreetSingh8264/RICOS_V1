import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, fadeInUp } from '@/lib/motion-variants';
import {
  Users,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield,
  ArrowRight,
  BarChart2,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const statCards = [
    {
      label: 'Total Users',
      value: 0,
      icon: Users,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      accent: 'from-blue-500/20 to-transparent',
      border: 'border-blue-500/20',
    },
    {
      label: 'Active Responders',
      value: 0,
      icon: Shield,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      accent: 'from-emerald-500/20 to-transparent',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Active Incidents',
      value: 0,
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      accent: 'from-orange-500/20 to-transparent',
      border: 'border-orange-500/20',
    },
    {
      label: 'Inventory Items',
      value: 0,
      icon: Package,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      accent: 'from-purple-500/20 to-transparent',
      border: 'border-purple-500/20',
    },
  ];

  const quickActions = [
    { label: 'Manage Users', icon: Users, iconColor: 'text-blue-400', route: null },
    { label: 'Manage Responders', icon: Shield, iconColor: 'text-emerald-400', route: null },
    { label: 'Inventory', icon: Package, iconColor: 'text-purple-400', route: '/inventory' },
    { label: 'View Alerts', icon: AlertTriangle, iconColor: 'text-orange-400', route: '/sos-reports' },
  ];

  const systemStats = [
    { label: 'Response Rate', value: 'N/A' },
    { label: 'Average Response Time', value: 'N/A' },
    { label: 'Active Groups', value: '0' },
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
            Welcome, <span className="gradient-text">{user?.name || 'Admin'}</span>!
          </h1>
          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 text-xs font-semibold tracking-wide">
            Admin
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          System Overview — Manage users, responders, and resources
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

      {/* Activity + System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeInUp}>
          <div className="glass-card rounded-xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-blue-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <BarChart2 className="text-slate-600" size={40} />
              <p className="text-slate-500 text-sm">No recent activity</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="glass-card rounded-xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-emerald-400" size={20} />
              <h3 className="text-lg font-semibold text-white">System Stats</h3>
            </div>
            <div className="space-y-3">
              {systemStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg"
                >
                  <span className="text-sm text-slate-400">{stat.label}</span>
                  <span className="text-sm text-white font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => action.route && navigate(action.route)}
                  className="group flex flex-col items-center gap-3 p-5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all duration-200 text-center"
                >
                  <div className="p-3 bg-slate-700/60 group-hover:bg-slate-700 rounded-xl transition-colors">
                    <Icon className={action.iconColor} size={22} />
                  </div>
                  <p className="text-sm text-white font-medium leading-tight">{action.label}</p>
                  {action.route && (
                    <ArrowRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={14} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
