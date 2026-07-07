'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, CheckCircle2, Link as LinkIcon, Share2 } from 'lucide-react';
import SocialIcon from '@/components/ui/SocialIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ShareModal({ isOpen, onClose, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      icon: <SocialIcon platform="twitter" className="w-5 h-5 fill-current" />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: 'bg-black text-white hover:bg-zinc-800 shadow-[0_4px_14px_rgba(0,0,0,0.2)]'
    },
    {
      name: 'WhatsApp',
      icon: <SocialIcon platform="whatsapp" className="w-5 h-5 fill-current" />,
      url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      color: 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_4px_14px_rgba(37,211,102,0.3)]'
    },
    {
      name: 'Facebook',
      icon: <SocialIcon platform="facebook" className="w-5 h-5 fill-current" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'bg-[#1877F2] text-white hover:bg-[#166FE5] shadow-[0_4px_14px_rgba(24,119,242,0.3)]'
    },
    {
      name: 'Telegram',
      icon: <SocialIcon platform="telegram" className="w-5 h-5 fill-current" />,
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
