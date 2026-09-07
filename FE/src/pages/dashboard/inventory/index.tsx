import { motion } from 'framer-motion';
import { Plus, Package, Search, BarChart3, CheckSquare, Archive } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import InventoryFormModal, { type InventoryItem, type InventoryFormData } from '@/components/dashboard/InventoryFormModal';
import InventoryTable from '@/components/dashboard/InventoryTable';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryAPI, formatErrorMessage, canManageInventory } from '@/lib/api';

const InventoryPage = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  useEffect(() => {
    if (user && !canManageInventory(user.userType)) {
      setError('You do not have permission to manage inventory. Only NGOs and Volunteers can access this feature.');
      setIsLoading(false);
    }
  }, [user]);

  // Load items from backend on mount
  useEffect(() => {
    const loadInventory = async () => {
      if (!token || !user) {
        setIsLoading(false);
        return;
      }

      if (!canManageInventory(user.userType)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const fetchedItems = await inventoryAPI.getAll(token);
        setItems(fetchedItems);
        setFilteredItems(fetchedItems);
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [token, user]);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const handleAddItem = async (formData: InventoryFormData) => {
    if (!token) {
      alert('You must be logged in to add inventory');
      return;
    }

    try {
      setIsLoading(true);
      const newItem = await inventoryAPI.create({
        item: formData.item,
        total_quantity: formData.total_quantity,
      }, token);

      setItems(prev => [newItem, ...prev]);
      setIsModalOpen(false);
      alert('Inventory item created successfully!');
    } catch (err) {
      console.error('Error creating inventory item:', err);
      alert('Failed to create inventory item: ' + formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (formData: InventoryFormData) => {
    if (!editingItem || !token) return;

    // Calculate how much is currently allocated
    const currentAllocated = editingItem.total_quantity - editingItem.remaining_quantity;
    
    // Validate that new total_quantity is at least the currently allocated amount
    if (formData.total_quantity < currentAllocated) {
      alert(`Cannot reduce total quantity below ${currentAllocated}. This amount is currently allocated to groups.`);
      return;
    }

    try {
      setIsLoading(true);
      const updatedItem = await inventoryAPI.update(editingItem.id, {
        item: formData.item,
        total_quantity: formData.total_quantity,
      }, token);

      setItems(prev =>
        prev.map(item =>
          item.id === editingItem.id ? updatedItem : item
        )
      );

      setEditingItem(null);
      setIsModalOpen(false);
      alert('Inventory item updated successfully!');
    } catch (err) {
      console.error('Error updating inventory item:', err);
      alert('Failed to update inventory item: ' + formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    // Check if item has any allocated quantity
    const item = items.find(i => i.id === id);
    if (item && item.total_quantity !== item.remaining_quantity) {
      alert('Cannot delete this inventory item as it is currently allocated to one or more groups. Please remove the allocations first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      setIsLoading(true);
      await inventoryAPI.delete(id, token);
      setItems(prev => prev.filter(item => item.id !== id));
      alert('Inventory item deleted successfully!');
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      alert('Failed to delete inventory item: ' + formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const getTotalStats = () => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.total_quantity, 0);
    const totalRemaining = items.reduce((sum, item) => sum + item.remaining_quantity, 0);
    const totalAllocated = totalQuantity - totalRemaining;

    return { totalItems, totalQuantity, totalRemaining, totalAllocated };
  };

  const stats = getTotalStats();

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
              Inventory <span className="gradient-text">Management</span>
            </h1>
            <p className="text-slate-400 mt-1">Manage your resources and supplies</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            disabled={isLoading || !!error}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-700 rounded-lg p-4"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-slate-400">Loading inventory...</p>
          </motion.div>
        )}

        {!isLoading && !error && (<>
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Items', value: stats.totalItems, icon: Package, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', accent: 'from-blue-500 to-transparent', border: 'border-blue-500/20' },
            { label: 'Total Quantity', value: stats.totalQuantity, icon: BarChart3, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10', accent: 'from-purple-500 to-transparent', border: 'border-purple-500/20' },
            { label: 'Remaining', value: stats.totalRemaining, icon: CheckSquare, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', accent: 'from-emerald-500 to-transparent', border: 'border-emerald-500/20' },
            { label: 'Allocated', value: stats.totalAllocated, icon: Archive, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10', accent: 'from-orange-500 to-transparent', border: 'border-orange-500/20' },
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

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/50 focus:border-blue-500/50 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-colors"
          />
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
        >
          <InventoryTable
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>
        </>)}
      </div>

      {/* Form Modal */}
      {!error && (
        <InventoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={editingItem ? handleUpdateItem : handleAddItem}
          editData={editingItem}
        />
      )}
    </DashboardLayout>
  );
};

export default InventoryPage;
