'use client';

import { useState } from 'react';
import { ShieldCheck, Sparkles, Heart, CreditCard, Loader2 } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/payments';
import { SITE_CONFIG } from '@/lib/site-config';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  amount: number;
  type: 'subscription' | 'tip' | 'pack_purchase';
  creatorId?: string;
  creatorName?: string;
  onSuccess?: () => void;
}

export default function RazorpayCheckoutModal({
  isOpen,
  onClose,
  title,
  description,
  amount,
  type,
  creatorId,
  creatorName,
  onSuccess,
}: RazorpayCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setError('Failed to load Razorpay Payment Gateway SDK. Check network connection.');
        setLoading(false);
        return;
      }

      // Step 1: Create Razorpay Order via Server Action
      const orderRes = await createRazorpayOrder({
        amount,
        currency: 'INR',
        type,
        creatorId,
        metadata: { creator_name: creatorName },
      });

      if (!orderRes.success || !orderRes.order) {
        setError(orderRes.error || 'Could not initiate payment order.');
        setLoading(false);
        return;
      }

      const { order } = orderRes;

      // Step 2: Configure Razorpay Checkout Modal
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: SITE_CONFIG.name,
        description,
        order_id: order.id,
        theme: {
          color: '#8b5cf6', // Neon Purple Accent
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(true);
          // Step 3: Verify Payment Signature via Server Action
          const verifyRes = await verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verifyRes.success) {
            setSuccessMsg('Payment successful! Your order has been processed.');
            if (onSuccess) onSuccess();
            setTimeout(() => {
              onClose();
              setSuccessMsg(null);
            }, 2000);
          } else {
            setError(verifyRes.error || 'Payment verification failed.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error?.description || 'Payment execution failed.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('[Razorpay Checkout Error]:', err);
      setError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200/90 shadow-2xl p-6 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              {type === 'subscription' ? <Sparkles className="w-5 h-5" /> : type === 'tip' ? <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500 font-medium">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Order Details */}
        <div className="my-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-600">
            <span>Item / Tier</span>
            <span className="text-zinc-900 font-bold">{title}</span>
          </div>
          {creatorName && (
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-600">
              <span>Creator Recipient</span>
              <span className="text-zinc-900 font-bold">@{creatorName}</span>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center text-sm font-bold text-zinc-900">
            <span>Total Payable</span>
            <span className="text-base font-extrabold text-purple-600">₹{amount} INR</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs tracking-wide shadow-md shadow-purple-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing with Razorpay...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay ₹{amount} with Razorpay
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            256-Bit SSL Encrypted Razorpay Checkout
          </div>
        </div>
      </div>
    </div>
  );
}
