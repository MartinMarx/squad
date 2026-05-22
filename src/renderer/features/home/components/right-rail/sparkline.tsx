import { useMemo } from 'react';
import { cn } from '@renderer/utils/utils';

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Override the y-axis maximum. Default: max of values, with a floor of 5. */
  yMax?: number;
};

/**
 * Tiny SVG line+area sparkline. Renders nothing if there are < 2 samples.
 * Coords are normalized to [0,1] and stroked at 1.25px without antialiasing
 * sharpening, suitable for ~80x20 micro-charts in the summary tiles.
 */
export function Sparkline({ values, width = 80, height = 24, className, yMax }: SparklineProps) {
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '' };
    const max = yMax ?? Math.max(5, ...values);
    const xStep = width / (values.length - 1);
    const toY = (v: number) => height - (Math.min(v, max) / max) * height;
    const points = values.map((v, i) => `${i * xStep},${toY(v).toFixed(2)}`);
    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `M ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
    return { line: linePath, area: areaPath };
  }, [values, width, height, yMax]);

  if (!line) {
    return (
      <div className={cn('flex h-[24px] w-20 items-end gap-px text-foreground-passive', className)}>
        <span className="text-[9px]">no data</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" fillOpacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
