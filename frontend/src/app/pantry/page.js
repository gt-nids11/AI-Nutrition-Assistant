'use client';

import { useState, useEffect } from 'react';
import { pantryAPI } from '../../utils/api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Calendar, 
  AlertTriangle,
  Scale,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';

export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPantry();
  }, []);

  const loadPantry = async () => {
    try {
      setLoading(true);
      const res = await pantryAPI.getItems();
      if (res.success) {
        setItems(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setQuantity('');
    setUnit('pcs');
    setExpiryDate('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    // Format date to YYYY-MM-DD
    const dateObj = new Date(item.expiryDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    setExpiryDate(dateStr);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !quantity || !unit || !expiryDate) {
      return setFormError('All fields are required');
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return setFormError('Quantity must be a positive number');
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        // Edit item
        const res = await pantryAPI.editItem(editingItem._id, {
          name,
          quantity: Number(quantity),
          unit,
          expiryDate
        });
        if (res.success) {
          setItems(items.map(item => item._id === editingItem._id ? res.item : item));
          setShowModal(false);
        }
      } else {
        // Add new item
        const res = await pantryAPI.addItem({
          name,
          quantity: Number(quantity),
          unit,
          expiryDate
        });
        if (res.success) {
          setItems([...items, res.item]);
          setShowModal(false);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save pantry item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      const res = await pantryAPI.deleteItem(id);
      if (res.success) {
        setItems(items.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const getExpiryBadge = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { text: 'Expired', style: 'bg-red-100 text-red-700 border-red-200' };
    } else if (daysLeft <= 2) {
      return { text: daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft} days`, style: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else {
      return { text: `${daysLeft} days left`, style: 'bg-pink-100 text-pink-700 border-pink-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pantry & Fridge</h1>
          <p className="text-sm text-rose-700 font-semibold">Keep track of your ingredients to minimize waste and generate recipes.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-1.5 bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-sm px-4 py-3 rounded-xl shadow-lg shadow-pink-500/10 transition-all"
        >
          <Plus size={16} />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Control Actions */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-rose-450">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search ingredients in your pantry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-pink-200/50 rounded-xl py-3 pl-10 pr-3 text-sm text-rose-950 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all placeholder-rose-400 font-semibold"
          />
        </div>
      </div>

      {/* Main Inventory Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader className="animate-spin text-pink-500" size={32} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-pink-50/30 border border-pink-100 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <AlertTriangle size={36} className="text-pink-300 mb-3" />
          <h3 className="text-lg font-extrabold text-rose-800">No items found</h3>
          <p className="text-sm text-rose-600 mt-1 font-semibold">
            {search ? 'No ingredients match your query.' : 'Your pantry is currently empty. Click "Add Ingredient" to start logging!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const badge = getExpiryBadge(item.expiryDate);
            return (
              <div 
                key={item._id}
                className="bg-white border border-pink-100 hover:border-pink-200 hover:bg-pink-50/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all relative overflow-hidden group shadow-sm shadow-pink-100/10"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-extrabold text-lg truncate text-rose-950 capitalize">{item.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.style}`}>
                      {badge.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-rose-700 font-semibold">
                    <div className="flex items-center space-x-1">
                      <Scale size={14} className="text-pink-400" />
                      <span>{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} className="text-pink-400" />
                      <span>Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 border-t border-pink-50 pt-3">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="flex-1 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl border border-pink-200/50 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-650 hover:text-red-700 text-xs font-bold rounded-xl flex items-center justify-center transition-all"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/10 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white border border-pink-150 p-6 rounded-3xl relative animate-fade-in shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-pink-400 hover:bg-pink-50 hover:text-pink-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-extrabold text-rose-955 mb-4">
              {editingItem ? 'Edit Ingredient' : 'Add Ingredient'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-xs text-rose-700">
              {formError && (
                <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Ingredient Name */}
              <div>
                <label className="block uppercase tracking-wider mb-1.5 font-bold">Ingredient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer, Eggs, Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 px-3.5 text-sm text-rose-950 placeholder-rose-300 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                  required
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 font-bold">Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 px-3.5 text-sm text-rose-950 placeholder-rose-300 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 font-bold">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 px-3 text-sm text-rose-950 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-semibold"
                  >
                    <option value="pcs">pcs (pieces)</option>
                    <option value="grams">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="liters">liters (L)</option>
                    <option value="cups">cups</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block uppercase tracking-wider mb-1.5 font-bold">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 px-3.5 text-sm text-rose-950 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-semibold"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-bold rounded-xl border border-pink-150 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-pink-500 hover:bg-pink-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {submitting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <span>Save Item</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
