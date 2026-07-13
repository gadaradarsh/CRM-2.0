import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Bill = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesAPI.getInvoice(id)
      .then(r => setInvoice(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    try {
      const res = await invoicesAPI.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${invoice.invoiceNumber}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <div className="min-h-screen bg-surface flex items-center justify-center text-slate-400">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-surface p-4">
      {/* Actions */}
      <div className="max-w-3xl mx-auto mb-4 flex gap-3 print:hidden">
        <button onClick={handleDownload} className="btn-primary text-sm">⬇ Download PDF</button>
        <button onClick={handlePrint} className="btn-secondary text-sm">🖨 Print</button>
      </div>

      {/* Bill */}
      <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-indigo-700 text-white px-8 py-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-indigo-200 mt-1">CRM Manager System</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
            <p className="text-indigo-200">Issue: {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p className="text-indigo-200">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Bill To</p>
            <p className="text-lg font-bold text-gray-900">{invoice.clientId?.name}</p>
            {invoice.clientId?.company && <p className="text-gray-600">{invoice.clientId.company}</p>}
            {invoice.clientId?.email && <p className="text-gray-500 text-sm">{invoice.clientId.email}</p>}
            {invoice.clientId?.phone && <p className="text-gray-500 text-sm">{invoice.clientId.phone}</p>}
          </div>

          {/* Status badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {invoice.status}
            </span>
          </div>

          {/* Line items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.expenses || []).map((e, i) => (
                <tr key={e._id || i}>
                  <td className="py-3 text-sm text-gray-800">{e.description}</td>
                  <td className="py-3 text-sm text-gray-500 capitalize">{e.category}</td>
                  <td className="py-3 text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">₹{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-indigo-700 text-white px-6 py-3 rounded-xl">
              <span className="text-sm font-medium mr-4">Total Amount</span>
              <span className="text-2xl font-bold">₹{invoice.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">Thank you for your business!</p>
            <p className="text-xs text-gray-300 mt-1">Generated by CRM Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bill;
