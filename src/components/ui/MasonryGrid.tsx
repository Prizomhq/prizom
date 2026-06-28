'use client';

import React, { ReactNode, useState, useEffect } from 'react';

interface MasonryGridProps {
  children: ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
  const [mounted, setMounted] = useState(false);
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    setMounted(true);
    
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w >= 1440) {
        setColumnCount(5);
      } else if (w >= 1024) {
        setColumnCount(4);
      } else if (w >= 768) {
        setColumnCount(3);
      } else if (w >= 480) {
        setColumnCount(2);
      } else {
        setColumnCount(1);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const childrenArray = React.Children.toArray(children);

  if (!mounted || childrenArray.length === 0) {
    // SSR / Hydration Fallback: CSS Grid prevents the overflow that CSS columns causes on 320-375px screens
    return (
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1440px]:grid-cols-5 gap-4 sm:gap-6 py-6 w-full">
        {children}
      </div>
    );
  }

  // Chronological distribution into columns (round-robin)
  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => []);
  childrenArray.forEach((child, idx) => {
    columns[idx % columnCount].push(child);
  });

  return (
    <div className="flex gap-4 sm:gap-6 py-6 w-full items-start">
      {columns.map((colItems, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4 sm:gap-6 min-w-0">
          {colItems}
        </div>
      ))}
    </div>
  );
}
