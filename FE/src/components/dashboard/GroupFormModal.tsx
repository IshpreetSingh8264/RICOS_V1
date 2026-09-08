import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ResourceAllocation {
  inventory_item_id: string;
  allocated_quantity: number;
}

export interface GroupFormData {
  id?: string;
  group_name: string;
  password: string;
  ttl_type: '5_days' | '20_days' | '30_days' | 'no_expiry';
  is_active: boolean;
  resource_allocations: ResourceAllocation[];
}

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => void;
  editData?: GroupFormData | null;
  inventoryItems: Array<{ id: string; item: string; remaining_quantity: number }>;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  inventoryItems,
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    group_name: '',
    password: '',
    ttl_type: '20_days',
    is_active: true,
    resource_allocations: [],
  });

  const [selectedItem, setSelectedItem] = useState<string>('');
  const [allocatedQuantity, setAllocatedQuantity] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        group_name: '',
        password: '',
        ttl_type: '20_days',
        is_active: true,
        resource_allocations: [],
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.group_name.trim()) {
      alert('Please enter group name');
      return;
    }
    
    if (!editData && !formData.password.trim()) {
      alert('Please enter password');
      return;
    }

    if (!editData && formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const handleAddResource = () => {
    if (!selectedItem) {
      alert('Please select an inventory item');
      return;
    }

    if (allocatedQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const item = inventoryItems.find(i => i.id === selectedItem);
    if (!item) {
      alert('Selected inventory item not found');
      return;
    }

    // Calculate currently allocated to this group (if editing)
    const currentlyAllocatedToThisGroup = formData.resource_allocations.find(
      r => r.inventory_item_id === selectedItem
    )?.allocated_quantity || 0;

    // Available = item.remaining_quantity + what this group currently has allocated
    const availableForThisGroup = item.remaining_quantity + currentlyAllocatedToThisGroup;

    if (allocatedQuantity > availableForThisGroup) {
      alert(
        `Insufficient quantity. Available: ${availableForThisGroup}\n` +
        `(Remaining: ${item.remaining_quantity}` +
        (currentlyAllocatedToThisGroup > 0 
          ? ` + Currently allocated to this group: ${currentlyAllocatedToThisGroup})`
          : ')')
      );
      return;
    }

    // Check if item already allocated
    const existingIndex = formData.resource_allocations.findIndex(
      r => r.inventory_item_id === selectedItem
    );

    if (existingIndex >= 0) {
      // Update existing allocation
      const newAllocations = [...formData.resource_allocations];
      newAllocations[existingIndex].allocated_quantity = allocatedQuantity;
      setFormData({ ...formData, resource_allocations: newAllocations });
    } else {
      // Add new allocation
      setFormData({
        ...formData,
        resource_allocations: [
          ...formData.resource_allocations,
          { inventory_item_id: selectedItem, allocated_quantity: allocatedQuantity },
        ],
      });
    }

    setSelectedItem('');
    setAllocatedQuantity(0);
  };

  const handleRemoveResource = (itemId: string) => {
    setFormData({
      ...formData,
      resource_allocations: formData.resource_allocations.filter(
        r => r.inventory_item_id !== itemId
      ),
    });
  };

  const getItemName = (itemId: string) => {
    return inventoryItems.find(i => i.id === itemId)?.item || 'Unknown Item';
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {editData ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emergency Response Unit 1"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password * {editData && <span className="text-slate-500 text-xs">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum 6 characters"
              minLength={6}
              required={!editData}
            />
          </div>

          {/* TTL Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Expiry Period *
            </label>
            <select
              value={formData.ttl_type}
              onChange={(e) => setFormData({ ...formData, ttl_type: e.target.value as any })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="5_days">5 Days</option>
              <option value="20_days">20 Days</option>
              <option value="30_days">30 Days</option>
              <option value="no_expiry">No Expiry</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-300">
              Active
            </label>
          </div>

          {/* Resource Allocations */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resource Allocations</h3>
            
            {/* Add Resource Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Inventory Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select item...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item} (Available: {item.remaining_quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={allocatedQuantity || ''}
                  onChange={(e) => setAllocatedQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Resource
                </button>
              </div>
            </div>

            {/* Allocated Resources List */}
            {formData.resource_allocations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Allocated Resources:</p>
                {formData.resource_allocations.map((allocation) => (
                  <div
                    key={allocation.inventory_item_id}
                    className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {getItemName(allocation.inventory_item_id)}
                      </p>
                      <p className="text-sm text-slate-400">
                        Quantity: {allocation.allocated_quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(allocation.inventory_item_id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-700 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editData ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GroupFormModal;
