import React, { useState } from 'react';
import { X, Heart, Mail, Copy, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { triggerHaptic } from '../utils/haptics';

interface AuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const t = translations[language].authorNotice;
  const email = 'msglitchapps@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(email);
      setCopied(true);
      triggerHaptic(10);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      onClick={() => {
        triggerHaptic(6);
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
              <Heart className="w-5 h-5 fill-rose-400/30 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {t.title || 'O autorovi'}
              </h2>
              <span className="text-[11px] text-white/50">
                Autor: Matej Šoltis
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all"
            aria-label={t.close || 'Zavrieť'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed text-center">
          {t.message}
        </div>

        {/* Direct Action Buttons: Send Email & Copy */}
        <div className="flex flex-col gap-2">
          <a
            href={`mailto:${email}?subject=Toddler%20Sleep%20Assistant%20-%20Feedback`}
            onClick={() => triggerHaptic(8)}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </a>

          <button
            onClick={handleCopyEmail}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyEmail}</span>
              </>
            )}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={() => {
            triggerHaptic(6);
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs active:scale-95 transition-all border border-white/10"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
