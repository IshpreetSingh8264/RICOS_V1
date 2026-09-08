import React from 'react';
import { Edit2, Trash2, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ResourceAllocation {
  inventory_item_id: string;
  allocated_quantity: number;
}

export interface Group {
  id: string;
  group_name: string;
  username: string;
  email?: string;
  password: string;
  ttl_type: '5_days' | '20_days' | '30_days' | 'no_expiry';
  expires_at: string | null;
  is_active: boolean;
  resource_allocations: ResourceAllocation[];
  createdAt: string;
}

interface GroupsTableProps {
  groups: Group[];
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
  inventoryItems: Array<{ id: string; item: string }>;
}

const GroupsTable: React.FC<GroupsTableProps> = ({
  groups,
  onEdit,
  onDelete,
  inventoryItems,
}) => {
  const getItemName = (itemId: string) => {
    return inventoryItems.find(i => i.id === itemId)?.item || 'Unknown';
  };

  const getTTLLabel = (ttl_type: string) => {
    const labels = {
      '5_days': '5 Days',
      '20_days': '20 Days',
      '30_days': '30 Days',
      'no_expiry': 'No Expiry',
    };
    return labels[ttl_type as keyof typeof labels] || ttl_type;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusColor = (group: Group) => {
    if (!group.is_active) return 'bg-slate-700 text-slate-300';
    if (isExpired(group.expires_at)) return 'bg-red-500/20 text-red-400 border border-red-500/50';
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  };

  const getStatusText = (group: Group) => {
    if (!group.is_active) return 'Inactive';
    if (isExpired(group.expires_at)) return 'Expired';
    return 'Active';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Email / Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                TTL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Resources
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-slate-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {group.group_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Created {formatDate(group.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-300">
                    {group.email ? (
                      <>
                        <div className="font-medium">{group.email}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {group.username}
                        </div>
                      </>
                    ) : (
                      <div className="font-mono">{group.username}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      group
                    )}`}
                  >
                    {group.is_active && !isExpired(group.expires_at) ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {getStatusText(group)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500 mr-1" />
                    {getTTLLabel(group.ttl_type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">
                    {formatDate(group.expires_at)}
                  </div>
                  {group.expires_at && !isExpired(group.expires_at) && (
                    <div className="text-xs text-slate-500">
                      {Math.ceil(
                        (new Date(group.expires_at).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days left
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {group.resource_allocations.length > 0 ? (
                    <div className="text-sm">
                      <div className="font-medium text-white">
                        {group.resource_allocations.length} item(s)
                      </div>
                      <div className="text-xs text-slate-500 space-y-1 mt-1">
                        {group.resource_allocations.slice(0, 2).map((allocation) => (
                          <div key={allocation.inventory_item_id}>
                            {getItemName(allocation.inventory_item_id)}: {allocation.allocated_quantity}
                          </div>
                        ))}
                        {group.resource_allocations.length > 2 && (
                          <div className="text-blue-400">
                            +{group.resource_allocations.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">No resources</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(group)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${group.group_name}"?`
                          )
                        ) {
                          onDelete(group.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <Users className="w-5 h-5 text-slate-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">
                    {group.group_name}
                  </h3>
                </div>
                {group.email ? (
                  <>
                    <p className="text-xs text-slate-300 mb-0.5">{group.email}</p>
                    <p className="text-xs text-slate-500 font-mono">{group.username}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 font-mono">{group.username}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  group
                )}`}
              >
                {getStatusText(group)}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 text-slate-500 mr-2" />
                <span className="text-slate-400">TTL:</span>
                <span className="ml-2 text-slate-300">{getTTLLabel(group.ttl_type)}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Expires:</span>
                <span className="ml-2 text-slate-300">{formatDate(group.expires_at)}</span>
                {group.expires_at && !isExpired(group.expires_at) && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({Math.ceil(
                      (new Date(group.expires_at).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days left)
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Created:</span>
                <span className="ml-2 text-slate-300">{formatDate(group.createdAt)}</span>
              </div>
            </div>

            {/* Resources */}
            {group.resource_allocations.length > 0 && (
              <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm font-medium text-white mb-2">
                  Allocated Resources ({group.resource_allocations.length})
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  {group.resource_allocations.map((allocation) => (
                    <div key={allocation.inventory_item_id} className="flex justify-between">
                      <span>{getItemName(allocation.inventory_item_id)}</span>
                      <span className="font-medium text-slate-300">{allocation.allocated_quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-700">
              <button
                onClick={() => onEdit(group)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete "${group.group_name}"?`
                    )
                  ) {
                    onDelete(group.id);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No groups found</p>
          <p className="text-slate-500 text-sm mt-2">
            Create your first group to manage field teams
          </p>
        </div>
      )}
    </>
  );
};

export default GroupsTable;
