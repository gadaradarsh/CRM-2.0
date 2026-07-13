import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { usersAPI } from '../utils/api';

const statusOptions = ['new', 'contacted', 'qualified', 'won', 'lost'];

const ClientForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const { user } = useUser();
  const { addToast } = useToast();
  const isManager = user?.role === 'manager';
  const [employees, setEmployees] = React.useState([]);
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    company: initial.company || '',
    status: initial.status || 'new',
    estimatedValue: initial.estimatedValue || '',
    notes: initial.notes || '',
    assignedTo: initial.assignedTo?._id || initial.assignedTo || '',
  });

  React.useEffect(() => {
    if (isManager) {
      usersAPI.getEmployees().then(r => setEmployees(r.data.employees || [])).catch(() => {});
    }
  }, [isManager]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.company) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">{initial._id ? 'Edit Client' : 'Add New Client'}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9999999999" required />
        </div>
        <div>
          <label className="label">Company *</label>
          <input className="input" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" required />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" name="status" value={form.status} onChange={handleChange}>
            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Estimated Value (₹)</label>
          <input className="input" name="estimatedValue" type="number" value={form.estimatedValue} onChange={handleChange} placeholder="50000" min="0" />
        </div>
      </div>

      {isManager && employees.length > 0 && (
        <div>
          <label className="label">Assign To Employee</label>
          <select className="input" name="assignedTo" value={form.assignedTo} onChange={handleChange}>
            <option value="">Select employee...</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.email})</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label">Notes</label>
        <textarea className="input" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional notes..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : initial._id ? 'Update Client' : 'Add Client'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default ClientForm;
