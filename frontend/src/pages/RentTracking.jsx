import { useState, useEffect } from 'react';
import api from '../api';
import { DollarSign, CheckCircle2, AlertCircle, FileText, Check, MessageCircle } from 'lucide-react';

export default function RentTracking() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/owner/payments/');
      setPayments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneForWhatsapp = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d]/g, ''); // Keep only digits
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned; // Default to India country code if 10 digits
    }
    return cleaned;
  };

  const handleSendReminder = (p) => {
    const phone = cleanPhoneForWhatsapp(p.tenant_phone);
    if (!phone) {
      alert("Tenant phone number is missing or invalid.");
      return;
    }
    const message = `Hello ${p.tenant_name}, this is a friendly reminder that your rent of ₹${Number(p.amount).toLocaleString()} for Room ${p.room_number || 'N/A'} was due on ${p.due_date}. Please clear it at your earliest convenience. Thank you!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRecordPayment = async (id) => {
    if (window.confirm("Confirm recording rent collection payment for this tenant?")) {
      try {
        const res = await api.post('/rentals/owner/payments/', {
          payment_id: id,
          status: 'PAID'
        });
        setPayments(payments.map(p => p.id === id ? res.data : p));
      } catch (err) {
        console.error(err);
        alert("Failed to log payment transaction.");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'OVERDUE':
        return 'bg-red-50 text-red-800 border-red-100';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-100';
    }
  };

  const activeInvoices = payments.filter(p => p.status !== 'PAID');
  const paymentHistory = payments.filter(p => p.status === 'PAID');
  const currentList = activeTab === 'active' ? activeInvoices : paymentHistory;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Rent Ledger</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Track monthly pg rent invoices, pending dues and payment records</p>
        </div>
        <button 
          onClick={fetchPayments}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-80">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'active'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Active Invoices</span>
          {activeInvoices.length > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-amber-700 text-white leading-none">
              {activeInvoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'history'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Payment History</span>
          {paymentHistory.length > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-slate-500 text-white leading-none">
              {paymentHistory.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold bg-white rounded-3xl border border-slate-100 shadow-sm">Loading rent logs...</div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-sm">
          {activeTab === 'active' 
            ? 'No pending unpaid invoices. All rent collected!' 
            : 'No payment history records found.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Room No</th>
                  <th className="p-4">{activeTab === 'active' ? 'Due Date' : 'Payment Date'}</th>
                  <th className="p-4">Billing Status</th>
                  <th className="p-4 text-right">Rent Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700 divide-y divide-slate-50">
                {currentList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold">{p.tenant_name}</td>
                    <td className="p-4 text-slate-500">Room {p.room_number || 'N/A'}</td>
                    <td className="p-4 text-xs">{activeTab === 'active' ? p.due_date : (p.payment_date || p.due_date)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {p.status !== 'PAID' ? (
                          <>
                            <button
                              onClick={() => handleRecordPayment(p.id)}
                              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1"
                            >
                              <Check size={12} />
                              <span>Collect</span>
                            </button>
                            
                            <button
                              onClick={() => handleSendReminder(p)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1"
                              title="Send WhatsApp Rent Reminder"
                            >
                              <MessageCircle size={12} />
                              <span>Remind</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-center space-x-1 py-1.5">
                            <CheckCircle2 size={12} />
                            <span>Recorded</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {currentList.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{p.tenant_name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Room {p.room_number || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-50 pt-3">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider">
                      {activeTab === 'active' ? 'Due Date' : 'Payment Date'}
                    </p>
                    <p className="text-slate-700 mt-0.5">{activeTab === 'active' ? p.due_date : (p.payment_date || p.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Rent Amount</p>
                    <p className="text-slate-800 font-extrabold text-sm mt-0.5">₹{Number(p.amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-50 pt-3">
                  {p.status !== 'PAID' ? (
                    <>
                      <button
                        onClick={() => handleRecordPayment(p.id)}
                        className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Collect</span>
                      </button>
                      
                      <button
                        onClick={() => handleSendReminder(p)}
                        className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
                      >
                        <MessageCircle size={14} />
                        <span>Remind</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-xs text-emerald-600 font-bold flex items-center justify-center space-x-1.5 py-1">
                      <CheckCircle2 size={14} />
                      <span>Recorded</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
