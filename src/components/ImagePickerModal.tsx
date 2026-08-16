import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Link, Upload, X, Check, Sparkles } from 'lucide-react';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  currentImage?: string;
}

const PRESET_IMAGES = [
  { name: 'Gilam', url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80' },
  { name: 'Parda', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Guruch', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Shakar / Un', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281313?auto=format&fit=crop&w=400&q=80' },
  { name: 'Elektr Asbob', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lampa', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kafel / Qurilish', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80' },
  { name: 'Mebel / Tovar', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' },
];

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImage,
}) => {
  const [selectedUrl, setSelectedUrl] = useState(currentImage || '');
  const [inputUrl, setInputUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setSelectedUrl(result);
          onSelectImage(result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setSelectedUrl(inputUrl.trim());
      onSelectImage(inputUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">Mahsulot rasmini tanlash</h3>
              <p className="text-[11px] text-slate-400">Kamera, fayl yoki internet havolasidan foydalaning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-slate-800 p-2 gap-2 bg-slate-900/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Fayl / Kamera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'preset' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Namuna Rasmlar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'url' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Link URL</span>
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-5">
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/30 text-center space-y-3">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Rasm yuklang yoki suratga oling</p>
                <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG yoki WEBP formatidagi rasmlar</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Rasm / Kamerani ochish</span>
              </button>
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto p-1">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelectImage(img.url);
                    onClose();
                  }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-700 hover:border-amber-500 aspect-square flex flex-col items-center justify-center transition-all hover:scale-105"
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate">{img.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Rasm internet manzili (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={!inputUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Rasmni saqlash</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
