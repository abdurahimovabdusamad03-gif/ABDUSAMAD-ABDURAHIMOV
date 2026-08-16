import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { translations, regionsUzbekistan } from '../translations';
import {
  DollarSign,
  Plus,
  ShoppingCart,
  Printer,
  Send,
  Save,
  Trash2,
  CheckCircle2,
  Search,
  User,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Barcode,
  Camera,
  Package,
  Layers,
  Scissors,
  Minus,
  RotateCcw,
  X,
  Undo2,
} from 'lucide-react';
import { Sale, SaleItem, UnitType } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

interface SotuvViewProps {
  onOpenReceiptModal?: (sale: Sale) => void;
}

export const SotuvView: React.FC<SotuvViewProps> = ({ onOpenReceiptModal }) => {
  const {
    products,
    settings,
    updateSettings,
    addSale,
    returnSale,
    sales,
    currentUser,
  } = useERP();

  const t = translations[settings.language || 'uz'];

  // Currency rate modal state
  const [showUsdModal, setShowUsdModal] = useState(false);
  const [tempUsdRate, setTempUsdRate] = useState(settings.usdRate || 12800);

  // Return sale modal state
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [returnReasonInput, setReturnReasonInput] = useState<string>('Mijoz xohishi bilan (Mos kelmadi)');
  const [returnItemsState, setReturnItemsState] = useState<Record<string, { selected: boolean; returnQty: number }>>({});

  const handleOpenReturnModal = (sale: Sale) => {
    const initialMap: Record<string, { selected: boolean; returnQty: number }> = {};
    sale.items.forEach((item) => {
      const alreadyReturned = item.returnedQuantity || 0;
      const remaining = Math.max(0, item.quantity - alreadyReturned);
      initialMap[item.productId] = {
        selected: remaining > 0,
        returnQty: remaining,
      };
    });
    setReturnItemsState(initialMap);
    setReturnReasonInput('Mijoz xohishi bilan (Mos kelmadi)');
    setReturnModalSale(sale);
  };

  const calculateTotalLiveRefund = () => {
    if (!returnModalSale) return 0;
    let total = 0;
    returnModalSale.items.forEach((item) => {
      const st = returnItemsState[item.productId];
      if (st && st.selected && st.returnQty > 0) {
        total += st.returnQty * item.salePrice;
      }
    });
    return total;
  };

  // New Sale Form State
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerRegion, setCustomerRegion] = useState(regionsUzbekistan[0]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [sendTelegramNotification, setSendTelegramNotification] = useState<boolean>(true);

  // Cart Items
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);

  // Item inputs
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('dona');
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const [unitsCount, setUnitsCount] = useState<number>(1); // rolls / bags / boxes
  const [sellingPriceStr, setSellingPriceStr] = useState<string>('0');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [selectedRollIndices, setSelectedRollIndices] = useState<number[]>([]);

  // Decimal parsing helper that cleanly handles dots and commas
  const parseDecimal = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const normalized = String(val).replace(/,/g, '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  // Payment Breakdown State
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [nasiyaAmount, setNasiyaAmount] = useState<number>(0);
  const [debtDueDate, setDebtDueDate] = useState<string>('');

  // History search & Barcode Scanner
  const [historySearch, setHistorySearch] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim().toLowerCase();
    const foundProduct = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === code
    );

    if (foundProduct) {
      handleProductChange(foundProduct.id);
      setShowScannerModal(false);
    } else {
      alert(`Shtrix-kod (${scannedCode}) bo'yicha tovar topilmadi!`);
      setShowScannerModal(false);
    }
  };

  // Derived product info
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Compute store rolls/bags/boxes list for selected product
  const storeList = useMemo(() => {
    if (!selectedProduct) return [];
    if (selectedProduct.unitType === 'metr') {
      if (selectedProduct.storeRollsList && selectedProduct.storeRollsList.length > 0) {
        return selectedProduct.storeRollsList;
      }
      if ((selectedProduct.rollsInStore || 0) > 0) {
        const count = selectedProduct.rollsInStore || 1;
        const total = selectedProduct.totalMetersStore || 0;
        const per = count > 0 ? Math.round(total / count) : 50;
        return Array(count).fill(per);
      }
    } else if (selectedProduct.unitType === 'kg') {
      if (selectedProduct.storeBagsList && selectedProduct.storeBagsList.length > 0) {
        return selectedProduct.storeBagsList;
      }
      if ((selectedProduct.bagsInStore || 0) > 0) {
        const count = selectedProduct.bagsInStore || 1;
        const total = selectedProduct.totalKgStore || 0;
        const per = count > 0 ? Math.round(total / count) : 25;
        return Array(count).fill(per);
      }
    } else {
      if (selectedProduct.storeBoxesList && selectedProduct.storeBoxesList.length > 0) {
        return selectedProduct.storeBoxesList;
      }
      if ((selectedProduct.boxesInStore || 0) > 0) {
        const count = selectedProduct.boxesInStore || 1;
        const total = selectedProduct.quantityStore || 0;
        const per = count > 0 ? Math.round(total / count) : 10;
        return Array(count).fill(per);
      }
    }
    return [];
  }, [selectedProduct]);

  // Filter models based on chosen product name
  const filteredProductsByName = Array.from(new Set(products.map((p) => p.name)));
  const matchingModels = products.filter((p) => p.name === selectedProduct?.name);

  // When product changes, reset defaults
  const handleProductChange = (productId: string) => {
    const p = products.find((item) => item.id === productId);
    setSelectedProductId(productId);
    setSelectedRollIndices([]);
    if (p) {
      setSelectedModel(p.model);
      setUnitType(p.unitType);
      setSellingPriceStr(String(p.salePrice || 0));
      setQuantityStr('1');
      setUnitsCount(1);
    }
  };

  // Toggle multi-roll selection
  const handleRollToggle = (idx: number) => {
    let next: number[];
    if (selectedRollIndices.includes(idx)) {
      next = selectedRollIndices.filter((i) => i !== idx);
    } else {
      next = [...selectedRollIndices, idx].sort((a, b) => a - b);
    }
    setSelectedRollIndices(next);

    if (next.length > 0) {
      const sumMeters = next.reduce((acc, i) => acc + (storeList[i] || 0), 0);
      setQuantityStr(String(Math.round(sumMeters * 100) / 100));
      setUnitsCount(next.length);
    } else {
      setQuantityStr('1');
      setUnitsCount(1);
    }
  };

  const handleSelectAllRolls = () => {
    if (!storeList.length) return;
    const all = storeList.map((_, i) => i);
    setSelectedRollIndices(all);
    const sumMeters = storeList.reduce((acc, v) => acc + v, 0);
    setQuantityStr(String(Math.round(sumMeters * 100) / 100));
    setUnitsCount(all.length);
  };

  const handleClearRollSelection = () => {
    setSelectedRollIndices([]);
    setQuantityStr('1');
    setUnitsCount(1);
  };

  // Add Item to Cart (supporting multi-rolls and decimal quantities)
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const parsedQty = parseDecimal(quantityStr);
    if (parsedQty <= 0) {
      alert("Iltimos, to'g'ri miqdor (metr/dona) kiriting!");
      return;
    }

    const rawSellingPrice = parseDecimal(sellingPriceStr);
    let priceInUzs = rawSellingPrice;
    if (currency === 'USD') {
      priceInUzs = Math.round(rawSellingPrice * settings.usdRate);
    }

    let newItemsToAdd: SaleItem[] = [];

    const selectedSum = Math.round(
      selectedRollIndices.reduce((sum, idx) => sum + (storeList[idx] || 0), 0) * 100
    ) / 100;

    // Case 1: Multiple specific rolls selected and user is selling full selected rolls
    if (selectedRollIndices.length > 1 && Math.abs(parsedQty - selectedSum) < 0.001) {
      newItemsToAdd = selectedRollIndices.map((idx) => {
        const rollLen = storeList[idx] || 0;
        const totalAmount = Math.round(priceInUzs * rollLen);
        return {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          model: selectedModel || selectedProduct.model,
          unitType: selectedProduct.unitType,
          quantity: rollLen,
          unitsCount: 1,
          selectedRollIndex: idx,
          selectedRollsInfo: `${idx + 1}-${selectedProduct.unitType === 'metr' ? 'rulon' : selectedProduct.unitType === 'kg' ? 'qop' : 'karobka'} (${rollLen} ${selectedProduct.unitType})`,
          costPrice: selectedProduct.costPrice,
          salePrice: priceInUzs,
          currency,
          salePriceUsd: currency === 'USD' ? rawSellingPrice : rawSellingPrice / settings.usdRate,
          totalAmountUzs: totalAmount,
        };
      });
    }
    // Case 2: Multiple specific rolls selected with a custom cut quantity
    else if (selectedRollIndices.length > 1) {
      const totalAmount = Math.round(priceInUzs * parsedQty);
      const rollsDesc = selectedRollIndices.map((i) => `${i + 1}-rulon (${storeList[i]}m)`).join(', ');
      newItemsToAdd = [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          model: selectedModel || selectedProduct.model,
          unitType: selectedProduct.unitType,
          quantity: parsedQty,
          unitsCount: selectedRollIndices.length,
          selectedRollIndices: [...selectedRollIndices],
          selectedRollsInfo: `Tanlangan: ${rollsDesc}`,
          costPrice: selectedProduct.costPrice,
          salePrice: priceInUzs,
          currency,
          salePriceUsd: currency === 'USD' ? rawSellingPrice : rawSellingPrice / settings.usdRate,
          totalAmountUzs: totalAmount,
        },
      ];
    }
    // Case 3: Exactly 1 roll selected
    else if (selectedRollIndices.length === 1) {
      const idx = selectedRollIndices[0];
      const totalAmount = Math.round(priceInUzs * parsedQty);
      newItemsToAdd = [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          model: selectedModel || selectedProduct.model,
          unitType: selectedProduct.unitType,
          quantity: parsedQty,
          unitsCount: 1,
          selectedRollIndex: idx,
          selectedRollsInfo: `${idx + 1}-${selectedProduct.unitType === 'metr' ? 'rulon' : selectedProduct.unitType === 'kg' ? 'qop' : 'karobka'} (${storeList[idx]} ${selectedProduct.unitType})`,
          costPrice: selectedProduct.costPrice,
          salePrice: priceInUzs,
          currency,
          salePriceUsd: currency === 'USD' ? rawSellingPrice : rawSellingPrice / settings.usdRate,
          totalAmountUzs: totalAmount,
        },
      ];
    }
    // Case 4: No roll selected (general item)
    else {
      const totalAmount = Math.round(priceInUzs * parsedQty);
      newItemsToAdd = [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          model: selectedModel || selectedProduct.model,
          unitType: selectedProduct.unitType,
          quantity: parsedQty,
          unitsCount,
          costPrice: selectedProduct.costPrice,
          salePrice: priceInUzs,
          currency,
          salePriceUsd: currency === 'USD' ? rawSellingPrice : rawSellingPrice / settings.usdRate,
          totalAmountUzs: totalAmount,
        },
      ];
    }

    const updatedCart = [...cartItems, ...newItemsToAdd];
    setCartItems(updatedCart);

    // Auto-fill cash amount with total cart sum
    const newTotal = updatedCart.reduce((sum, item) => sum + item.totalAmountUzs, 0);
    setCashAmount(newTotal);
    setCardAmount(0);
    setNasiyaAmount(0);

    // Reset item input
    setSelectedProductId('');
    setSelectedRollIndices([]);
    setQuantityStr('1');
    setUnitsCount(1);
  };

  const handleRemoveFromCart = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    const newTotal = updatedCart.reduce((sum, item) => sum + item.totalAmountUzs, 0);
    setCashAmount(newTotal);
    setCardAmount(0);
    setNasiyaAmount(0);
  };

  const totalCartUzs = cartItems.reduce((sum, item) => sum + item.totalAmountUzs, 0);
  const totalCartUsd = totalCartUzs / (settings.usdRate || 12800);
  const totalCostUzs = cartItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);

  // Auto balance payments
  const handleCashChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    setCashAmount(cleanVal);

    if (nasiyaAmount > 0) {
      const remainingForCard = Math.max(0, totalCartUzs - cleanVal - nasiyaAmount);
      setCardAmount(remainingForCard);
    } else {
      // Auto-adjust Karta balance (so cash + card = total, no unwanted nasiya)
      const remainingForCard = Math.max(0, totalCartUzs - cleanVal);
      setCardAmount(remainingForCard);
      setNasiyaAmount(0);
    }
  };

  const handleCardChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    setCardAmount(cleanVal);

    if (nasiyaAmount > 0) {
      const remainingForCash = Math.max(0, totalCartUzs - cleanVal - nasiyaAmount);
      setCashAmount(remainingForCash);
    } else {
      // Auto-adjust Naqd balance (so card + cash = total, no unwanted nasiya)
      const remainingForCash = Math.max(0, totalCartUzs - cleanVal);
      setCashAmount(remainingForCash);
      setNasiyaAmount(0);
    }
  };

  const handleNasiyaChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    setNasiyaAmount(cleanVal);

    const remainingToPay = Math.max(0, totalCartUzs - cleanVal);
    if (cardAmount > 0 && cashAmount === 0) {
      setCardAmount(remainingToPay);
    } else if (cashAmount > 0 && cardAmount > 0) {
      if (cashAmount >= remainingToPay) {
        setCashAmount(remainingToPay);
        setCardAmount(0);
      } else {
        setCardAmount(remainingToPay - cashAmount);
      }
    } else {
      setCashAmount(remainingToPay);
      setCardAmount(0);
    }
  };

  // Submit & Save Sale
  const handleSaveSale = () => {
    if (cartItems.length === 0) {
      alert("Iltimos, kamida bitta tavar qo'shing!");
      return;
    }

    const paidSum = cashAmount + cardAmount + nasiyaAmount;
    if (Math.abs(paidSum - totalCartUzs) > 10) {
      alert("To'lovlar yig'indisi Jami Summag teng bo'lishi kerak!");
      return;
    }

    if (nasiyaAmount > 0 && !debtDueDate) {
      alert("Nasiya summasi kiritilganda, qaytarish sanasini belgilang!");
      return;
    }

    let pType: 'naqd' | 'karta' | 'nasiya' | 'aralash' = 'naqd';
    if (cashAmount === totalCartUzs) pType = 'naqd';
    else if (cardAmount === totalCartUzs) pType = 'karta';
    else if (nasiyaAmount === totalCartUzs) pType = 'nasiya';
    else pType = 'aralash';

    const effectiveCustomerName = customerName.trim() || 'Oddiy xaridor';

    const savedSale = addSale({
      date: new Date().toISOString(),
      customerName: effectiveCustomerName,
      customerRegion,
      customerPhone: customerPhone.trim() || undefined,
      items: cartItems,
      currencyRate: settings.usdRate,
      totalCostUzs,
      totalAmountUzs: totalCartUzs,
      totalAmountUsd: totalCartUsd,
      cashAmount,
      cardAmount,
      nasiyaAmount,
      paymentType: pType,
      debtDueDate: nasiyaAmount > 0 ? debtDueDate : undefined,
      cashierName: currentUser?.name || 'Kassir',
      sendTelegram: sendTelegramNotification,
    });

    // Automatically prompt receipt
    onOpenReceiptModal?.(savedSale);

    // Clear form
    setCustomerName('');
    setCustomerPhone('');
    setCartItems([]);
    setCashAmount(0);
    setCardAmount(0);
    setNasiyaAmount(0);
    setDebtDueDate('');
    alert(t.sale_success);
  };

  // Filtered sales history
  const filteredSalesHistory = sales.filter(
    (s) =>
      s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.saleNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerPhone.includes(historySearch)
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* TOP CONTROLS: DOLLAR EXCHANGE RATE SETTER & NEW SALE TRIGGER */}
      <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2.5 transition-colors">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-500">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{t.sotuv} Bo'limi</h2>
          </div>
        </div>

        {/* Dollar Rate Setter & Form Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setShowUsdModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>1$ = {settings.usdRate?.toLocaleString()} UZS</span>
          </button>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs border-b-4 border-amber-700 shadow-md shadow-amber-500/20 transition-all active:translate-y-1 active:border-b-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFormOpen ? t.close : t.new_sale}</span>
          </button>
        </div>

      </div>

      {/* NEW SALE FORM / WIZARD */}
      {isFormOpen && (
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/30 shadow-md space-y-4 sm:space-y-5 transition-colors">
          
          {/* STEP 1: CUSTOMER DETAILS */}
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. {t.customer_info}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.customer_name} <span className="text-slate-400 font-normal">(ixtiyoriy)</span></label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Mijoz ismi (kiritilmasa: Oddiy xaridor)"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.select_region}</label>
                <select
                  value={customerRegion}
                  onChange={(e) => setCustomerRegion(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {regionsUzbekistan.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.phone_number}</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PRODUCT SELECTION & UNITS */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[11px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>2. {t.product_selection}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Barcode Skaner</span>
              </button>
            </div>

            {selectedProduct && (
              <div className="mb-3 space-y-2">
                {/* Main Product Info & Total Store Stock */}
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {selectedProduct.name} ({selectedProduct.model})
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium">
                        <span>
                          Do'konda mavjud: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">{selectedProduct.totalMetersStore || selectedProduct.totalKgStore || selectedProduct.quantityStore || 0} {selectedProduct.unitType}</strong>
                        </span>
                        {storeList.length > 0 && (
                          <span className="text-slate-500 font-bold">
                            ({storeList.length} ta {selectedProduct.unitType === 'metr' ? 'rulon' : selectedProduct.unitType === 'kg' ? 'qop' : 'karobka'})
                          </span>
                        )}
                        {selectedProduct.barcode && (
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold hidden sm:inline">[{selectedProduct.barcode}]</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Sotish narxi</div>
                    <div className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400">
                      {parseDecimal(sellingPriceStr).toLocaleString()} {currency === 'UZS' ? 'UZS' : 'USD'}
                    </div>
                  </div>
                </div>

                {/* Individual Roll / Container Picker with Multi-Select */}
                {storeList.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-500" />
                        Tanlang: Qaysi {selectedProduct.unitType === 'metr' ? 'rulon(lar)' : selectedProduct.unitType === 'kg' ? 'qop(lar)' : 'karobka(lar)'} sotiladi? (Bir nechta tanlash mumkin):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllRolls}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/30 transition-all active:scale-95"
                        >
                          Barchasini tanlash ({storeList.length} ta)
                        </button>
                        {selectedRollIndices.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearRollSelection}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-500 font-bold transition-all"
                          >
                            Tozalash
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Container Badges with Multi-Select Toggle */}
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      {storeList.map((size, idx) => {
                        const isSelected = selectedRollIndices.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRollToggle(idx)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 select-none active:scale-95 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-105'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-500/50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {isSelected ? '✓' : idx + 1}
                            </span>
                            <span>{idx + 1}-{selectedProduct.unitType === 'metr' ? 'rulon' : selectedProduct.unitType === 'kg' ? 'qop' : 'karobka'}:</span>
                            <strong className={isSelected ? 'text-slate-950 font-black' : 'text-emerald-600 dark:text-emerald-400 font-black'}>
                              {size} {selectedProduct.unitType}
                            </strong>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dynamic Auto Calculation & Selection Summary */}
                    {selectedRollIndices.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px]">
                              {selectedRollIndices.length} ta tanlandi
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Rulonlar: {selectedRollIndices.map((i) => `${i + 1}-rulon (${storeList[i]}m)`).join(' + ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Jami tanlangan: </span>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-300">
                              {Math.round(selectedRollIndices.reduce((acc, i) => acc + (storeList[i] || 0), 0) * 100) / 100} {selectedProduct.unitType}
                            </span>
                          </div>
                        </div>

                        {/* Single roll cut preview */}
                        {selectedRollIndices.length === 1 && storeList[selectedRollIndices[0]] !== undefined && (
                          <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Scissors className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>
                                {selectedRollIndices[0] + 1}-rulon ({storeList[selectedRollIndices[0]]} {selectedProduct.unitType}) dan <strong>{quantityStr || '0'} {selectedProduct.unitType}</strong> qirqilganda:
                              </span>
                            </div>
                            <div>
                              {storeList[selectedRollIndices[0]] - parseDecimal(quantityStr) >= 0 ? (
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-extrabold inline-block">
                                  {Math.round((storeList[selectedRollIndices[0]] - parseDecimal(quantityStr)) * 100) / 100} {selectedProduct.unitType} qoladi
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 font-extrabold inline-block">
                                  Rulon tugaydi! ({Math.abs(Math.round((storeList[selectedRollIndices[0]] - parseDecimal(quantityStr)) * 100) / 100)} {selectedProduct.unitType} keyingi rulondan qirqiladi)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
              
              {/* Product Select - spans 2 cols on mobile */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.product_name}</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 truncate"
                >
                  <option value="">-- Tanlang --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.model})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity input based on unit type - accepts decimal like 12.5 or 10.3 */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Soni / Metr ({selectedProduct?.unitType || 'Dona'})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityStr}
                  placeholder="12.5 yoki 10.3"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === '') {
                      setQuantityStr(val);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Rolls / Bags / Boxes Count */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
                  {selectedProduct?.unitType === 'metr'
                    ? 'Rulon soni'
                    : selectedProduct?.unitType === 'kg'
                    ? 'Qop soni'
                    : 'Karopka soni'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitsCount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setUnitsCount(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Selling price + Currency toggle */}
              <div className="col-span-1 sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{t.selling_price}</label>
                  <button
                    type="button"
                    onClick={() => setCurrency(currency === 'UZS' ? 'USD' : 'UZS')}
                    className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0"
                  >
                    {currency === 'UZS' ? 'So\'m' : '$ USD'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sellingPriceStr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === '') {
                      setSellingPriceStr(val);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Add Button */}
              <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedProductId || parseDecimal(quantityStr) <= 0}
                  className="w-full py-1.5 sm:py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition-all shadow-sm active:scale-95"
                >
                  + {t.add_item}
                </button>
              </div>

            </div>

            {/* Product stock hint */}
            {selectedProduct && (
              <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-300 font-medium truncate">
                Tannarxi: {selectedProduct.costPrice.toLocaleString()} UZS | Ombor: {selectedProduct.totalMetersWarehouse || selectedProduct.totalKgWarehouse || selectedProduct.quantityWarehouse || 0} {selectedProduct.unitType} | Do'kon: {selectedProduct.totalMetersStore || selectedProduct.totalKgStore || selectedProduct.quantityStore || 0} {selectedProduct.unitType}
              </div>
            )}
          </div>

          {/* CART ITEMS TABLE / MOBILE CARDS */}
          {cartItems.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">Savatdagi Tovarlar ({cartItems.length} ta):</div>
              <div className="space-y-2">
                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{item.productName}</span>
                        <span className="text-slate-400 font-normal">({item.model})</span>
                        {item.selectedRollsInfo ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-extrabold">
                            {item.selectedRollsInfo}
                          </span>
                        ) : item.selectedRollIndex !== undefined ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-extrabold">
                            #{item.selectedRollIndex + 1} {item.unitType === 'metr' ? 'rulon' : item.unitType === 'kg' ? 'qop' : 'karobka'}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.quantity} {item.unitType} × {item.salePrice.toLocaleString()} UZS
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                        {item.totalAmountUzs.toLocaleString()} UZS
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT BREAKDOWN (NAQD, KARTA, NASIYA SPLIT) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>3. {t.payment_split}</span>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">JAMI SUMMA:</div>
                <div className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {totalCartUzs.toLocaleString()} UZS
                </div>
              </div>
            </div>

            {/* Quick Payment Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setCashAmount(totalCartUzs);
                  setCardAmount(0);
                  setNasiyaAmount(0);
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold transition-all"
              >
                100% Naqd
              </button>

              <button
                type="button"
                onClick={() => {
                  setCardAmount(totalCartUzs);
                  setCashAmount(0);
                  setNasiyaAmount(0);
                }}
                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] sm:text-[11px] font-bold transition-all"
              >
                100% Karta
              </button>

              <button
                type="button"
                onClick={() => {
                  const half = Math.round(totalCartUzs / 2);
                  setCashAmount(half);
                  setCardAmount(totalCartUzs - half);
                  setNasiyaAmount(0);
                }}
                className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] sm:text-[11px] font-bold transition-all"
              >
                50/50 Naqd + Karta
              </button>

              <button
                type="button"
                onClick={() => {
                  setNasiyaAmount(totalCartUzs);
                  setCashAmount(0);
                  setCardAmount(0);
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] sm:text-[11px] font-bold transition-all"
              >
                To'liq Nasiya
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Naqd */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-0.5">{t.naqd} Summa (UZS)</label>
                <input
                  type="number"
                  value={cashAmount || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Karta */}
              <div>
                <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">{t.karta} Summa (UZS)</label>
                <input
                  type="number"
                  value={cardAmount || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleCardChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Nasiya (Debt) */}
              <div>
                <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-0.5">{t.nasiya} Summa (UZS)</label>
                <input
                  type="number"
                  value={nasiyaAmount || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNasiyaChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

            </div>

            {/* Debt Due Date selection if Nasiya > 0 */}
            {nasiyaAmount > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>Qaytarish sanasi:</span>
                </div>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-rose-500/50 text-xs text-amber-600 dark:text-amber-400 font-bold focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* TELEGRAM BOT NOTIFICATION TOGGLE & SAVE BUTTON */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/30 cursor-pointer transition-all select-none">
              <input
                type="checkbox"
                checked={sendTelegramNotification}
                onChange={(e) => setSendTelegramNotification(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 cursor-pointer accent-sky-500"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-sky-200 truncate">
                  Telegram botga xabar (SMS) jo'natish
                </span>
              </div>
            </label>

            <button
              onClick={handleSaveSale}
              disabled={cartItems.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{t.save_sale}</span>
            </button>
          </div>

        </div>
      )}

      {/* SALES HISTORY SEARCH & COMPACT RESPONSIVE LIST */}
      <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 transition-colors">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Sotuvlar Tarixi</span>
          </h3>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Mijoz yoki chek №..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* MOBILE CARDS VIEW (VISIBLE ON MOBILE ONLY) */}
        <div className="sm:hidden space-y-2">
          {filteredSalesHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Sotuvlar tarixi topilmadi
            </div>
          ) : (
            filteredSalesHistory.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-500">{s.saleNumber}</div>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-amber-300">
                    {s.paymentType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{s.customerName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(s.date).toLocaleDateString('uz-UZ')}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {s.totalAmountUzs.toLocaleString()} UZS
                    </div>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {s.isReturned ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <RotateCcw className="w-2.5 h-2.5" /> Qaytarilgan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenReturnModal(s)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px] inline-flex items-center gap-1 border border-rose-500/30 active:scale-95 transition-all"
                          title="Sotuvni Qaytarib Olish (Vozvrat)"
                        >
                          <RotateCcw className="w-3 h-3 text-rose-500" />
                          <span>Vozvrat</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenReceiptModal?.(s)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] inline-flex items-center gap-1 border border-amber-500/30"
                      >
                        <Printer className="w-3 h-3 text-amber-500" />
                        <span>Chek</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (HIDDEN ON MOBILE) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Chek №</th>
                <th className="p-3">Sana</th>
                <th className="p-3">Mijoz</th>
                <th className="p-3">To'lov Turi</th>
                <th className="p-3">Jami Summa</th>
                <th className="p-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredSalesHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Sotuvlar tarixi topilmadi
                  </td>
                </tr>
              ) : (
                filteredSalesHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-amber-500">{s.saleNumber}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(s.date).toLocaleString('uz-UZ')}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.customerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.customerRegion}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-300">
                        {s.paymentType}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {s.totalAmountUzs.toLocaleString()} UZS
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.isReturned ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Qaytarilgan (Vozvrat)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReturnModal(s)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1.5 border border-rose-500/30 active:scale-95 transition-all"
                            title="Sotuvni qaytarib olish (Vozvrat)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                            <span>Vozvrat</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenReceiptModal?.(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chek</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* DOLLAR EXCHANGE RATE MODAL */}
      {showUsdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Dollar Kursini Sozlash</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Sotuvda avtomatik hisoblash uchun AQSH dollari exchange kursini kiriting.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">1 USD = ? UZS</label>
              <input
                type="number"
                value={tempUsdRate}
                onChange={(e) => setTempUsdRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowUsdModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  updateSettings({ usdRate: tempUsdRate });
                  setShowUsdModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      {showScannerModal && (
        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={handleBarcodeScanned}
        />
      )}

      {/* RETURN SALE MODAL (VOZVRAT MODAL) */}
      {returnModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm sm:text-base">
                <RotateCcw className="w-5 h-5 text-rose-500" />
                <span>Sotuvni Qaytarib Olish (Vozvrat)</span>
              </div>
              <button
                onClick={() => setReturnModalSale(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info summary box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Chek raqami:</span>
                <span className="font-extrabold text-amber-400">#{returnModalSale.saleNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mijoz:</span>
                <span className="font-bold text-white">{returnModalSale.customerName} ({returnModalSale.customerRegion})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sotuv sanasi:</span>
                <span className="text-slate-300">{new Date(returnModalSale.date).toLocaleString('uz-UZ')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-300 font-bold">Jami Qaytariladigan Summa:</span>
                <span className="font-black text-rose-400 text-sm">{calculateTotalLiveRefund().toLocaleString()} UZS</span>
              </div>
            </div>

            {/* Items to be returned */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300">Qaytarilayotgan Tovar(lar)ni Tanlang:</label>
                <span className="text-[10px] text-slate-400">Metr va sonini kiritishingiz mumkin</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {returnModalSale.items.map((item) => {
                  const alreadyReturned = item.returnedQuantity || 0;
                  const maxReturnable = Math.max(0, item.quantity - alreadyReturned);
                  const st = returnItemsState[item.productId] || { selected: false, returnQty: 0 };
                  const isSelected = st.selected && maxReturnable > 0;
                  const currentReturnQty = isSelected ? st.returnQty : 0;
                  const itemTotalRefund = currentReturnQty * item.salePrice;

                  return (
                    <div
                      key={item.productId}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-rose-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            disabled={maxReturnable <= 0}
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReturnItemsState((prev) => ({
                                ...prev,
                                [item.productId]: {
                                  selected: checked,
                                  returnQty: checked ? (prev[item.productId]?.returnQty || maxReturnable) : 0,
                                },
                              }));
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
                          />
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{item.productName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 border border-slate-700 text-amber-400">
                                {item.unitType}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Model: <strong className="text-slate-300">{item.model || 'Standart'}</strong> | Narxi: <strong className="text-amber-300">{(item.salePrice || 0).toLocaleString()} UZS / {item.unitType}</strong>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                              <span>Xarid qilingan: <strong className="text-white">{item.quantity} {item.unitType}</strong></span>
                              {alreadyReturned > 0 && (
                                <span className="text-rose-400 font-semibold">(Ilgari vozvrat qilingan: {alreadyReturned} {item.unitType})</span>
                              )}
                            </div>
                          </div>
                        </label>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-400 font-bold">Summa</div>
                          <div className="text-xs font-black text-rose-400">
                            {itemTotalRefund.toLocaleString()} UZS
                          </div>
                        </div>
                      </div>

                      {/* Quantity input if selected */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-bold text-slate-300">
                            Qaytariladigan {item.unitType === 'metr' ? 'Metr' : item.unitType === 'kg' ? 'Kg' : 'Miqdor'}:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={item.unitType === 'metr' || item.unitType === 'kg' ? '0.1' : '1'}
                              min="0"
                              max={maxReturnable}
                              value={st.returnQty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const clampedVal = Math.min(Math.max(0, val), maxReturnable);
                                setReturnItemsState((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    selected: true,
                                    returnQty: clampedVal,
                                  },
                                }));
                              }}
                              className="w-24 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-black text-xs text-rose-400 text-center focus:outline-none focus:border-rose-500"
                            />
                            <span className="text-xs font-bold text-slate-400">{item.unitType}</span>

                            <button
                              type="button"
                              onClick={() => {
                                setReturnItemsState((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    selected: true,
                                    returnQty: maxReturnable,
                                  },
                                }));
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] border border-slate-700"
                            >
                              Maks ({maxReturnable})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">Qaytarish Sababi:</label>
              <select
                value={returnReasonInput}
                onChange={(e) => setReturnReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Mijoz xohishi bilan (Mos kelmadi)">Mijoz xohishi bilan (Mos kelmadi / Shunchaki qaytardi)</option>
                <option value="Nuqsonli tovar (Brak / Defekt)">Nuqsonli tovar (Brak / Defekt bor)</option>
                <option value="Boshqa o'lchamga almashtirish">Boshqa o'lchamga almashtirish uchun</option>
                <option value="Kassir xatosi (Adashib sotilgan)">Kassir xatosi (Noto'g'ri chek urilgan)</option>
              </select>
            </div>

            {/* Notice alert */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                Eslatma: Qaytarish tasdiqlansa, kiritilgan metr/miqdordagi tovarlar avtomatik tarzda do'kon omboriga qayta tiklanadi va mijozning qarzi hamda xarid summasi hisoblab chiqiladi.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setReturnModalSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const returnPayload = Object.entries(returnItemsState)
                    .filter(([_, val]) => val.selected && val.returnQty > 0)
                    .map(([pId, val]) => ({ productId: pId, returnQuantity: val.returnQty }));

                  if (returnPayload.length === 0) {
                    alert("Iltimos, qaytariladigan kamida bitta tovar va uning miqdorini/metrini tanlang!");
                    return;
                  }

                  returnSale(returnModalSale.id, returnPayload, returnReasonInput);
                  setReturnModalSale(null);
                  alert(`Sotuv #${returnModalSale.saleNumber} bo'yicha vozvrat muvaffaqiyatli amalga oshirildi! Tovarlar omborga qaytarildi.`);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Vozvrat Qilish ({calculateTotalLiveRefund().toLocaleString()} UZS)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
