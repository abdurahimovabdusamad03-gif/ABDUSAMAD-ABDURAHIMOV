import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Product, SystemSettings } from '../types';
import { X, Printer, Barcode, Check, Settings2, RefreshCw, Layers } from 'lucide-react';
import { useERP } from '../context/ERPContext';

interface BarcodePrintModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeSvg: React.FC<{
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}> = ({ value, width = 1.4, height = 30, displayValue = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 10,
          margin: 1,
          fontOptions: 'bold',
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} className="max-w-full mx-auto" />;
};

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  products,
  isOpen,
  onClose,
}) => {
  const { settings, updateProduct } = useERP();

  // Print Mode: 'per_unit' (each roll/box/bag gets distinct sticker with exact meter) | 'copies' (custom copies)
  const [printMode, setPrintMode] = useState<'per_unit' | 'copies'>('per_unit');
  const [copiesCount, setCopiesCount] = useState<number>(1);

  // Label Config State (overrides or default from settings)
  const [labelWidth, setLabelWidth] = useState<'58x40mm' | '50x30mm' | '40x30mm' | '58x60mm'>(
    settings.barcodeLabelWidth || '58x40mm'
  );
  const [showStoreName, setShowStoreName] = useState<boolean>(
    settings.barcodeShowStoreName !== false
  );
  const [showProductName, setShowProductName] = useState<boolean>(
    settings.barcodeShowProductName !== false
  );
  const [showModel, setShowModel] = useState<boolean>(settings.barcodeShowModel !== false);
  const [showPrice, setShowPrice] = useState<boolean>(settings.barcodeShowPrice !== false);
  const [showQuantityMeters, setShowQuantityMeters] = useState<boolean>(
    settings.barcodeShowQuantityMeters !== false
  );
  const [showCodeNumber, setShowCodeNumber] = useState<boolean>(
    settings.barcodeShowCodeNumber !== false
  );

  // Auto-generate missing barcodes for products
  useEffect(() => {
    products.forEach((p) => {
      if (!p.barcode) {
        const autoCode = `478${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        updateProduct(p.id, { barcode: autoCode });
      }
    });
  }, [products]);

  if (!isOpen || products.length === 0) return null;

  // Build the list of sticker items to render
  interface StickerItem {
    id: string;
    product: Product;
    unitLabel?: string; // e.g. "Rulon #1"
    unitValue?: string; // e.g. "29 metr"
    barcodeValue: string;
  }

  const stickerItems: StickerItem[] = [];

  products.forEach((p) => {
    const code = p.barcode || `478${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    if (printMode === 'per_unit') {
      if (p.unitType === 'metr') {
        const rollList =
          p.storeRollsList && p.storeRollsList.length > 0
            ? p.storeRollsList
            : p.rollsInStore && p.rollsInStore > 0
            ? Array(p.rollsInStore).fill(p.metersPerRoll || 50)
            : p.warehouseRollsList && p.warehouseRollsList.length > 0
            ? p.warehouseRollsList
            : [];

        if (rollList.length > 0) {
          rollList.forEach((meters, idx) => {
            stickerItems.push({
              id: `${p.id}-roll-${idx}`,
              product: p,
              unitLabel: `Rulon #${idx + 1}`,
              unitValue: `${meters} metr`,
              barcodeValue: code,
            });
          });
        } else {
          // fallback if no rolls list
          stickerItems.push({
            id: `${p.id}-single`,
            product: p,
            unitValue: `${p.totalMetersStore || p.totalMetersWarehouse || 0} metr`,
            barcodeValue: code,
          });
        }
      } else if (p.unitType === 'kg') {
        const bagList =
          p.storeBagsList && p.storeBagsList.length > 0
            ? p.storeBagsList
            : p.bagsInStore && p.bagsInStore > 0
            ? Array(p.bagsInStore).fill(p.kgPerBag || 25)
            : p.warehouseBagsList && p.warehouseBagsList.length > 0
            ? p.warehouseBagsList
            : [];

        if (bagList.length > 0) {
          bagList.forEach((kg, idx) => {
            stickerItems.push({
              id: `${p.id}-bag-${idx}`,
              product: p,
              unitLabel: `Qop #${idx + 1}`,
              unitValue: `${kg} kg`,
              barcodeValue: code,
            });
          });
        } else {
          stickerItems.push({
            id: `${p.id}-single`,
            product: p,
            unitValue: `${p.totalKgStore || p.totalKgWarehouse || 0} kg`,
            barcodeValue: code,
          });
        }
      } else {
        // dona
        const boxList =
          p.storeBoxesList && p.storeBoxesList.length > 0
            ? p.storeBoxesList
            : p.boxesInStore && p.boxesInStore > 0
            ? Array(p.boxesInStore).fill(p.itemsPerBox || 10)
            : [];

        if (boxList.length > 0) {
          boxList.forEach((dona, idx) => {
            stickerItems.push({
              id: `${p.id}-box-${idx}`,
              product: p,
              unitLabel: `Karobka #${idx + 1}`,
              unitValue: `${dona} dona`,
              barcodeValue: code,
            });
          });
        } else {
          // single copy or total store count
          stickerItems.push({
            id: `${p.id}-single`,
            product: p,
            unitValue: `${p.quantityStore || p.quantityWarehouse || 1} dona`,
            barcodeValue: code,
          });
        }
      }
    } else {
      // Copies mode
      for (let c = 0; c < Math.max(1, copiesCount); c++) {
        stickerItems.push({
          id: `${p.id}-copy-${c}`,
          product: p,
          unitValue:
            p.unitType === 'metr'
              ? `${p.metersPerRoll || 50} metr`
              : p.unitType === 'kg'
              ? `${p.kgPerBag || 25} kg`
              : '1 dona',
          barcodeValue: code,
        });
      }
    }
  });

  const handlePrint = () => {
    window.print();
  };

  // Dimensions css rules
  let labelWidthPx = 'w-[200px]';
  let labelHeightPx = 'min-h-[140px]';
  if (labelWidth === '50x30mm') {
    labelWidthPx = 'w-[180px]';
    labelHeightPx = 'min-h-[110px]';
  } else if (labelWidth === '40x30mm') {
    labelWidthPx = 'w-[150px]';
    labelHeightPx = 'min-h-[105px]';
  } else if (labelWidth === '58x60mm') {
    labelWidthPx = 'w-[210px]';
    labelHeightPx = 'min-h-[180px]';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      {/* PRINT STYLESHEET */}
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: auto;
          }
          #root {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          #barcode-print-area, #barcode-print-area * {
            visibility: visible !important;
            display: block !important;
          }
          #barcode-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .barcode-sticker-card {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto 5mm auto !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Stiker & Barkod Chop Etish
              </h3>
              <p className="text-[10px] text-slate-400">
                {products.length === 1
                  ? `${products[0].name} (${products[0].model})`
                  : `${products.length} ta tovar tanlandi`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish ({stickerItems.length} Stiker)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs shrink-0">
          {/* Print Mode */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              Chiqarish Rejimi
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPrintMode('per_unit')}
                className={`py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                  printMode === 'per_unit'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Har Birlikka (Astatka)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('copies')}
                className={`py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                  printMode === 'copies'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nusxalar Bilan
              </button>
            </div>
          </div>

          {/* Copies count if mode is 'copies' */}
          {printMode === 'copies' ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Stikerlar Soni (Har biriga)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copiesCount}
                onChange={(e) => setCopiesCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-extrabold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Astatka Detallari
              </label>
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-medium truncate">
                Rulon/Qop/Karobka metr va soni avto aniqlanadi
              </div>
            </div>
          )}

          {/* Label Size */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              Stiker O'lchami
            </label>
            <select
              value={labelWidth}
              onChange={(e) => setLabelWidth(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="58x40mm">58 x 40 mm (Standart Termo)</option>
              <option value="50x30mm">50 x 30 mm (Kichik Kassa)</option>
              <option value="40x30mm">40 x 30 mm (Ixcham)</option>
              <option value="58x60mm">58 x 60 mm (Baland Stiker)</option>
            </select>
          </div>

          {/* Element Display Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => setShowStoreName(!showStoreName)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                showStoreName
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Do'kon
            </button>
            <button
              type="button"
              onClick={() => setShowProductName(!showProductName)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                showProductName
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Tovar Nomi
            </button>
            <button
              type="button"
              onClick={() => setShowModel(!showModel)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                showModel
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Model
            </button>
            <button
              type="button"
              onClick={() => setShowPrice(!showPrice)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                showPrice
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Narx
            </button>
            <button
              type="button"
              onClick={() => setShowQuantityMeters(!showQuantityMeters)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                showQuantityMeters
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Metr/Hajm
            </button>
          </div>
        </div>

        {/* LIVE STICKERS PREVIEW AREA */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 space-y-4">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Stikerlar Ko'rinishi ({stickerItems.length} ta tayyor)</span>
            <span className="text-[10px] text-amber-400 font-mono">O'lcham: {labelWidth}</span>
          </div>

          <div
            id="barcode-print-area"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center"
          >
            {stickerItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className={`barcode-sticker-card bg-white text-black p-2 font-sans text-center rounded shadow-md border border-slate-300 flex flex-col justify-between select-none ${labelWidthPx} ${labelHeightPx}`}
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
              >
                {/* Store Name Header */}
                {showStoreName && (
                  <div className="font-black text-[9px] uppercase tracking-wide border-b border-black/30 pb-0.5 text-ellipsis overflow-hidden whitespace-nowrap">
                    {settings.storeName || "DO'KON NOMI"}
                  </div>
                )}

                {/* Product Name & Model */}
                <div className="my-0.5 space-y-0.5">
                  {showProductName && (
                    <div className="font-extrabold text-[10px] leading-tight uppercase text-ellipsis overflow-hidden whitespace-nowrap">
                      {item.product.name}
                    </div>
                  )}
                  {showModel && (
                    <div className="font-bold text-[8px] text-gray-700 leading-none truncate">
                      Model: {item.product.model}
                    </div>
                  )}
                </div>

                {/* Meter / Unit Tag & Price */}
                <div className="flex items-center justify-between text-[9px] font-black border-t border-b border-black/20 my-0.5 py-0.5 px-1 bg-gray-50">
                  {showQuantityMeters && (
                    <span className="bg-black text-white px-1 py-0.2 rounded text-[8px] font-mono">
                      {item.unitLabel ? `${item.unitLabel}: ` : ''}
                      {item.unitValue || `${item.product.metersPerRoll || 50} m`}
                    </span>
                  )}
                  {showPrice && (
                    <span className="text-black font-extrabold text-[9px]">
                      {item.product.salePrice.toLocaleString()} UZS
                    </span>
                  )}
                </div>

                {/* Barcode SVG */}
                <div className="my-0.5 flex flex-col items-center justify-center overflow-hidden">
                  <BarcodeSvg
                    value={item.barcodeValue}
                    width={labelWidth === '40x30mm' ? 1.0 : 1.2}
                    height={labelWidth === '58x60mm' ? 40 : 25}
                    displayValue={showCodeNumber}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-slate-400">
            Termo-printer orqali stiker qog'oziga muvaffaqiyatli chiqarish uchun tayyor.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
