'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'zinc';
  href?: string;
}

const variantStyles = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    border: 'border-zinc-200/80 hover:border-indigo-300'
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    border: 'border-zinc-200/80 hover:border-emerald-300'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    border: 'border-zinc-200/80 hover:border-amber-300'
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    border: 'border-zinc-200/80 hover:border-rose-300'
  },
  zinc: {
    iconBg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    border: 'border-zinc-200/80 hover:border-zinc-300'
  }
};

export default function AdminStatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'indigo',
  href
}: AdminStatCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 group relative ${styles.border}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          {value}
        </div>

        {trend && (
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive !== false 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          }`}>
            {trend.isPositive !== false ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs font-medium text-zinc-450 mt-2 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
