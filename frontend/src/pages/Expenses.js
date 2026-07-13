import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ExpenseForm from '../components/ExpenseForm';
import LoadingSpinner from '../components/LoadingSpinner';

const categories = ['travel','meals','software','hardware','consulting','marketing','office','other'];

const Expenses = () => {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editExpense, setEditExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [invoicedFilter, setInvoicedFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (invoicedFilter !== '') params.isInvoiced = invoicedFilter;
      const [eRes, sRes] = await Promise.all([expensesAPI.getAllExpenses(params), expensesAPI.getExpenseStats()]);
      setExpenses(eRes.data.expenses || []);
      setStats(sRes.data);
    } catch { addToast('Failed to load expenses', 'error'); }
    finally { setLoading(false); }
  }, [categoryFilter, invoicedFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      await expensesAPI.updateExpense(editExpense._id, data);
      addToast('Expense updated!', 'success');
      setEditExpense(null);
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Update failed', 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expensesAPI.deleteExpense(id); addToast('Expense deleted', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">{expenses.length} records</p>
        </div>
      </div>

      {/* Stats */}
      {stats?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: `₹${(stats.stats.totalAmount || 0).toLocaleString()}`, icon: '💰' },
            { label: 'Invoiced', value: `₹${(stats.stats.invoicedAmount || 0).toLocaleString()}`, icon: '🧾' },
            { label: 'Pending', value: `₹${(stats.stats.pendingAmount || 0).toLocaleString()}`, icon: '⏳' },
            { label: 'Records', value: stats.stats.count || 0, icon: '📋' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm">{s.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-48" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className="input w-48" value={invoicedFilter} onChange={e => setInvoicedFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="false">Pending (Not Invoiced)</option>
          <option value="true">Invoiced</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner size="md" /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Description</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Status</th>
              <th />
            </tr></thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">💰</p>
                  <p>No expenses found</p>
                </td></tr>
              ) : expenses.map(e => (
                <tr key={e._id} className="table-row">
                  <td className="px-4 py-3 text-sm text-white">{e.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{e.clientId?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 capitalize">{e.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">₹{e.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className={`badge ${e.isInvoiced ? 'badge-paid' : 'badge-pending'}`}>{e.isInvoiced ? 'invoiced' : 'pending'}</span></td>
                  <td className="px-4 py-3">
                    {!e.isInvoiced && (
                      <div className="flex gap-2">
                        <button onClick={() => setEditExpense(e)} className="text-xs text-primary-400 hover:text-primary-300">Edit</button>
                        <button onClick={() => handleDelete(e._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editExpense && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEditExpense(null)}>
          <div className="modal">
            <ExpenseForm initial={editExpense} onSubmit={handleUpdate} onClose={() => setEditExpense(null)} loading={formLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
