import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

// Skeleton variants for common patterns
export const SkeletonCard = () => (
  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    ))}
  </div>
);
