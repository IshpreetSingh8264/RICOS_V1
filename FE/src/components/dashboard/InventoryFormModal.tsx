import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => void;
  editData?: InventoryItem | null;
}

export interface InventoryFormData {
  item: string;
  total_quantity: number;
}

export interface InventoryItem {
  id: string;
  item: string;
  total_quantity: number;
  remaining_quantity: number;
  ngo_id: string | null;
  volunteer_id: string | null;
  createdAt: string;
  updatedAt: string;
}

const InventoryFormModal = ({ isOpen, onClose, onSubmit, editData }: InventoryFormModalProps) => {
  const [formData, setFormData] = useState<InventoryFormData>({
    item: '',
    total_quantity: 0,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        item: editData.item,
        total_quantity: editData.total_quantity,
      });
    } else {
      setFormData({
        item: '',
        total_quantity: 0,
      });
    }
    setErrors({});
  }, [editData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.item.trim()) {
      newErrors.item = 'Item name is required';
    }

    if (formData.total_quantity < 0) {
      newErrors.total_quantity = 'Total quantity must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof InventoryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 sm:p-6 md:p-8"
            style={{ zIndex: 99999 }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {editData ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <label htmlFor="item" className="block text-sm font-semibold text-white">
                    Item Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="item"
                    type="text"
                    placeholder="e.g., Medical Kit, Water Bottles"
                    value={formData.item}
                    onChange={(e) => handleChange('item', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-slate-800 border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.item ? 'border-red-500' : 'border-slate-700'}`}
                  />
                  {errors.item && (
                    <p className="text-sm text-red-400">{errors.item}</p>
                  )}
                </div>

                {/* Total Quantity */}
                <div className="space-y-2">
                  <label htmlFor="total_quantity" className="block text-sm font-semibold text-white">
                    Total Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="total_quantity"
                    type="number"
                    min="0"
                    placeholder="e.g., 100"
                    value={formData.total_quantity}
                    onChange={(e) => handleChange('total_quantity', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-2.5 bg-slate-800 border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.total_quantity ? 'border-red-500' : 'border-slate-700'}`}
                  />
                  {errors.total_quantity && (
                    <p className="text-sm text-red-400">{errors.total_quantity}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Remaining quantity will be calculated automatically based on allocations
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    {editData ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default InventoryFormModal;
