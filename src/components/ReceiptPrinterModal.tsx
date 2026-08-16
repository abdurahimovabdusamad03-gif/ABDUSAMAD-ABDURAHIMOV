import React from 'react';
import { createPortal } from 'react-dom';
import { useERP } from '../context/ERPContext';
import { Sale } from '../types';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptPrinterModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptPrinterModal: React.FC<ReceiptPrinterModalProps> = ({ sale, onClose }) => {
  const { settings } = useERP();

  const handlePrint = () => {
    window.print();
  };

  const isWidth58 = settings.xprinterPaperWidth === '58mm';
  const telegramUrl = settings.telegramChannelLink || 'https://t.me/+KexajQhWkoBmYTA6';

  const renderReceiptContent = () => (
    <div
      id="printable-receipt"
      className={`bg-white text-black p-3 font-mono ${
        isWidth58 ? 'w-[240px]' : 'w-[320px]'
      }`}
      style={{ color: '#000', backgroundColor: '#fff' }}
    >
      {/* Store Header & Logo */}
      <div className="text-center mb-2.5 border-b-2 border-dashed border-black pb-2">
        {settings.showLogoOnReceipt && settings.storeLogoUrl && (
          <img
            src={settings.storeLogoUrl}
            alt="Logo"
            className="w-14 h-14 object-contain mx-auto mb-1"
          />
        )}
        <div className="font-black text-base uppercase tracking-wide leading-tight">
          {settings.receiptHeader || settings.storeName}
        </div>
        {settings.receiptAddress && (
          <div className="text-xs font-bold text-black mt-1 leading-snug">{settings.receiptAddress}</div>
        )}
        {settings.receiptPhone && (
          <div className="text-xs font-bold text-black leading-snug">
            Tel: {settings.receiptPhone}
            {settings.receiptPhone2 ? ` | ${settings.receiptPhone2}` : ''}
          </div>
        )}
      </div>

      {/* Invoice Meta */}
      <div className="mb-2.5 text-xs space-y-1 border-b-2 border-dashed border-black pb-2">
        <div className="flex justify-between">
          <span className="font-extrabold">CHEK №:</span>
          <span className="font-black text-sm">{sale.saleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-extrabold">Sana:</span>
          <span className="font-bold">{new Date(sale.date).toLocaleString('uz-UZ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-extrabold">Mijoz:</span>
          <span className="font-black">{sale.customerName}</span>
        </div>
        {sale.customerRegion && (
          <div className="flex justify-between">
            <span className="font-extrabold">Viloyat:</span>
            <span className="font-bold">{sale.customerRegion}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-extrabold">Kassir:</span>
          <span className="font-bold">{sale.cashierName}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs mb-2.5 border-b-2 border-dashed border-black pb-2">
        <thead>
          <tr className="border-b-2 border-black font-black uppercase text-xs">
            <th className="py-1">Tavar</th>
            <th className="text-right py-1">Soni</th>
            <th className="text-right py-1">Summa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/30">
          {sale.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 pr-1 font-extrabold text-xs leading-tight">
                {item.productName} <br />
                {item.model && (
                  <span className="text-[11px] font-bold text-gray-800">({item.model})</span>
                )}
              </td>
              <td className="text-right py-1 font-black text-xs whitespace-nowrap">
                {item.quantity} {item.unitType}
              </td>
              <td className="text-right py-1 font-black text-xs whitespace-nowrap">
                {item.totalAmountUzs.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Totals */}
      <div className="space-y-1 text-xs mb-2.5 border-b-2 border-dashed border-black pb-2">
        <div className="flex justify-between font-black text-sm border-b-2 border-black pb-1">
          <span>JAMI SUMMA:</span>
          <span>{sale.totalAmountUzs.toLocaleString()} UZS</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-900">
          <span>Dollar qiymati:</span>
          <span className="font-black text-xs">${sale.totalAmountUsd.toFixed(2)}</span>
        </div>
        <div className="pt-1 text-xs space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>Naqd to'landi:</span>
            <span className="font-black">{sale.cashAmount.toLocaleString()} UZS</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Karta to'landi:</span>
            <span className="font-black">{sale.cardAmount.toLocaleString()} UZS</span>
          </div>
          {sale.nasiyaAmount > 0 && (
            <div className="flex justify-between font-black text-xs text-black">
              <span>NASIYA (QARZ):</span>
              <span>{sale.nasiyaAmount.toLocaleString()} UZS</span>
            </div>
          )}
          {sale.debtDueDate && sale.nasiyaAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-gray-900">
              <span>Qaytarish sanasi:</span>
              <span>{sale.debtDueDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Footer */}
      <div className="text-center text-xs space-y-0.5">
        <div className="font-black text-xs">{settings.receiptFooter || 'XARIDINGIZ UCHUN RAHMAT!'}</div>
        {settings.receiptCustomNote && (
          <div className="text-[11px] font-bold text-gray-900 italic">{settings.receiptCustomNote}</div>
        )}
      </div>

      {/* Telegram QR Code Block */}
      {settings.showTelegramQrOnReceipt !== false && (
        <div className="flex flex-col items-center justify-center pt-2 mt-2 border-t-2 border-dashed border-black">
          <div className="p-1 bg-white border border-black rounded">
            <QRCodeSVG
              value={telegramUrl}
              size={isWidth58 ? 80 : 95}
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="text-[11px] font-black uppercase text-black mt-1 text-center tracking-tight">
            Telegram Kanalimizga A'zo Bo'ling!
          </div>
          <div className="text-[9px] font-bold text-gray-800 text-center tracking-tight">
            {telegramUrl}
          </div>
        </div>
      )}

      <div className="text-[9px] text-gray-600 font-bold text-center mt-1.5 border-t border-gray-300 pt-1">
        ERP Master System v2.5
      </div>
    </div>
  );

  return (
    <>
      {/* ON-SCREEN MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 my-8">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">XPrinter Chek Namunasi ({settings.xprinterPaperWidth})</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ON-SCREEN RECEIPT PREVIEW */}
          <div className="flex justify-center my-4 overflow-x-auto">
            {renderReceiptContent()}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Yopish
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish (Print)</span>
            </button>
          </div>

        </div>
      </div>

      {/* PRINT PORTAL ATTACHED DIRECTLY TO DOCUMENT.BODY */}
      {createPortal(
        <div id="print-root">
          <style>{`
            @media screen {
              #print-root {
                display: none !important;
              }
            }
            @media print {
              @page {
                margin: 0 !important;
                size: ${isWidth58 ? '58mm' : '80mm'} auto !important;
              }
              #root {
                display: none !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                width: ${isWidth58 ? '58mm' : '80mm'} !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
              }
              #print-root {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${isWidth58 ? '58mm' : '80mm'} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              #printable-receipt {
                display: block !important;
                width: ${isWidth58 ? '58mm' : '80mm'} !important;
                margin: 0 !important;
                padding: 1mm 2mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-size: 13px !important;
                line-height: 1.3 !important;
                box-shadow: none !important;
                border: none !important;
              }
              #printable-receipt tr, #printable-receipt tbody, #printable-receipt thead, #printable-receipt table {
                display: table !important;
                width: 100% !important;
              }
              #printable-receipt tr {
                display: table-row !important;
              }
              #printable-receipt td, #printable-receipt th {
                display: table-cell !important;
              }
              #printable-receipt .flex {
                display: flex !important;
              }
            }
          `}</style>
          {renderReceiptContent()}
        </div>,
        document.body
      )}
    </>
  );
};

