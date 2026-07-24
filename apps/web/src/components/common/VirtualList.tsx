import { useState, useRef, useCallback, useMemo, ReactNode } from 'react';

interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
}

export default function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight = 400,
  overscan = 5,
  className = '',
}: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return {
      startIndex: start,
      endIndex: end,
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
    }));
  }, [items, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
