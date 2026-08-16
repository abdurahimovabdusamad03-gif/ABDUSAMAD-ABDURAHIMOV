import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  PlusCircle,
  History,
} from 'lucide-react';
import { Customer } from '../types';

export const MijozlarView: React.FC = () => {
  const { customers, sales, repayDebt, debtPayments, settings } = useERP();
  const t = translations[settings.language || 'uz'];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [callToast, setCallToast] = useState<string | null>(null);

  const handleMakeCall = (phone?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!phone) {
      setCallToast("⚠️ Telefon raqami kiritilmagan!");
      setTimeout(() => setCallToast(null), 3000);
      return;
    }

    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (!cleaned) {
      setCallToast("⚠️ Telefon raqami noto'g'ri formatda!");
      setTimeout(() => setCallToast(null), 3000);
      return;
    }

    // Copy number to clipboard for convenience
    try {
      navigator.clipboard.writeText(phone);
    } catch (err) {
      // Ignore fallback
    }

    setCallToast(`📞 Qo'ng'iroq: ${phone} (Raqam nusxalandi)`);
    setTimeout(() => setCallToast(null), 3500);

    // Execute phone dialer safely across browsers and webviews
    try {
      window.open(`tel:${cleaned}`, '_top');
    } catch (err) {
      window.location.href = `tel:${cleaned}`;
    }
  };

  // Repay Debt Modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayPaymentType, setRepayPaymentType] = useState<'naqd' | 'karta'>('naqd');
  const [repayNote, setRepayNote] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterDebtOnly) {
      return matchesSearch && c.currentDebtUzs > 0;
    }
    return matchesSearch;
  });

  const handleOpenRepayModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setRepayAmount(cust.currentDebtUzs);
    setShowRepayModal(true);
  };

  const handleExecuteRepayment = () => {
    if (!selectedCustomer || repayAmount <= 0) return;

    repayDebt(selectedCustomer.id, repayAmount, repayPaymentType, repayNote);
    alert("Qarz to'lovi muvaffaqiyatli qabul qilindi!");
    setShowRepayModal(false);
    setRepayNote('');
  };

  // Get customer sales history
  const customerSalesHistory = selectedCustomer
    ? sales.filter(
        (s) =>
          s.customerName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim() ||
          (s.customerPhone && s.customerPhone === selectedCustomer.phone)
      )
    : [];

  // Get customer repayments history
  const customerRepayments = selectedCustomer
    ? debtPayments.filter((dp) => dp.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-3 sm:space-y-5 pb-20">
      
      {/* TOP BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">{t.mijozlar} ({customers.length})</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-b-2 active:translate-y-0.5 ${
              filterDebtOnly
                ? 'bg-rose-600 text-white border-rose-900 shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {filterDebtOnly ? `${t.only_debtors} (${t.active})` : t.only_debtors}
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Mijoz ismi, tel yoki viloyat..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
        />
      </div>

      {/* CUSTOMERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs font-medium">
            Mijozlar topilmadi
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div
              key={c.id}
              className={`p-2.5 sm:p-4 rounded-2xl bg-slate-900 border shadow-md flex flex-col justify-between gap-2 transition-all ${
                c.currentDebtUzs > 0 ? 'border-rose-500/40 shadow-rose-500/5' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1 gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">{c.name}</h3>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                    {c.region}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 font-medium">
                  <button
                    type="button"
                    onClick={(e) => handleMakeCall(c.phone, e)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30 transition-all active:scale-95"
                    title="Qo'ng'iroq qilish"
                  >
                    <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{c.phone || 'Tel yo\'q'}</span>
                  </button>
                  <span className="text-slate-500 text-[9px]">{c.partnerSince} dan</span>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 space-y-0.5 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Jami:</span>
                    <span className="font-black text-emerald-400">
                      {c.totalPurchasesUzs.toLocaleString()} UZS
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Qarz:</span>
                    <span
                      className={`font-black ${
                        c.currentDebtUzs > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {c.currentDebtUzs.toLocaleString()} UZS
                    </span>
                  </div>

                  {c.debtDueDate && c.currentDebtUzs > 0 && (
                    <div className="flex justify-between text-[9px] text-amber-400 font-bold pt-0.5">
                      <span>Muddati:</span>
                      <span>{c.debtDueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedCustomer(c)}
                  className="flex-1 py-1 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                >
                  Batafsil
                </button>

                {c.currentDebtUzs > 0 && (
                  <button
                    onClick={() => handleOpenRepayModal(c)}
                    className="py-1 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black transition-all shadow-md active:scale-95 shrink-0"
                  >
                    Qarz So'ndirish
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* CUSTOMER DETAIL MODAL (HISTORY & PURCHASES) */}
      {selectedCustomer && !showRepayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full h-[92dvh] sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col min-h-0 text-slate-100 overflow-hidden">
            
            {/* Header */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>{selectedCustomer.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400">
                    {selectedCustomer.region}
                  </span>
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => handleMakeCall(selectedCustomer.phone, e)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/40 transition-all active:scale-95"
                    title="Qo'ng'iroq qilish"
                  >
                    <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{selectedCustomer.phone || 'Tel kiritilmagan'}</span>
                  </button>
                  <span>•</span>
                  <span>{selectedCustomer.partnerSince} dan hamkor</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-4">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">Jami Savdo:</div>
                  <div className="text-sm sm:text-base font-black text-emerald-400">
                    {selectedCustomer.totalPurchasesUzs.toLocaleString()} UZS
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">Qarz Qoldig'i:</div>
                  <div className="text-sm sm:text-base font-black text-rose-400">
                    {selectedCustomer.currentDebtUzs.toLocaleString()} UZS
                  </div>
                </div>
              </div>

              {/* Customer Purchase History */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xaridlar Tarixi:</span>
                </h4>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {customerSalesHistory.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">Xaridlar tarixi topilmadi</div>
                  ) : (
                    customerSalesHistory.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-slate-200 font-bold text-[11px]">
                          <span>Chek #{s.saleNumber} ({new Date(s.date).toLocaleDateString('uz-UZ')})</span>
                          <span className="text-emerald-400 font-extrabold">{s.totalAmountUzs.toLocaleString()} UZS</span>
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-1">
                          {s.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1">
                              <span>• {item.productName} ({item.model})</span>
                              <span className="font-semibold text-amber-300">
                                {item.quantity} {item.unitType} x {item.salePrice.toLocaleString()} UZS
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Repayments History */}
              {customerRepayments.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-black text-white mb-2">Qarz So'ndirish Tarixi:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {customerRepayments.map((dp) => (
                      <div key={dp.id} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-black text-emerald-400">+{dp.amountUzs.toLocaleString()} UZS ({dp.paymentType})</div>
                          <div className="text-[9px] text-slate-400">{new Date(dp.date).toLocaleString('uz-UZ')}</div>
                        </div>
                        <div className="text-slate-400 text-[9px]">{dp.note || "To'lov qabul qilindi"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 text-right bg-slate-900">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-extrabold text-xs hover:bg-slate-700"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REPAY DEBT MODAL */}
      {showRepayModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full h-[92dvh] sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col min-h-0 text-slate-100 overflow-hidden">
            
            {/* Header */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Qarzni So'ndirish: {selectedCustomer.name}</span>
              </h3>
              <button
                onClick={() => setShowRepayModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs">
              <p className="text-xs text-slate-400">
                Jami qarz: <strong className="text-rose-400 font-black">{selectedCustomer.currentDebtUzs.toLocaleString()} UZS</strong>
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px]">To'lanayotgan Summa (UZS)</label>
                <input
                  type="number"
                  value={repayAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setRepayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-black text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px]">To'lov Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayPaymentType('naqd')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border text-xs ${
                      repayPaymentType === 'naqd'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Naqd</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepayPaymentType('karta')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border text-xs ${
                      repayPaymentType === 'karta'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Karta</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px]">Izoh (Ixtiyoriy)</label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="Masalan: Qisman to'lov berdi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-900">
              <button
                type="button"
                onClick={() => setShowRepayModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleExecuteRepayment}
                className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
              >
                To'lovni Saqlash
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING CALL TOAST NOTIFICATION */}
      {callToast && (
        <div className="fixed bottom-6 right-6 z-[80] bg-slate-800/95 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-slideUp backdrop-blur-md">
          <Phone className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>{callToast}</span>
        </div>
      )}

    </div>
  );
};
