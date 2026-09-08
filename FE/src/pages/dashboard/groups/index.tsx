import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Users, Clock, CheckCircle, XCircle,
  MapPin, Wifi, WifiOff, Navigation, AlertTriangle, RefreshCw,
  Radio, Edit2, Trash2, Battery, Package, Copy, Check
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import GroupFormModal from '@/components/dashboard/GroupFormModal';
import type { GroupFormData } from '@/components/dashboard/GroupFormModal';
import type { Group } from '@/components/dashboard/GroupsTable';
import { useAuth } from '@/contexts/AuthContext';
import {
  groupsAPI,
  inventoryAPI,
  formatErrorMessage,
  canManageGroups,
} from '@/lib/api';
import type { GroupLocation, GroupAssignment } from '@/lib/api';

interface InventoryItem {
  id: string;
  item: string;
  total_quantity: number;
  remaining_quantity: number;
}

// Deployment status config
const DEPLOYMENT_STATUS: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  available: {
    label: 'Available',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    dot: 'bg-emerald-400',
  },
  deployed: {
    label: 'Deployed',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/40',
    dot: 'bg-blue-400',
  },
  rescuing: {
    label: 'Rescuing',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/40',
    dot: 'bg-orange-400 animate-pulse',
  },
  offline: {
    label: 'Offline',
    color: 'text-slate-400',
    bg: 'bg-slate-700/50 border-slate-600',
    dot: 'bg-slate-500',
  },
};

