import { useState, useEffect } from 'react';
import api from '../api';
import { 
  DollarSign, CheckCircle2, AlertCircle, FileText, Check, MessageCircle, 
  Search, RefreshCw, Filter, Calendar, Building2, DoorOpen, ArrowUpRight, TrendingUp,
  User, ShieldCheck, Clock, ChevronDown, BarChart3, PieChart, Trash2
} from 'lucide-react';

export default function RentTracking() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'history', or 'monthly'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Year & Month Filter States
  const currentSystemYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentSystemYear); // 'ALL' or '2026', '2027', etc.
  const [selectedMonthNum, setSelectedMonthNum] = useState('ALL'); // 'ALL' or '01', '02', ..., '12'
  
  const [recordingId, setRecordingId] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);

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
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  };

  const handleSendReminder = (p) => {
    const phone = cleanPhoneForWhatsapp(p.tenant_phone);
    if (!phone) {
      alert("Tenant phone number is missing or invalid.");
      return;
    }
    const formattedDate = formatDateFormatted(p.due_date);
    const message = `Hello ${p.tenant_name}, this is a friendly reminder that your rent of ₹${Number(p.amount).toLocaleString()} for Room ${p.room_number || 'N/A'} at ${p.property_name || 'Staypik'} is due on ${formattedDate}. Please clear it at your earliest convenience. Thank you!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRecordPayment = async (id) => {
    if (window.confirm("Confirm recording rent payment collection for this tenant?")) {
      setRecordingId(id);
      try {
        const res = await api.post('/rentals/owner/payments/', {
          payment_id: id,
          status: 'PAID'
        });
        setPayments(payments.map(p => p.id === id ? res.data : p));
      } catch (err) {
        console.error(err);
        alert("Failed to log payment transaction.");
      } finally {
        setRecordingId(null);
      }
    }
  };

  // Clear all Paid History records
  const handleClearPaidHistory = async () => {
    if (window.confirm("Are you sure you want to clear all paid rent history logs? This will wipe archived paid records while keeping active pending dues intact.")) {
      setClearingHistory(true);
      try {
        await api.delete('/rentals/owner/payments/?clear_paid=true');
        setPayments(payments.filter(p => p.status !== 'PAID'));
      } catch (err) {
        console.error(err);
        alert("Failed to clear paid rent history.");
      } finally {
        setClearingHistory(false);
      }
    }
  };

  // Clear single payment record
  const handleDeleteSinglePayment = async (id, tenantName) => {
    if (window.confirm(`Are you sure you want to delete this payment record for ${tenantName}?`)) {
      try {
        await api.delete(`/rentals/owner/payments/?id=${id}`);
        setPayments(payments.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete payment record.");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-900 border-red-200';
      default:
        return 'bg-orange-100 text-orange-950 border-orange-200';
    }
  };

  // Helper to format raw YYYY-MM-DD strings into human readable "06 Aug 2026"
  const formatDateFormatted = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (months[monthIdx]) {
          return `${day < 10 ? '0' + day : day} ${months[monthIdx]} ${year}`;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  };

  // Helper to format YYYY-MM into "August 2026"
  const formatMonthLabel = (yearMonthKey) => {
    if (!yearMonthKey || yearMonthKey === 'ALL') return 'All Months';
    const [year, month] = yearMonthKey.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Helper to compute relative due status badge e.g. "5 days overdue" or "Due Today"
  const getRelativeDueDateBadge = (dueDateStr, status) => {
    if (!dueDateStr) return null;
    if (status === 'PAID') return null;
    
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      const parts = String(dueDateStr).split('-');
      let due;
      if (parts.length === 3) {
        due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        due = new Date(dueDateStr);
      }
      due.setHours(0,0,0,0);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysOverdue = Math.abs(diffDays);
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-200 inline-block mt-1">
            {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
          </span>
        );
      } else if (diffDays === 0) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200 inline-block mt-1">
            Due Today
          </span>
        );
      } else if (diffDays <= 7) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200 inline-block mt-1">
            In {diffDays} {diffDays === 1 ? 'day' : 'days'}
          </span>
        );
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Extract all available years dynamically
  const availableYears = Array.from(new Set([
    currentSystemYear,
    String(Number(currentSystemYear) - 1),
    String(Number(currentSystemYear) + 1),
    ...payments.map(p => {
      const d = p.due_date || p.payment_date;
      return d ? d.substring(0, 4) : null;
    }).filter(Boolean)
  ])).sort().reverse();

  // All 12 months array for dropdown selection
  const monthOptions = [
    { value: 'ALL', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate full Year-Month keys for Month-by-Month Performance
  const generateMonthKeysList = () => {
    const keys = [];
    const targetYears = selectedYear === 'ALL' ? availableYears : [selectedYear];
    
    targetYears.forEach(yr => {
      if (selectedMonthNum === 'ALL') {
        for (let m = 12; m >= 1; m--) {
          const monthStr = m < 10 ? `0${m}` : `${m}`;
          keys.push(`${yr}-${monthStr}`);
        }
      } else {
        keys.push(`${yr}-${selectedMonthNum}`);
      }
    });

    return keys;
  };

  const currentMonthKeys = generateMonthKeysList();

  // Filter payments based on selected Year and Month
  const filteredPaymentsByYearMonth = payments.filter(p => {
    const d = p.due_date || p.payment_date || '';
    if (d.length < 7) return true;
    const pYear = d.substring(0, 4);
    const pMonth = d.substring(5, 7);

    const yearMatch = selectedYear === 'ALL' || pYear === selectedYear;
    const monthMatch = selectedMonthNum === 'ALL' || pMonth === selectedMonthNum;
    return yearMatch && monthMatch;
  });

  // Calculate Metrics based on Filtered Payments
  const totalCollected = filteredPaymentsByYearMonth.filter(p => p.status === 'PAID').reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPending = filteredPaymentsByYearMonth.filter(p => p.status !== 'PAID').reduce((acc, p) => acc + Number(p.amount), 0);
  const totalInvoices = filteredPaymentsByYearMonth.length;
  const paidCount = filteredPaymentsByYearMonth.filter(p => p.status === 'PAID').length;
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;

  const activeInvoices = filteredPaymentsByYearMonth.filter(p => p.status !== 'PAID');
  const paymentHistory = filteredPaymentsByYearMonth.filter(p => p.status === 'PAID');
  
  const rawList = activeTab === 'active' ? activeInvoices : paymentHistory;

  // Filtered List by Search Query
  const filteredList = rawList.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = p.tenant_name?.toLowerCase().includes(q);
    const roomMatch = String(p.room_number || '').toLowerCase().includes(q);
    const propMatch = p.property_name?.toLowerCase().includes(q);
    const phoneMatch = p.tenant_phone?.toLowerCase().includes(q);
    return nameMatch || roomMatch || propMatch || phoneMatch;
  });

  // Monthly Breakdown Analytics Data specifically for Month-by-Month view
  const monthlyBreakdownData = currentMonthKeys.map(monthKey => {
    const monthPayments = payments.filter(p => (p.due_date || p.payment_date || '').substring(0, 7) === monthKey);
    const collected = monthPayments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + Number(p.amount), 0);
    const pending = monthPayments.filter(p => p.status !== 'PAID').reduce((acc, p) => acc + Number(p.amount), 0);
    const count = monthPayments.length;
    const paid = monthPayments.filter(p => p.status === 'PAID').length;
    const rate = count > 0 ? Math.round((paid / count) * 100) : 0;

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      totalCount: count,
      paidCount: paid,
      collected,
      pending,
      rate
    };
  });

  // Get active filter label for header
  const getFilterLabel = () => {
    const yrLabel = selectedYear === 'ALL' ? 'All Years' : selectedYear;
    const mLabel = monthOptions.find(m => m.value === selectedMonthNum)?.label || 'All Months';
    return `${mLabel} ${selectedYear === 'ALL' ? '' : yrLabel}`.trim();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn font-sans text-left">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#E65100] uppercase tracking-wider mb-1">
            <span>Owner Dashboard</span>
            <span>/</span>
            <span>Monthly Rent Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
            <DollarSign className="text-[#E65100]" size={28} />
            <span>Rent Tracking & Monthly Performance</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Select specific Year and Month to inspect financial performance, revenue collections, and tenant invoices
          </p>
        </div>

        {/* YEAR & MONTH SELECTOR DROPDOWNS (DARK SLATE BACKGROUND) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SELECT YEAR DROPDOWN */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-2xl px-4 py-2.5 pr-8 text-xs font-extrabold shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition"
            >
              <option value="ALL" className="bg-slate-900 text-amber-400">📅 All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr} className="bg-slate-900 text-amber-400">
                  📅 Year {yr}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
          </div>

          {/* SELECT MONTH DROPDOWN */}
          <div className="relative">
            <select
              value={selectedMonthNum}
              onChange={(e) => setSelectedMonthNum(e.target.value)}
              className="appearance-none bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-2xl px-4 py-2.5 pr-8 text-xs font-extrabold shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-amber-400">
                  🗓️ {m.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
          </div>


          <button 
            onClick={fetchPayments}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-2xl transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#E65100]" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {getFilterLabel()} Collected
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">₹{totalCollected.toLocaleString()}</p>
          <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
            <CheckCircle2 size={12} />
            <span>{paidCount} Paid Invoices</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {getFilterLabel()} Pending
          </span>
          <p className="text-2xl sm:text-3xl font-black text-[#D84300]">₹{totalPending.toLocaleString()}</p>
          <span className="text-[11px] font-bold text-[#D84300] flex items-center space-x-1">
            <Clock size={12} />
            <span>{activeInvoices.length} Active Dues</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Collection Efficiency</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{collectionRate}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-[#D84300] to-[#F05A00] h-full rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalInvoices}</p>
          <span className="text-[11px] font-bold text-slate-400 block font-mono">{getFilterLabel()}</span>
        </div>
      </div>

      {/* FILTER & TABS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:px-6 sm:py-3.5 rounded-3xl border border-slate-200/80 shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active Dues</span>
            {activeInvoices.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#E65100] text-white">
                {activeInvoices.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Paid History</span>
            {paymentHistory.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-600 text-white">
                {paymentHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-r from-[#D84300] to-[#E55100] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={14} />
            <span>Monthly Performance</span>
          </button>
        </div>

        {/* Clear Paid History Button & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'history' && paymentHistory.length > 0 && (
            <button
              onClick={handleClearPaidHistory}
              disabled={clearingHistory}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              title="Clear all archived paid rent history logs"
            >
              <Trash2 size={13} />
              <span>{clearingHistory ? 'Clearing...' : 'Clear Paid History'}</span>
            </button>
          )}

          {activeTab !== 'monthly' && (
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenant, room #, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#E55100] focus:bg-white focus:outline-none transition placeholder-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* VIEW CONTENTS */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-xs bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          Loading rent payment logs...
        </div>
      ) : activeTab === 'monthly' ? (
        /* MONTH-BY-MONTH FINANCIAL PERFORMANCE CARDS VIEW (DARK SLATE BACKGROUND) */
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-md">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl text-white tracking-tight">Month-by-Month Financial Performance</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Showing financial performance breakdown for: <span className="text-amber-400 font-black">{getFilterLabel()}</span>
                </p>
              </div>
            </div>

            {/* Quick Reset Filter */}
            {(selectedYear !== 'ALL' || selectedMonthNum !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedYear('ALL');
                  setSelectedMonthNum('ALL');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-extrabold rounded-xl border border-slate-700 shadow-xs transition"
              >
                Show All Years & Months
              </button>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlyBreakdownData.map((m) => (
              <div
                key={m.monthKey}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs transition hover:shadow-md hover:border-orange-300"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-[#E65100]" />
                    <h4 className="font-black text-slate-900 text-base">{m.label}</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-50 text-[#E65100] border border-orange-100 text-[11px] font-extrabold rounded-md">
                    {m.totalCount} Invoices
                  </span>
                </div>

                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-slate-500">Collected Rent:</span>
                    <span className="font-black text-sm">₹{m.collected.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-[#D84300]">
                    <span className="text-slate-500">Pending Dues:</span>
                    <span className="font-black text-sm">₹{m.pending.toLocaleString()}</span>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Collection Efficiency:</span>
                      <span className="font-black text-slate-900">{m.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#D84300] to-[#F05A00] h-full rounded-full" style={{ width: `${m.rate}%` }}></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const [y, mStr] = m.monthKey.split('-');
                    setSelectedYear(y);
                    setSelectedMonthNum(mStr);
                    setActiveTab('active');
                  }}
                  className="w-full py-2 bg-orange-50/70 hover:bg-[#E65100] text-[#E65100] hover:text-white border border-orange-200/80 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 group"
                >
                  <span>Inspect Invoices for {m.label}</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs space-y-2">
          <p className="text-base text-slate-700 font-black">
            {activeTab === 'active' 
              ? `All Clear! No pending unpaid rent invoices for ${getFilterLabel()}.` 
              : `No payment history records found for ${getFilterLabel()}.`}
          </p>
          {searchQuery && <p className="text-xs font-semibold text-slate-400">No records matching "{searchQuery}"</p>}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Room & Property</th>
                  <th className="p-4">{activeTab === 'active' ? 'Due Date' : 'Payment Date'}</th>
                  <th className="p-4">Billing Status</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-extrabold text-slate-800 divide-y divide-slate-100">
                {filteredList.map((p) => {
                  const targetDate = activeTab === 'active' ? p.due_date : (p.payment_date || p.due_date);
                  const formattedDate = formatDateFormatted(targetDate);
                  const relativeBadge = getRelativeDueDateBadge(p.due_date, p.status);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-xs shadow-xs border border-orange-200">
                            {p.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{p.tenant_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{p.tenant_phone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#E65100] font-black text-[11px] border border-orange-200">
                            Room {p.room_number || 'N/A'}
                          </span>
                          <p className="text-[11px] font-bold text-slate-500 mt-1">{p.property_name || 'Staypik PG'}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{formattedDate}</span>
                          {relativeBadge}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="p-4 text-right font-black text-slate-900 text-sm">
                        ₹{Number(p.amount).toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {p.status !== 'PAID' ? (
                            <>
                              <button
                                onClick={() => handleRecordPayment(p.id)}
                                disabled={recordingId === p.id}
                                className="px-3.5 py-1.5 bg-[#E65100] hover:bg-[#C43600] text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
                              >
                                <Check size={13} />
                                <span>{recordingId === p.id ? 'Logging...' : 'Collect'}</span>
                              </button>
                              
                              <button
                                onClick={() => handleSendReminder(p)}
                                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1"
                                title="Send WhatsApp Payment Reminder"
                              >
                                <MessageCircle size={13} />
                                <span>Remind</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="text-xs text-emerald-700 font-extrabold flex items-center space-x-1 py-1">
                                <CheckCircle2 size={14} />
                                <span>Recorded</span>
                              </div>

                              <button
                                onClick={() => handleDeleteSinglePayment(p.id, p.tenant_name)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 border border-red-200 transition"
                                title="Delete payment log"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredList.map((p) => {
              const targetDate = activeTab === 'active' ? p.due_date : (p.payment_date || p.due_date);
              const formattedDate = formatDateFormatted(targetDate);
              const relativeBadge = getRelativeDueDateBadge(p.due_date, p.status);

              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#E65100] font-black flex items-center justify-center text-sm shadow-xs border border-orange-200">
                        {p.tenant_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{p.tenant_name}</h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-[#E65100] font-extrabold text-[10px]">
                            Room {p.room_number || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{p.property_name}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider">
                        {activeTab === 'active' ? 'Due Date' : 'Payment Date'}
                      </p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{formattedDate}</p>
                      {relativeBadge}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Rent Amount</p>
                      <p className="text-slate-900 font-black text-base mt-0.5">₹{Number(p.amount).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    {p.status !== 'PAID' ? (
                      <>
                        <button
                          onClick={() => handleRecordPayment(p.id)}
                          disabled={recordingId === p.id}
                          className="flex-1 py-2.5 bg-[#E65100] hover:bg-[#C43600] text-white rounded-2xl text-xs font-black shadow-xs transition flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>{recordingId === p.id ? 'Logging...' : 'Collect'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleSendReminder(p)}
                          className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-black shadow-xs transition flex items-center justify-center space-x-1"
                        >
                          <MessageCircle size={14} />
                          <span>Remind</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between pt-1">
                        <div className="text-xs text-emerald-700 font-extrabold flex items-center space-x-1.5 py-1">
                          <CheckCircle2 size={14} />
                          <span>Recorded Paid</span>
                        </div>

                        <button
                          onClick={() => handleDeleteSinglePayment(p.id, p.tenant_name)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-black transition flex items-center space-x-1"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
