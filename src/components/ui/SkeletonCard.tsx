'use client';

export default function SkeletonCard() {
  return (
    <div className="block w-full mb-4 sm:mb-6 break-inside-avoid bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm select-none">
      {/* Skeleton Image Frame */}
      <div className="w-full aspect-[4/5] shimmer" />
      
      {/* Details Box */}
      <div className="p-3 sm:p-5 space-y-3">
        {/* Title Lines */}
        <div className="space-y-2">
          <div className="h-4 rounded-md w-11/12 shimmer" />
          <div className="h-4 rounded-md w-2/3 shimmer" />
        </div>
        
        {/* Badge Skeletons */}
        <div className="flex gap-1.5 pt-1">
          <div className="h-4 rounded-full w-14 shimmer" />
          <div className="h-4.5 rounded-full w-10 shimmer" />
        </div>
        
        {/* Creator row */}
        <div className="flex items-center space-x-2 pt-3 border-t border-zinc-100">
          <div className="w-8 h-8 rounded-full shrink-0 shimmer" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3.5 rounded w-1/2 shimmer" />
            <div className="h-3 rounded w-1/3 shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