const GroupsPage: React.FC = () => {
  const { token, user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [groupLocations, setGroupLocations] = useState<GroupLocation[]>([]);
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [completingAssignment, setCompletingAssignment] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !user) return;
    if (!canManageGroups(user.userType)) return;

    try {
      const [fetchedGroups, fetchedInventory, fetchedLocations, fetchedAssignments] =
        await Promise.all([
          groupsAPI.getAll(token),
          inventoryAPI.getAll(token),
          groupsAPI.getAllLocations(token).catch(() => []),
          groupsAPI.getAssignments(token).catch(() => ({ success: false, assignments: [] })),
        ]);

      const mappedGroups: Group[] = fetchedGroups.map((g) => ({
        id: g.id,
        group_name: g.group_name,
        username: g.username,
        email: g.email,
        password: '',
        ttl_type: g.ttl_type,
        expires_at: g.expires_at,
        is_active: g.is_active,
        resource_allocations: (g.resourceAllocations || []).map((r) => ({
          inventory_item_id: r.inventory_item_id || r.inventoryItem?.id || '',
          allocated_quantity: r.allocated_quantity,
        })),
        createdAt: g.createdAt,
      }));

      setGroups(mappedGroups);
      setInventoryItems(
        fetchedInventory.map((i) => ({
          id: i.id,
          item: i.item,
          total_quantity: i.total_quantity,
          remaining_quantity: i.remaining_quantity,
        })),
      );
      setGroupLocations(Array.isArray(fetchedLocations) ? fetchedLocations : []);
      setAssignments(
        Array.isArray(fetchedAssignments?.assignments)
          ? fetchedAssignments.assignments
          : [],
      );
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load groups data:', err);
    }
  }, [token, user]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30s to keep location/status fresh
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ---- helpers ----
  const getLocationForGroup = (groupId: string): GroupLocation | undefined =>
    groupLocations.find((l) => l.group_id === groupId);

  const getActiveAssignment = (groupId: string): GroupAssignment | undefined =>
    assignments.find((a) => a.group_id === groupId && a.status === 'active');

  const getItemName = (itemId: string) =>
    inventoryItems.find((i) => i.id === itemId)?.item || 'Unknown';

  const getTTLLabel = (ttl: string) =>
    ({ '5_days': '5 Days', '20_days': '20 Days', '30_days': '30 Days', no_expiry: 'No Expiry' }[
      ttl
    ] ?? ttl);

  const isExpired = (expiresAt: string | null) =>
    !!expiresAt && new Date(expiresAt) < new Date();

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Never';

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ---- mutations ----
  const handleFormSubmit = async (data: GroupFormData) => {
    if (!token || !user) return alert('You must be logged in');
    if (!canManageGroups(user.userType)) return alert('Insufficient permissions');

    try {
      if (editingGroup) {
        const payload: any = {
          group_name: data.group_name,
          ttl_type: data.ttl_type,
          is_active: data.is_active,
          resource_allocations: data.resource_allocations,
        };
        if (data.password) payload.password = data.password;
        await groupsAPI.update(editingGroup.id, payload, token);
        await loadData();
        alert('Group updated successfully');
      } else {
        const created = await groupsAPI.create(
          {
            group_name: data.group_name,
            password: data.password,
            ttl_type: data.ttl_type,
            resource_allocations: data.resource_allocations,
          },
          token,
        );
        await loadData();
        alert(
          `Group created!\n\nLogin Credentials:\nEmail/Username: ${created.email || created.username}\nPassword: ${data.password}\n\nSave these credentials.`,
        );
      }
    } catch (err) {
      alert('Failed to save group: ' + formatErrorMessage(err));
    } finally {
      setEditingGroup(null);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !user) return;
    if (!canManageGroups(user.userType)) return alert('Insufficient permissions');
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await groupsAPI.delete(id, token);
      await loadData();
    } catch (err) {
      alert('Failed to delete group: ' + formatErrorMessage(err));
    }
  };

  const handleMarkComplete = async (assignmentId: string) => {
    if (!token) return;
    setCompletingAssignment(assignmentId);
    try {
      await groupsAPI.updateAssignmentStatus(assignmentId, { status: 'completed' }, token);
      await loadData();
    } catch (err) {
      alert('Failed to complete assignment: ' + formatErrorMessage(err));
    } finally {
      setCompletingAssignment(null);
    }
  };

  const handleCopyEmail = (groupId: string, email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedGroupId(groupId);
      setTimeout(() => setCopiedGroupId(null), 2000);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  // ---- stats ----
  const stats = {
    total: groups.length,
    active: groups.filter(
      (g) => g.is_active && (!g.expires_at || new Date(g.expires_at) > new Date()),
    ).length,
    deployed: groupLocations.filter((l) =>
      ['deployed', 'rescuing'].includes(l.status),
    ).length,
    available: groupLocations.filter((l) => l.status === 'available').length,
    withLocation: groupLocations.length,
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Field <span className="gradient-text">Teams</span>
            </h1>
            <p className="text-slate-400 mt-1">
              Manage field groups, live location &amp; mission deployment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">
                Updated {formatTimeAgo(lastRefresh.toISOString())}
              </span>
            </button>
            <button
              onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          {[
            { label: 'Total Teams', value: stats.total, icon: Users, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500 to-transparent', border: 'border-blue-500/20' },
            { label: 'Active', value: stats.active, icon: CheckCircle, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', accent: 'from-emerald-500 to-transparent', border: 'border-emerald-500/20' },
            { label: 'Deployed', value: stats.deployed, icon: Navigation, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10', accent: 'from-orange-500 to-transparent', border: 'border-orange-500/20' },
            { label: 'Available', value: stats.available, icon: Radio, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10', accent: 'from-cyan-500 to-transparent', border: 'border-cyan-500/20' },
            { label: 'GPS Active', value: stats.withLocation, icon: MapPin, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10', accent: 'from-purple-500 to-transparent', border: 'border-purple-500/20' },
          ].map(({ label, value, icon: Icon, iconColor, iconBg, accent, border }) => (
            <motion.div
              key={label}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-xl border ${border} bg-slate-900/60 backdrop-blur-sm p-5`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`} />
              <div className="flex items-center gap-4">
                <div className={`p-3 ${iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={iconColor} size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teams by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/50 focus:border-blue-500/50 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-colors"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
        >
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-700">
                  {['Team', 'Status / Location', 'Deployment', 'Current Mission', 'Resources', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <AnimatePresence>
                  {filteredGroups.map((group) => {
                    const loc = getLocationForGroup(group.id);
                    const assignment = getActiveAssignment(group.id);
                    const depStatus = loc?.status ?? 'offline';
                    const dep = DEPLOYMENT_STATUS[depStatus] ?? DEPLOYMENT_STATUS.offline;
                    const expired = isExpired(group.expires_at);

                    return (
                      <motion.tr
                        key={group.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Team */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                                <Users className="w-4 h-4 text-slate-400" />
                              </div>
                              {/* Live location dot */}
                              {loc && (
                                <span
                                  className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${dep.dot}`}
                                />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {group.group_name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {group.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status / Location */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                group.is_active && !expired
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : expired
                                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                  : 'bg-slate-700 border-slate-600 text-slate-400'
                              }`}
                            >
                              {group.is_active && !expired ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {group.is_active && !expired
                                ? 'Active'
                                : expired
                                ? 'Expired'
                                : 'Inactive'}
                            </span>
                            {loc ? (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Wifi className="w-3 h-3 text-emerald-400" />
                                <span>{formatTimeAgo(loc.last_updated)}</span>
                                {loc.battery_level != null && (
                                  <>
                                    <Battery className="w-3 h-3 ml-1" />
                                    <span>{loc.battery_level}%</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <WifiOff className="w-3 h-3" />
                                No GPS signal
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Deployment status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${dep.bg} ${dep.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dep.dot}`} />
                            {dep.label}
                          </span>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTTLLabel(group.ttl_type)}
                          </div>
                        </td>

                        {/* Current Mission */}
                        <td className="px-5 py-4 max-w-[200px]">
                          {assignment ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                Active Mission
                              </div>
                              <div className="text-xs text-slate-300 truncate">
                                {assignment.group_location?.status
                                  ? `Status: ${assignment.group_location.status}`
                                  : `Assigned ${formatTimeAgo(assignment.assigned_at)}`}
                              </div>
                              <button
                                onClick={() => handleMarkComplete(assignment.assignment_id)}
                                disabled={completingAssignment === assignment.assignment_id}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              >
                                {completingAssignment === assignment.assignment_id
                                  ? 'Completing...'
                                  : 'Mark Complete'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No active mission</span>
                          )}
                        </td>

                        {/* Resources */}
                        <td className="px-5 py-4">
                          {group.resource_allocations.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-slate-300">
                                <Package className="w-3 h-3 text-slate-500" />
                                <span className="font-medium">
                                  {group.resource_allocations.length} item
                                  {group.resource_allocations.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5">
                                {group.resource_allocations.slice(0, 2).map((r) => (
                                  <div key={r.inventory_item_id}>
                                    {getItemName(r.inventory_item_id)}: {r.allocated_quantity}
                                  </div>
                                ))}
                                {group.resource_allocations.length > 2 && (
                                  <div className="text-primary text-xs">
                                    +{group.resource_allocations.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">None</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyEmail(group.id, group.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Copy email"
                            >
                              {copiedGroupId === group.id
                                ? <Check className="w-4 h-4 text-emerald-400" />
                                : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingGroup(group);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredGroups.map((group) => {
              const loc = getLocationForGroup(group.id);
              const assignment = getActiveAssignment(group.id);
              const depStatus = loc?.status ?? 'offline';
              const dep = DEPLOYMENT_STATUS[depStatus] ?? DEPLOYMENT_STATUS.offline;
              const expired = isExpired(group.expires_at);

              return (
                <div
                  key={group.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  {/* Row 1: Name + badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        {loc && (
                          <span
                            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${dep.dot}`}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{group.group_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{group.username}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${dep.bg} ${dep.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dep.dot}`} />
                      {dep.label}
                    </span>
                  </div>

                  {/* Row 2: Location + TTL */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {loc ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Wifi className="w-3 h-3" />
                        GPS {formatTimeAgo(loc.last_updated)}
                        {loc.battery_level != null && ` · ${loc.battery_level}%`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <WifiOff className="w-3 h-3" />
                        No GPS signal
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {getTTLLabel(group.ttl_type)}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        group.is_active && !expired ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {group.is_active && !expired ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {group.is_active && !expired ? 'Active' : expired ? 'Expired' : 'Inactive'}
                    </span>
                  </div>

                  {/* Row 3: Active Mission */}
                  {assignment && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Active Mission · Assigned {formatTimeAgo(assignment.assigned_at)}
                        </div>
                        <button
                          onClick={() => handleMarkComplete(assignment.assignment_id)}
                          disabled={completingAssignment === assignment.assignment_id}
                          className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {completingAssignment === assignment.assignment_id
                            ? '...'
                            : 'Complete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Row 4: Actions */}
                  <div className="flex gap-2 pt-1 border-t border-slate-700">
                    <button
                      onClick={() => handleCopyEmail(group.id, group.email)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors text-sm"
                    >
                      {copiedGroupId === group.id
                        ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy Email</>}
                    </button>
                    <button
                      onClick={() => {
                        setEditingGroup(group);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">No teams found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Create your first field team to get started'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Modal */}
        <GroupFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGroup(null);
          }}
          onSubmit={handleFormSubmit}
          editData={
            editingGroup
              ? {
                  id: editingGroup.id,
                  group_name: editingGroup.group_name,
                  password: '',
                  ttl_type: editingGroup.ttl_type,
                  is_active: editingGroup.is_active,
                  resource_allocations: editingGroup.resource_allocations,
                }
              : null
          }
          inventoryItems={inventoryItems}
        />
      </div>
    </DashboardLayout>
  );
};

export default GroupsPage;
