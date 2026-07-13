import React, { useState, useEffect, useCallback } from 'react';
import { invoicesAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Invoices = () => {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await invoicesAPI.getAllInvoices(params);
      setInvoices(res.data.data || []);
    } catch { addToast('Failed to load invoices', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await invoicesAPI.updateInvoiceStatus(id, status);
      addToast('Status updated!', 'success');
      load();
    } catch { addToast('Update failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? Expenses will be unlinked.')) return;
    try { await invoicesAPI.deleteInvoice(id); addToast('Invoice deleted', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  const handleDownload = async (id, num) => {
    try {
      const res = await invoicesAPI.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${num}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { addToast('Download failed', 'error'); }
  };

  const total = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Invoices</h1>
          <p className="text-slate-400 text-sm mt-1">{invoices.length} invoices · ₹{total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'draft', 'sent', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${statusFilter === s ? 'bg-primary-600 border-primary-500 text-white' : 'border-surface-border text-slate-400 hover:border-slate-500'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner size="md" /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Invoice #</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase hidden sm:table-cell">Due Date</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase">Status</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">🧾</p>
                  <p>No invoices found</p>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="table-row">
                  <td className="px-4 py-3 text-sm font-mono text-white">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 hidden md:table-cell">
                    <div>
                      <p>{inv.clientId?.name}</p>
                      <p className="text-xs text-slate-500">{inv.clientId?.company}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-white">₹{inv.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select value={inv.status} onChange={e => handleStatusChange(inv._id, e.target.value)}
                      className="bg-surface border border-surface-border text-xs rounded-lg px-2 py-1 text-slate-300">
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => handleDownload(inv._id, inv.invoiceNumber)} className="text-xs text-primary-400 hover:text-primary-300 font-medium">⬇ PDF</button>
                      {inv.status === 'draft' && <button onClick={() => handleDelete(inv._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;
