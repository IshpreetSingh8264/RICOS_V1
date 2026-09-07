import { Edit2, Trash2, Package } from 'lucide-react';
import type { InventoryItem } from './InventoryFormModal';
import { motion } from 'framer-motion';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const InventoryTable = ({ items, onEdit, onDelete }: InventoryTableProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUtilizationPercentage = (remaining: number, total: number) => {
    if (total === 0) return 0;
    return Math.round(((total - remaining) / total) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <Package className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Inventory Items</h3>
        <p className="text-slate-500 text-center max-w-md">
          Start by adding your first inventory item using the "Add Item" button above.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Item Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Total Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Allocated</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Remaining</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Utilization</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Last Updated</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const utilizationPercent = getUtilizationPercentage(item.remaining_quantity, item.total_quantity);
              const allocated = item.total_quantity - item.remaining_quantity;
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="text-white font-medium">{item.item}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300">{item.total_quantity}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-blue-400 font-medium">{allocated}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300">{item.remaining_quantity}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            utilizationPercent >= 80 ? 'bg-red-500' :
                            utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${utilizationPercent}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getUtilizationColor(utilizationPercent)}`}>
                        {utilizationPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-400 text-sm">{formatDate(item.updatedAt)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {items.map((item, index) => {
          const utilizationPercent = getUtilizationPercentage(item.remaining_quantity, item.total_quantity);
          const allocated = item.total_quantity - item.remaining_quantity;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{item.item}</h3>
                  <p className="text-slate-400 text-xs mt-1">{formatDate(item.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-white font-semibold">{item.total_quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Allocated</p>
                  <p className="text-blue-400 font-semibold">{allocated}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Remaining</p>
                  <p className="text-white font-semibold">{item.remaining_quantity}</p>
                </div>
              </div>

              {/* Utilization Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Utilization</p>
                  <span className={`text-sm font-medium ${getUtilizationColor(utilizationPercent)}`}>
                    {utilizationPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      utilizationPercent >= 80 ? 'bg-red-500' :
                      utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryTable;
