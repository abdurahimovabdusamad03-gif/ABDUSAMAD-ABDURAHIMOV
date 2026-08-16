import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 2200,
}) => {
  const [step, setStep] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Step 1: Squircle App Icon appears
    const t1 = setTimeout(() => setStep(1), 300);
    // Step 2: Orange Circle & Shopping Cart pop inside
    const t2 = setTimeout(() => setStep(2), 800);
    // Step 3: "ERP Master" text fades in below
    const t3 = setTimeout(() => setStep(3), 1300);
    // Step 4: Fade out splash overlay
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, minDuration - 400);

    // Finish callback
    const t5 = setTimeout(() => {
      if (onFinish) onFinish();
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [minDuration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#EAEBED] dark:bg-slate-950 transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* App Icon Box */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 bg-[#121316] rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-black/30 border border-slate-800 flex items-center justify-center transition-all duration-700 ${
            step >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          {/* Inner Orange Circle */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-inner transition-all duration-500 ${
              step >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          >
            {/* Shopping Cart Icon */}
            <ShoppingBag
              className={`w-10 h-10 sm:w-12 sm:h-12 text-slate-950 stroke-[2.5] transition-all duration-500 delay-100 ${
                step >= 2 ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-12'
              }`}
            />
          </div>
        </div>

        {/* Text ERP Master */}
        <div
          className={`text-center transition-all duration-700 ${
            step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            ERP Master
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Tizim yuklanmoqda...
          </p>
        </div>
      </div>
    </div>
  );
};
