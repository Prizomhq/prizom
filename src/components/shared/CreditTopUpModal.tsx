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

      // Step 1: Create Order via Server Action (Server-enforced package catalog)
      const orderRes = await createRazorpayOrder({
        packageId: selectedPack.id,
        type: 'pack_purchase',
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Top Up AI Studio Credits
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Current Balance: <span className="text-indigo-700 font-bold font-mono">{currentBalance} Credits</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Package Selector */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
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
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                      Best Value
                    </span>
                  )}

                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{pkg.name}</span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                          +{pkg.credits} Credits
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{pkg.tagline}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">₹{pkg.priceInr}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">INR</span>
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
          className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
              <span>Verifying with Razorpay...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 text-indigo-300" />
              <span>Pay ₹{selectedPack.priceInr} for +{selectedPack.credits} Credits</span>
            </>
          )}
        </button>

        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Server-Verified 256-Bit SSL Instant Credit Top-Up</span>
        </div>
      </div>
    </div>
  );
}

