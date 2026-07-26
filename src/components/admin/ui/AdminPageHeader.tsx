'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'zinc';
  };
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

const badgeVariants = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200'
};

export default function AdminPageHeader({
  title,
  description,
  badge,
  breadcrumbs = [{ label: 'Admin', href: '/admin' }],
  children,
  icon: Icon
}: AdminPageHeaderProps) {
  return (
    <div className="border-b border-zinc-200/80 pb-6 mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-650 mb-3" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-650 shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-zinc-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-900 font-bold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {title}
            </h1>
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${badgeVariants[badge.variant || 'indigo']}`}>
                {badge.text}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-zinc-500 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Controls Slot */}
        {children && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
