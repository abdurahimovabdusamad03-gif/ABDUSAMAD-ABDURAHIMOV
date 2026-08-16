import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Keyboard, Check, Barcode, Upload, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (barcode: string) => void;
  onScanSuccess?: (barcode: string) => void;
  title?: string;
  allowGenerate?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  onScanSuccess,
  title = "Shtrix-kodni skanerlash",
  allowGenerate = true,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(false);
  const readerElementId = 'barcode-scanner-viewport';

  const triggerScanCallback = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    if (onScanSuccess) onScanSuccess(cleanCode);
    if (onScan) onScan(cleanCode);
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!isOpen) {
      stopScanner();
      setManualCode('');
      setErrorMsg(null);
      return;
    }

    // Auto-focus input for USB barcode scanners
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);

    // Delay camera start slightly to ensure DOM element is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    if (!isMountedRef.current) return;

    const el = document.getElementById(readerElementId);
    if (!el) {
      setErrorMsg("Kamera oynasini yuklashda xatolik. Shtrix-kodni qo'lda kiriting.");
      return;
    }

    try {
      setErrorMsg(null);
      setIsScanning(true);

      // Clean up previous instance safely
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }

      const instance = new Html5Qrcode(readerElementId);
      scannerRef.current = instance;

      // Try starting camera with facingMode "environment"
      await instance.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          if (decodedText && isMountedRef.current) {
            triggerScanCallback(decodedText);
            stopScanner();
            onClose();
          }
        },
        () => {
          // Frame scan failure - ignore per frame
        }
      );

      if (isMountedRef.current) {
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera scanner exception:', err);
      if (isMountedRef.current) {
        setIsCameraActive(false);
        setIsScanning(false);
        setErrorMsg("Kameradan foydalanib bo'lmadi (ruxsat berilmagan yoki brauzer cheklovi). Shtrix-kodni qo'lda kiriting yoki fayl yuklang.");
      }
    }
  };

  const stopScanner = async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;

    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      }
    }

    if (isMountedRef.current) {
      setIsCameraActive(false);
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      triggerScanCallback(manualCode.trim());
      stopScanner();
      onClose();
    }
  };

  const handleGenerateBarcode = () => {
    // Generate a unique 12-digit code: 478 (Uzbekistan prefix) + 9 random digits
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const generated = `478${randomDigits}`;
    triggerScanCallback(generated);
    stopScanner();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode(readerElementId);
      const result = await html5Qrcode.scanFile(file, true);
      if (result) {
        triggerScanCallback(result);
        stopScanner();
        onClose();
      }
    } catch (err) {
      alert("Rasmdan shtrix-kod aniqlanmadi. Iltimos qaytadan urinib ko'ring yoki qo'lda kiriting.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Kamerani shtrix-kodga qarating yoki qo'lda kiriting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[220px]">
          <div id={readerElementId} className="w-full h-full min-h-[200px]" />

          {/* Overlay Box Animation when active */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[140px] border-2 border-amber-500 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan" />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 text-center text-amber-200 text-xs font-semibold bg-amber-950/60 border border-amber-800/60 rounded-2xl m-4 space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Kamera Rejimi Cheklangan</span>
              </div>
              <p className="text-[11px] text-slate-300">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 space-y-3 bg-slate-900">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Shtrix-kodni yozing yoki skanerlang..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Qabul qilish</span>
            </button>
          </form>

          {/* Alternative methods: File upload or Auto Generate */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Rasm Yuklash</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {allowGenerate && (
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto Kod Yaratish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

