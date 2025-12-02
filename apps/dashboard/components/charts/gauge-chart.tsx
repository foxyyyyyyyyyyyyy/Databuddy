"use client";

import type { ReactNode } from "react";
import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type GaugeRating = "good" | "needs-improvement" | "poor";

type GaugeChartProps = {
	/** Current value to display */
	value: number;
	/** Maximum value for the gauge (100% fill) */
	max: number;
	/** Rating determines the color */
	rating: GaugeRating;
	/** Size of the chart in pixels */
	size?: number;
	/** Format the center label value */
	formatValue?: (value: number) => string;
	/** Optional unit to display below the value */
	unit?: string;
	/** Number of tick marks */
	tickCount?: number;
	/** Starting angle in degrees (0 = top, 90 = right) */
	startAngle?: number;
	/** Sweep angle in degrees */
	sweepAngle?: number;
};

const RATING_COLORS: Record<GaugeRating, { base: string; glow: string }> = {
	good: { base: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
	"needs-improvement": { base: "#f59e0b", glow: "rgba(245, 158, 11, 0.5)" },
	poor: { base: "#ef4444", glow: "rgba(239, 68, 68, 0.5)" },
};

export const GaugeChart = memo(function GaugeChart({
	value,
	max,
	rating,
	size = 120,
	formatValue,
	unit,
	tickCount = 36,
	startAngle = -135,
	sweepAngle = 270,
}: GaugeChartProps) {
	const progress = Math.max(0, Math.min(value / max, 1));
	const targetActiveTicks = Math.floor(progress * tickCount);

	const [activeTicks, setActiveTicks] = useState(0);
	const animationRef = useRef<number | null>(null);
	const currentTicksRef = useRef(0);

	const animateToTarget = useCallback((target: number) => {
		if (animationRef.current !== null) {
			cancelAnimationFrame(animationRef.current);
		}

		const animate = () => {
			const current = currentTicksRef.current;
			if (current === target) {
				animationRef.current = null;
				return;
			}

			const step = target > current ? 1 : -1;
			currentTicksRef.current = current + step;
			setActiveTicks(currentTicksRef.current);

			animationRef.current = requestAnimationFrame(() => {
				setTimeout(animate, 15);
			});
		};

		animate();
	}, []);

	useLayoutEffect(() => {
		animateToTarget(targetActiveTicks);
		return () => {
			if (animationRef.current !== null) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [targetActiveTicks, animateToTarget]);

	const displayValue = formatValue
		? formatValue(value)
		: Math.round(value).toString();

	const colors = RATING_COLORS[rating];

	const padding = 8;
	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 - padding;
	const tickLength = size * 0.12;
	const tickWidth = Math.max(2, size * 0.025);

	const ticks: ReactNode[] = [];
	for (let i = 0; i < tickCount; i++) {
		const t = tickCount > 1 ? i / (tickCount - 1) : 0;
		const angle = startAngle + t * sweepAngle;
		const angleRad = (angle * Math.PI) / 180;

		const x1 = cx + (radius - tickLength) * Math.cos(angleRad);
		const y1 = cy + (radius - tickLength) * Math.sin(angleRad);
		const x2 = cx + radius * Math.cos(angleRad);
		const y2 = cy + radius * Math.sin(angleRad);

		const isActive = i < activeTicks;

		ticks.push(
			<line
				className={cn(
					"transition-opacity duration-100",
					isActive && "drop-shadow-sm"
				)}
				key={i}
				stroke={isActive ? colors.base : "hsl(var(--muted))"}
				strokeLinecap="round"
				strokeOpacity={isActive ? 1 : 0.4}
				strokeWidth={tickWidth}
				style={{
					filter: isActive ? `drop-shadow(0 0 3px ${colors.glow})` : undefined,
				}}
				x1={x1}
				x2={x2}
				y1={y1}
				y2={y2}
			/>
		);
	}

	// Dynamic font sizing based on text length to prevent overflow
	const innerRadius = radius - tickLength - 4;
	const maxTextWidth = innerRadius * 1.4;
	const charCount = displayValue.length + (unit ? unit.length * 0.6 : 0);
	const baseFontSize = size * 0.22;
	const scaledFontSize = Math.min(
		baseFontSize,
		maxTextWidth / (charCount * 0.55)
	);
	const valueFontSize = Math.round(Math.max(12, scaledFontSize));
	const unitFontSize = Math.round(valueFontSize * 0.5);

	return (
		<div
			className="relative flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg
				className="absolute inset-0"
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				width={size}
			>
				<title>
					Gauge chart showing {displayValue} {unit}
				</title>
				<defs>
					<filter
						height="200%"
						id={`glow-${rating}`}
						width="200%"
						x="-50%"
						y="-50%"
					>
						<feGaussianBlur result="coloredBlur" stdDeviation="2" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				{ticks}
			</svg>
			<div className="relative z-10 flex items-baseline justify-center gap-0.5">
				<span
					className="font-semibold text-foreground tabular-nums tracking-tight"
					style={{ fontSize: valueFontSize, lineHeight: 1 }}
				>
					{displayValue}
				</span>
				{unit ? (
					<span
						className="text-muted-foreground"
						style={{ fontSize: unitFontSize, lineHeight: 1 }}
					>
						{unit}
					</span>
				) : null}
			</div>
		</div>
	);
});

export type { GaugeRating, GaugeChartProps };
