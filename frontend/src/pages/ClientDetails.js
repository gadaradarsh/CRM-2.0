import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, expensesAPI, invoicesAPI, activitiesAPI, usersAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientForm from '../components/ClientForm';
import ExpenseForm from '../components/ExpenseForm';

const tabs = ['Overview', 'Activities', 'Expenses', 'Invoices'];
const statusColors = { new:'badge-new', contacted:'badge-contacted', qualified:'badge-qualified', won:'badge-won', lost:'badge-lost' };

const ClientDetails = () => {
  const { id } = useParams();
  const { user } = useUser();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const [client, setClient] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadClient = useCallback(async () => {
    try {
      const res = await clientsAPI.getClient(id);
      setClient(res.data.client);
    } catch { addToast('Failed to load client', 'error'); navigate('/clients'); }
  }, [id, addToast, navigate]);

  const loadExpenses = useCallback(async () => {
    try { const r = await expensesAPI.getClientExpenses(id); setExpenses(r.data.expenses || []); } catch {}
  }, [id]);

  const loadInvoices = useCallback(async () => {
    try { const r = await invoicesAPI.getClientInvoices(id); setInvoices(r.data.data || []); } catch {}
  }, [id]);

  const loadActivities = useCallback(async () => {
    try { const r = await activitiesAPI.getClientActivities(id); setActivities(r.data.data || []); } catch {}
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadClient(), loadExpenses(), loadInvoices(), loadActivities()]);
      if (isManager) { try { const r = await usersAPI.getEmployees(); setEmployees(r.data.employees || []); } catch {} }
      setLoading(false);
    };
    init();
  }, [loadClient, loadExpenses, loadInvoices, loadActivities, isManager]);

  const handleUpdateClient = async (data) => {
    setFormLoading(true);
    try {
      await clientsAPI.updateClient(id, data);
      addToast('Client updated!', 'success');
      setShowEdit(false);
      loadClient();
    } catch (err) { addToast(err.response?.data?.message || 'Update failed', 'error'); }
    finally { setFormLoading(false); }
  };

  const handleStatusChange = async (status) => {
    try {
      await clientsAPI.updateStatus(id, status);
      addToast('Status updated', 'success');
      loadClient();
    } catch { addToast('Failed to update status', 'error'); }
  };

  const handleAssign = async (assignedTo) => {
    try {
      await clientsAPI.assignClient(id, assignedTo);
      addToast('Client assigned!', 'success');
      loadClient();
    } catch { addToast('Assignment failed', 'error'); }
  };

  const handleAddExpense = async (data) => {
    setFormLoading(true);
    try {
      if (editExpense) {
        await expensesAPI.updateExpense(editExpense._id, data);
        addToast('Expense updated!', 'success');
        setEditExpense(null);
      } else {
        await expensesAPI.addExpense(id, data);
        addToast('Expense logged!', 'success');
        setShowExpenseForm(false);
      }
      loadExpenses();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expensesAPI.deleteExpense(expId); addToast('Expense deleted', 'success'); loadExpenses(); }
    catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  const handleGenerateInvoice = async () => {
    const dueDate = window.prompt('Enter due date (YYYY-MM-DD):');
    if (!dueDate) return;
    try {
      await invoicesAPI.generateInvoice(id, { dueDate });
      addToast('Invoice generated!', 'success');
      loadInvoices();
      loadExpenses();
    } catch (err) { addToast(err.response?.data?.message || 'Invoice generation failed', 'error'); }
  };

  const handleDownloadInvoice = async (invId, invNum) => {
    try {
      const res = await invoicesAPI.downloadInvoice(invId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${invNum}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { addToast('Download failed', 'error'); }
  };

  const handleDeleteInvoice = async (invId) => {
    if (!window.confirm('Delete this invoice? Expenses will be un-invoiced.')) return;
    try { await invoicesAPI.deleteInvoice(invId); addToast('Invoice deleted', 'success'); loadInvoices(); loadExpenses(); }
    catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!client) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="text-slate-400 hover:text-white text-lg">←</button>
          <div>
            <h1 className="section-title text-2xl">{client.name}</h1>
            <p className="text-slate-400 text-sm">{client.company} · {client.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusColors[client.status]}`}>{client.status}</span>
          <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">Edit</button>
        </div>
      </div>

      {/* Status + Assign (manager) */}
      {isManager && (
        <div className="card flex flex-wrap gap-6">
          <div>
            <label className="label text-xs">Update Status</label>
            <div className="flex gap-2 flex-wrap">
              {['new','contacted','qualified','won','lost'].map(s => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                    ${client.status === s ? 'bg-primary-600 border-primary-500 text-white' : 'border-surface-border text-slate-400 hover:border-slate-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {employees.length > 0 && (
            <div>
              <label className="label text-xs">Reassign To</label>
              <select className="input text-sm py-1.5" value={client.assignedTo?._id || ''} onChange={e => handleAssign(e.target.value)}>
                <option value="">Select employee...</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-border flex gap-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t ? 'border-primary-500 text-primary-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h2 className="section-title text-base">Contact Information</h2>
            {[['Email', client.email], ['Phone', client.phone], ['Company', client.company], ['Estimated Value', client.estimatedValue ? `₹${client.estimatedValue.toLocaleString()}` : '—'], ['Assigned To', client.assignedTo?.name || '—'], ['Created', new Date(client.createdAt).toLocaleDateString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-surface-border pb-2 last:border-0">
                <span className="text-slate-400">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="section-title text-base mb-3">Notes</h2>
            <p className="text-slate-400 text-sm">{client.notes || 'No notes added.'}</p>
          </div>
        </div>
      )}

      {tab === 'Activities' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Activity Log</h2>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><p className="text-3xl mb-2">📋</p><p>No activities logged</p></div>
          ) : (
            <div className="space-y-3">
              {activities.map(a => (
                <div key={a._id} className="flex gap-3 py-3 border-b border-surface-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center text-sm flex-shrink-0">
                    {a.type === 'call' ? '📞' : a.type === 'email' ? '📧' : a.type === 'meeting' ? '🤝' : '📝'}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.type} · {new Date(a.date).toLocaleDateString()} · {a.userId?.name}</p>
                    {a.description && <p className="text-xs text-slate-400 mt-1">{a.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Expenses' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Expenses</h2>
            <div className="flex gap-2">
              <button onClick={handleGenerateInvoice} className="btn-secondary text-sm">🧾 Generate Invoice</button>
              <button onClick={() => setShowExpenseForm(true)} className="btn-primary text-sm">+ Add</button>
            </div>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><p className="text-3xl mb-2">💰</p><p>No expenses logged</p></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-surface-border">
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Description</th>
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Category</th>
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Amount</th>
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Date</th>
                <th className="text-left px-3 py-2 text-xs text-slate-400 font-semibold uppercase">Status</th>
                <th />
              </tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id} className="table-row">
                    <td className="px-3 py-2 text-sm text-white">{e.description}</td>
                    <td className="px-3 py-2 text-sm text-slate-400 capitalize">{e.category}</td>
                    <td className="px-3 py-2 text-sm text-white font-medium">₹{e.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2"><span className={`badge ${e.isInvoiced ? 'badge-paid' : 'badge-pending'}`}>{e.isInvoiced ? 'invoiced' : 'pending'}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {!e.isInvoiced && <button onClick={() => { setEditExpense(e); setShowExpenseForm(true); }} className="text-xs text-primary-400 hover:text-primary-300">Edit</button>}
                        {!e.isInvoiced && <button onClick={() => handleDeleteExpense(e._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Invoices' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Invoices</h2>
            <button onClick={handleGenerateInvoice} className="btn-primary text-sm">🧾 Generate Invoice</button>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><p className="text-3xl mb-2">🧾</p><p>No invoices yet</p></div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv._id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-surface-border hover:border-primary-700 transition-colors">
                  <div>
                    <p className="font-semibold text-white text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">Due: {new Date(inv.dueDate).toLocaleDateString()} · ₹{inv.totalAmount?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                    <button onClick={() => handleDownloadInvoice(inv._id, inv.invoiceNumber)} className="text-xs text-primary-400 hover:text-primary-300">⬇ PDF</button>
                    {inv.status === 'draft' && <button onClick={() => handleDeleteInvoice(inv._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <ClientForm initial={client} onSubmit={handleUpdateClient} onClose={() => setShowEdit(false)} loading={formLoading} />
          </div>
        </div>
      )}
      {showExpenseForm && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setShowExpenseForm(false); setEditExpense(null); } }}>
          <div className="modal">
            <ExpenseForm initial={editExpense || {}} onSubmit={handleAddExpense} onClose={() => { setShowExpenseForm(false); setEditExpense(null); }} loading={formLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;
