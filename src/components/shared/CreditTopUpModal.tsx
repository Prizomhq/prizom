'use client';

import React, { useState } from 'react';
import { Sparkles, CreditCard, CheckCircle2, ShieldCheck, Loader2, Zap } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/payments';
import { SITE_CONFIG } from '@/lib/site-config';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  popular?: boolean;
  tagline: string;
}

const TOPUP_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    credits: 25,
    priceInr: 99,
    tagline: 'Ideal for quick experiments',
  },
  {
    id: 'pack_pro',
    name: 'Pro Creator Pack',
    credits: 75,
    priceInr: 249,
    popular: true,
    tagline: 'Most popular for active creators',
  },
  {
    id: 'pack_power',
    name: 'Power Studio Pack',
    credits: 200,
    priceInr: 599,
    tagline: 'Best value for high-volume studio work',
  },
];

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopUpSuccess?: (newBalance: number) => void;
}

export function CreditTopUpModal({
  isOpen,
  onClose,
  currentBalance,
  onTopUpSuccess,
}: CreditTopUpModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPackage>(TOPUP_PACKAGES[1]);
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

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setError('Failed to load Razorpay SDK. Please check your network connection.');
        setLoading(false);
        return;
      }

      // Step 1: Create Order via Server Action
      const orderRes = await createRazorpayOrder({
        amount: selectedPack.priceInr,
        currency: 'INR',
        type: 'pack_purchase',
        metadata: {
          package_id: selectedPack.id,
          credits: selectedPack.credits,
        },
      });

      if (!orderRes.success || !orderRes.order) {
        setError(orderRes.error || 'Could not initiate top-up payment.');
        setLoading(false);
        return;
      }

      const { order } = orderRes;

      // Step 2: Launch Razorpay Modal
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: SITE_CONFIG.name,
        description: `Top-Up ${selectedPack.credits} AI Studio Credits`,
        order_id: order.id,
        theme: {
          color: '#9333ea', // Purple primary
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(true);

          // Step 3: Verify Payment Server-Side & Add Credits Atomically
          const verifyRes = await verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verifyRes.success) {
            const finalBal = verifyRes.newBalance ?? (currentBalance + selectedPack.credits);
            setSuccessMsg(`✓ Successfully added +${selectedPack.credits} credits! New balance: ${finalBal}`);
            if (onTopUpSuccess) {
              onTopUpSuccess(finalBal);
            }
            setTimeout(() => {
              onClose();
              setSuccessMsg(null);
            }, 2000);
          } else {
            setError(verifyRes.error || 'Payment signature verification failed.');
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
      rzp.on('payment.failed', function (resp: any) {
        setError(resp.error?.description || 'Payment execution failed.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('[Credit Topup Error]:', err);
      setError(err.message || 'An unexpected error occurred during top-up checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                Top Up AI Studio Credits
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Current Balance: <span className="text-purple-300 font-bold font-mono">{currentBalance} Credits</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-900/60 text-xs text-red-300 font-semibold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Package Selector */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Select Credit Package
          </label>

          <div className="grid grid-cols-1 gap-3">
            {TOPUP_PACKAGES.map((pkg) => {
              const isSelected = selectedPack.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPack(pkg)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                      Best Value
                    </span>
                  )}

                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-purple-400 bg-purple-600' : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{pkg.name}</span>
                        <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
                          +{pkg.credits} Credits
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">{pkg.tagline}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-white">₹{pkg.priceInr}</span>
                    <span className="text-[10px] text-zinc-500 font-mono block">INR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
              <span>Verifying with Razorpay...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay ₹{selectedPack.priceInr} for +{selectedPack.credits} Credits</span>
            </>
          )}
        </button>

        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Server-Verified 256-Bit SSL Instant Credit Top-Up</span>
        </div>
      </div>
    </div>
  );
}
