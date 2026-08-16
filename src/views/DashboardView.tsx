import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import {
  Wallet,
  Banknote,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Users,
  Package,
  ArrowUpRight,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  Filter,
  PlusCircle,
  Receipt,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { Sale, ExpenseCategory } from '../types';

interface DashboardViewProps {
  onOpenAITaxlilchi: () => void;
  onOpenReceiptModal?: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAITaxlilchi,
  onOpenReceiptModal,
}) => {
  const {
    settings,
    getAggregatedStats,
    getPaymentTypeSales,
    getTopSellingProductsMonth,
    customers,
    notifications,
    setActiveTab,
    expenses,
    addExpense,
    deleteExpense,
    currentUser,
  } = useERP();

  const t = translations[settings.language || 'uz'];

  // Currency Toggle state ('UZS' or 'USD')
  const [displayCurrency, setDisplayCurrency] = useState<'UZS' | 'USD'>('UZS');
  const usdRate = settings.usdRate || 12800;

  const formatMoney = (valUzs: number) => {
    if (displayCurrency === 'USD') {
      const usdVal = valUzs / usdRate;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${valUzs.toLocaleString('uz-UZ')} UZS`;
  };

  const formatNumberOnly = (valUzs: number) => {
    if (displayCurrency === 'USD') {
      const usdVal = valUzs / usdRate;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return valUzs.toLocaleString('uz-UZ');
  };

  // Date Range filter state
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Modal for Payment Type Breakdown
  const [selectedPaymentTypeModal, setSelectedPaymentTypeModal] = useState<
    'naqd' | 'karta' | 'nasiya' | null
  >(null);

  // Modal for Add Expense (Rasxod qo'shish)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('tushlik');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaymentType, setExpPaymentType] = useState<'naqd' | 'karta'>('naqd');
  const [expDate, setExpDate] = useState(todayStr);
  const [expNote, setExpNote] = useState('');

  // Get aggregated stats for selected date range
  const stats = getAggregatedStats(startDate, endDate);

  // Filter expenses for selected date range
  const filteredExpenses = expenses.filter((e) => {
    const expTime = new Date(e.date).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    return expTime >= start && expTime <= end;
  });

  // Top products & debt customers
  const topProducts = getTopSellingProductsMonth();
  const debtCustomers = customers.filter((c) => c.currentDebtUzs > 0);

  // Get sales list for the detail modal
  const modalSales = selectedPaymentTypeModal
    ? getPaymentTypeSales(selectedPaymentTypeModal, startDate, endDate)
    : [];

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(expAmount);
    if (!numAmount || numAmount <= 0) {
      alert("Iltimos, to'g'ri xarajat summasini kiriting!");
      return;
    }

    const categoryTitleMap: Record<ExpenseCategory, string> = {
      tushlik: '🍔 Tushlik / Abet xarajati',
      yolkira: "🚗 Yo'l kira / Taksi",
      oylik: '💼 Oylik / Ish haqi berildi',
      kommunal: "⚡ Kommunal / Ijara to'lov",
      boshqa: '📦 Boshqa kassa xarajati',
    };

    addExpense({
      category: expCategory,
      title: expTitle.trim() || categoryTitleMap[expCategory],
      amountUzs: numAmount,
      paymentType: expPaymentType,
      date: expDate || todayStr,
      addedBy: currentUser?.name || 'Kassir',
      note: expNote.trim(),
    });

    // Reset form
    setExpTitle('');
    setExpAmount('');
    setExpNote('');
    setIsAddExpenseOpen(false);
  };

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'tushlik':
        return { label: 'Tushlik (Abet)', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' };
      case 'yolkira':
        return { label: "Yo'l kira", bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'oylik':
        return { label: 'Oylik / Ish haqi', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      case 'kommunal':
        return { label: 'Kommunal / Ijara', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Boshqa', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="space-y-3 sm:space-y-5 pb-20">
      
      {/* TOP NOTIFICATIONS BANNER (Auto Alerts for Low Stock & Debts) */}
      {notifications.filter((n) => !n.read).length > 0 && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-sm flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-semibold text-amber-800 dark:text-amber-200 truncate">
              {notifications.filter((n) => !n.read)[0]?.message}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('dokon_ombor')}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] sm:text-xs shrink-0 transition-all shadow-sm"
          >
            Ko'rish
          </button>
        </div>
      )}

      {/* COMPACT DATE FILTER & CURRENCY SWITCHER BAR */}
      <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* CURRENCY TOGGLE SWITCHER (UZS / USD) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setDisplayCurrency('UZS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
              displayCurrency === 'UZS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🇺🇿 SO'M (UZS)
          </button>
          <button
            type="button"
            onClick={() => setDisplayCurrency('USD')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
              displayCurrency === 'USD'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🇺🇸 DOLLAR ($)
          </button>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-1.5 hidden sm:inline">
            (1$ = {usdRate.toLocaleString()} UZS)
          </span>
        </div>

        {/* DATE SELECTOR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <span className="text-slate-400 text-xs">-</span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px]">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setStartDate(todayStr);
              setEndDate(todayStr);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 transition-all"
          >
            Bugun
          </button>

          {/* ADD EXPENSE BUTTON */}
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0 shadow-sm transition-all ml-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Rasxod</span>
          </button>
        </div>
      </div>

      {/* COMPACT HIGH-DENSITY FINANCIAL TILES GRID (2-COL / 3-COL MOBILE FRIENDLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        
        {/* Tushum (Gross) */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Kassa Tushum</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {formatNumberOnly(stats.cashboxBalanceUzs)}{' '}
            <span className="text-[9px] text-emerald-500 font-normal">{displayCurrency}</span>
          </div>
        </div>

        {/* Rasxod (Expenses) */}
        <div
          onClick={() => setIsAddExpenseOpen(true)}
          className="rounded-xl sm:rounded-2xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/40 p-2.5 sm:p-3 shadow-sm cursor-pointer hover:border-rose-500 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">Rasxod</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 truncate">
            - {formatNumberOnly(stats.totalExpensesUzs)}{' '}
            <span className="text-[9px] text-rose-500 font-normal">{displayCurrency}</span>
          </div>
        </div>

        {/* Sof Kassa (Net Cash) */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/50 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-tight">Sof Kassa</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-300 truncate">
            {formatNumberOnly(stats.netCashboxBalanceUzs)}{' '}
            <span className="text-[9px] text-emerald-400 font-normal">{displayCurrency}</span>
          </div>
        </div>

        {/* Naqd */}
        <div
          onClick={() => setSelectedPaymentTypeModal('naqd')}
          className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 p-2.5 sm:p-3 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">{t.naqd}</span>
            <Banknote className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {formatNumberOnly(stats.cashTotalUzs)}
            <span className="text-[9px] text-amber-500 font-normal ml-0.5">{displayCurrency}</span>
          </div>
        </div>

        {/* Karta */}
        <div
          onClick={() => setSelectedPaymentTypeModal('karta')}
          className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/30 p-2.5 sm:p-3 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">{t.karta}</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {formatNumberOnly(stats.cardTotalUzs)}
            <span className="text-[9px] text-blue-500 font-normal ml-0.5">{displayCurrency}</span>
          </div>
        </div>

        {/* Nasiya */}
        <div
          onClick={() => setSelectedPaymentTypeModal('nasiya')}
          className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 p-2.5 sm:p-3 shadow-sm cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">{t.nasiya}</span>
            <FileText className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {formatNumberOnly(stats.nasiyaTotalUzs)}
            <span className="text-[9px] text-rose-500 font-normal ml-0.5">{displayCurrency}</span>
          </div>
        </div>

      </div>

      {/* SOF FOYDA SUMMARY STRIP */}
      <div className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between text-xs shadow-sm border border-slate-700/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] text-slate-300">Sof Foyda (Xarajatlar chegirilgan):</span>
        </div>
        <span className="font-extrabold text-amber-400 text-sm">{formatMoney(stats.netProfitAfterExpensesUzs)}</span>
      </div>

      {/* EXPENSES HISTORY LIST (COMPACT MOBILE DESIGN) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Rasxodlar Tarixi
            </h3>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Qo'shish</span>
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-5 text-slate-400 text-xs">
              Ushbu vaqt oralig'ida rasxodlar yo'q.
            </div>
          ) : (
            filteredExpenses.map((exp) => {
              const badge = getCategoryBadge(exp.category);
              return (
                <div
                  key={exp.id}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                        {exp.title}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span>{new Date(exp.date).toLocaleDateString('uz-UZ')}</span>
                        <span>•</span>
                        <span className="uppercase">{exp.paymentType}</span>
                        {exp.note && <span className="truncate italic">({exp.note})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                      - {formatMoney(exp.amountUzs)}
                    </span>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm("Xarajatni o'chirasizmi?")) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SALES GRAPH / CHART SIMULATION & DASHBOARD SUMMARY */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span>{t.daily_sales_chart}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tanlangan oraliq ({startDate} - {endDate}) uchun tahlil
            </p>
          </div>

          <div className="text-right">
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Jami Savdolar:</div>
            <div className="text-sm sm:text-lg font-extrabold text-amber-500">{stats.totalSalesCount} ta sotuv</div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-36 sm:h-44 flex items-end justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { label: 'Naqd', val: stats.cashTotalUzs, color: 'from-amber-500 to-orange-500' },
            { label: 'Karta', val: stats.cardTotalUzs, color: 'from-blue-500 to-indigo-500' },
            { label: 'Nasiya', val: stats.nasiyaTotalUzs, color: 'from-rose-500 to-red-600' },
            { label: 'Rasxod', val: stats.totalExpensesUzs, color: 'from-red-500 to-rose-700' },
            { label: 'Sof Foyda', val: stats.netProfitAfterExpensesUzs, color: 'from-emerald-500 to-teal-500' },
          ].map((bar, idx) => {
            const maxVal = Math.max(stats.totalRevenueUzs || 1, 1);
            const heightPercent = Math.min(100, Math.max(12, (bar.val / maxVal) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 group-hover:scale-110 transition-transform truncate max-w-[60px] sm:max-w-none">
                  {formatNumberOnly(bar.val)}
                </div>
                <div
                  className={`w-full rounded-t-xl bg-gradient-to-t ${bar.color} transition-all duration-500 shadow-sm`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1.5">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTIONS: TOP SELLING PRODUCTS & DEBT CUSTOMERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* 1 OYLIK ENG SOTILGAN TOVARLAR & FOYDASI */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md transition-colors">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>{t.top_products_month}</span>
            </h3>
            <button
              onClick={() => setActiveTab('dokon_ombor')}
              className="text-xs font-semibold text-amber-500 hover:underline"
            >
              Barchasi
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Sotilgan tovarlar mavjud emas</div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2.5 text-xs hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.productName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.model}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
                      +{formatMoney(p.totalProfitUzs)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sotildi: <strong>{p.quantitySold} {p.unitType}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NASIYACHI MIJOZLAR (DEBT CUSTOMERS) */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md transition-colors">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              <span>{t.debt_customers_list}</span>
            </h3>
            <button
              onClick={() => setActiveTab('mijozlar')}
              className="text-xs font-semibold text-rose-500 hover:underline"
            >
              Barchasi
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {debtCustomers.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Qarzdor mijozlar yo'q</div>
            ) : (
              debtCustomers.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-rose-500/20 flex items-center justify-between gap-2.5 text-xs hover:border-rose-500/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                      <span className="truncate">{c.name}</span>
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                        {c.region}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {c.partnerSince} dan buyon
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-rose-600 dark:text-rose-400 text-[11px] sm:text-xs">
                      {formatMoney(c.currentDebtUzs)}
                    </div>
                    {c.debtDueDate && (
                      <div className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Muddati: {c.debtDueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL: ADD EXPENSE (XARAJAT QO'SHISH) */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Xarajat (Rasxod) Kiritish
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Abet, yo'l kira va oyliklarni kassadan belgilang
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category Selector Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Xarajat Turi (Kategoriya):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'tushlik', label: '🍔 Tushlik / Abet' },
                    { id: 'yolkira', label: "🚗 Yo'l kira / Taksi" },
                    { id: 'oylik', label: '💼 Oylik / Ish haqi' },
                    { id: 'kommunal', label: '⚡ Kommunal / Ijara' },
                    { id: 'boshqa', label: '📦 Boshqa xarajat' },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setExpCategory(cat.id as ExpenseCategory)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border text-left transition-all ${
                        expCategory === cat.id
                          ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xarajat Nomi / Sababi:
                </label>
                <input
                  type="text"
                  placeholder="masalan: Kassir tushlik puli, benzin, oylik bo'nak..."
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xarajat Summasi (So'm): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="masalan: 35000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Payment Type & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To'lov Manbai:
                  </label>
                  <select
                    value={expPaymentType}
                    onChange={(e) => setExpPaymentType(e.target.value as 'naqd' | 'karta')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="naqd">Naqd Kassa</option>
                    <option value="karta">Karta / Terminal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sana:
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qo'shimcha Izoh (Ixtiyoriy):
                </label>
                <textarea
                  rows={2}
                  placeholder="masalan: Alisher kassir tushlik uchun 45,000 olib ketdi..."
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Xarajatni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR CLICKED 3D PAYMENT TILE */}
      {selectedPaymentTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="capitalize">{selectedPaymentTypeModal}</span>
                <span>Bo'yicha Batafsil Hisobot</span>
              </h3>
              <button
                onClick={() => setSelectedPaymentTypeModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {modalSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Ushbu to'lov turi bo'yicha sotuvlar topilmadi
                </div>
              ) : (
                modalSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <span>{sale.saleNumber}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">| {sale.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Sana: {new Date(sale.date).toLocaleString('uz-UZ')} | Kassir: {sale.cashierName}
                      </div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-300 mt-1 font-medium">
                        Tovarlar: {sale.items.map((i) => `${i.productName} (${i.quantity} ${i.unitType})`).join(', ')}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                        {formatMoney(sale.totalAmountUzs)}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPaymentTypeModal(null);
                          onOpenReceiptModal?.(sale);
                        }}
                        className="mt-1 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold"
                      >
                        Chekini Ko'rish
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setSelectedPaymentTypeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
