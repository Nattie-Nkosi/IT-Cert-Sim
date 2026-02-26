import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-muted', className)}
      {...props}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-10 h-10" />
      </div>
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

function StatGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function CertCardSkeleton() {
  return (
    <div className="bg-card p-6 border">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-10 h-10" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function ExamCardSkeleton() {
  return (
    <div className="bg-card p-6 border">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="w-10 h-10" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2 mb-4 p-4 bg-muted/30">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}

function HistoryRowSkeleton() {
  return (
    <div className="bg-card p-6 border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-64 mb-3" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card border p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {[40, 65, 50, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  StatCardSkeleton,
  StatGridSkeleton,
  CertCardSkeleton,
  ExamCardSkeleton,
  HistoryRowSkeleton,
  ChartSkeleton,
};
