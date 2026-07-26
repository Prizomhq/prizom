'use client';

import React from 'react';
import { Loader2, Inbox, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageIndex?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string) => void;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export default function AdminDataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display at this time.',
  pageIndex = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onSort,
  keyExtractor,
  onRowClick
}: AdminDataTableProps<T>) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto min-h-[300px] flex-1">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              {columns.map((col) => {
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 ${alignClass} ${col.className || ''}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
                      >
                        {col.header}
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-200/60 text-zinc-700 font-medium">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-3.5 bg-zinc-100 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 mb-1">{emptyTitle}</h4>
                    <p className="text-xs text-zinc-500">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-zinc-50/60 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                    return (
                      <td key={col.key} className={`px-4 py-3.5 ${alignClass} ${col.className || ''}`}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {onPageChange && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page <strong className="font-semibold text-zinc-900">{pageIndex}</strong> of <strong className="font-semibold text-zinc-900">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageIndex <= 1 || loading}
              onClick={() => onPageChange(pageIndex - 1)}
              className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pageIndex >= totalPages || loading}
              onClick={() => onPageChange(pageIndex + 1)}
              className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
