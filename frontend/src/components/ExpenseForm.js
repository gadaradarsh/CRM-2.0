import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const categories = ['travel', 'meals', 'software', 'hardware', 'consulting', 'marketing', 'office', 'other'];

const ExpenseForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    description: initial.description || '',
    amount: initial.amount || '',
    category: initial.category || 'other',
    date: initial.date ? new Date(initial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      addToast('Description and amount are required', 'error');
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      addToast('Amount must be greater than 0', 'error');
      return;
    }
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">{initial._id ? 'Edit Expense' : 'Log Expense'}</h2>

      <div>
        <label className="label">Description *</label>
        <input className="input" name="description" value={form.description} onChange={handleChange} placeholder="e.g. Flight to Mumbai" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Amount (₹) *</label>
          <input className="input" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="1500" min="0" step="0.01" required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" name="category" value={form.category} onChange={handleChange}>
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Date</label>
        <input className="input" name="date" type="date" value={form.date} onChange={handleChange} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : initial._id ? 'Update Expense' : 'Add Expense'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default ExpenseForm;
