import { skeletonBase } from '../../styles/styleUtils';

/**
 * WidgetSkeleton
 * Canonical shared primitive for dashboard widget loading states.
 * Replaces scattered inline implementations of SkeletonRow and SkeletonBar.
 */

export const WidgetSkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-5 h-5 rounded-full shrink-0" style={skeletonBase} />
    <div className="flex-1 space-y-1">
      <div className="h-3.5 rounded w-3/4" style={skeletonBase} />
      <div className="h-3 rounded w-1/3" style={skeletonBase} />
    </div>
  </div>
);

export const WidgetSkeletonBar = () => (
  <div className="space-y-2 animate-pulse mb-3">
    <div className="flex justify-between">
      <div className="h-3 w-20 rounded" style={skeletonBase} />
      <div className="h-3 w-16 rounded" style={skeletonBase} />
    </div>
    <div className="h-1.5 w-full rounded-full" style={skeletonBase} />
  </div>
);

export const WidgetSkeletonList = ({ rows = 3 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <WidgetSkeletonRow key={i} />
    ))}
  </>
);

export const WidgetSkeleton = {
  Row: WidgetSkeletonRow,
  Bar: WidgetSkeletonBar,
  List: WidgetSkeletonList
};

export default WidgetSkeleton;
