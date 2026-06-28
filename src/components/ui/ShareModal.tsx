'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, CheckCircle2, Link as LinkIcon, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ShareModal({ isOpen, onClose, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `Check out this amazing AI prompt: "${title}" on Prizom!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prizom Prompt',
          text: text,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing natively', error);
      }
    }
  };

  const shareLinks = [
    {
      name: 'X (Twitter)',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.93H5.078z"></path></svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: 'bg-black text-white hover:bg-zinc-800 shadow-[0_4px_14px_rgba(0,0,0,0.2)]'
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      color: 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_4px_14px_rgba(37,211,102,0.3)]'
    },
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'bg-[#1877F2] text-white hover:bg-[#166FE5] shadow-[0_4px_14px_rgba(24,119,242,0.3)]'
    },
    {
      name: 'Telegram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      color: 'bg-[#229ED9] text-white hover:bg-[#1C88BD] shadow-[0_4px_14px_rgba(34,158,217,0.3)]'
    }
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-black text-zinc-900 flex items-center tracking-tight">
            <Share2 className="w-5 h-5 mr-2 text-[var(--color-neon-purple)]" />
            Share Prompt
          </h2>
          <button 
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-8">
          {/* Social Links */}
          <div className="flex justify-center flex-wrap gap-4">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${link.color}`}
                title={`Share on ${link.name}`}
              >
                {link.icon}
              </a>
            ))}
            
            {/* Native Share fallback for mobile */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                title="More Options"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Copy Link Box */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Copy Link</label>
            <div className="flex items-center space-x-2 bg-white border border-zinc-200 rounded-xl p-2 pl-4 shadow-sm">
              <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              <input 
                type="text" 
                readOnly 
                value={url}
                className="flex-1 bg-transparent border-none focus:outline-none text-zinc-700 text-sm truncate font-medium"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 shrink-0 ${
                  copied 
                    ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)]' 
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
