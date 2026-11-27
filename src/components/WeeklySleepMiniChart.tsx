import React, { useMemo, useState } from 'react';
import { ChevronDown, Moon, Sun, TrendingUp } from 'lucide-react';
import { Language, SleepSession } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  buildLast7DaysTrend,
  formatMinutesCompact,
  getWeeklyTrendCopy,
} from '../utils/pediatricSummary';

interface WeeklySleepMiniChartProps {
  sessions: SleepSession[];
  language: Language;
  babyBirthDate?: string;
}

type ChartViewMode = 'dayNight' | 'total';

const LOCALE_MAP: Record<Language, string> = {
  sk: 'sk-SK',
  cs: 'cs-CZ',
  en: 'en-US',
  pl: 'pl-PL',
  hu: 'hu-HU',
  uk: 'uk-UA',
  it: 'it-IT',
  es: 'es-ES',
  ro: 'ro-RO',
  ar: 'ar-SA',
};

// Clean, high-legibility night-friendly colors for the classic line chart
const NIGHT_COLOR = '#7dd3fc'; // Moonlit Sky Blue
const DAY_COLOR = '#f5b895'; // Warm Soft Peach
const TOTAL_COLOR = '#e2e8f0'; // Crisp Pearl White

// Unified proportional SVG coordinate system (no aspect-ratio distortion)
const SVG_WIDTH = 340;
const SVG_HEIGHT = 158;
const PLOT_LEFT = 32;
const PLOT_RIGHT = 330;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 132;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const COL_WIDTH = PLOT_WIDTH / 7;

interface LinePoint {
  index: number;
  dateStr: string;
  x: number;
  y: number;
  minutes: number;
  logged: boolean;
}

function getNiceYAxis(maxMinutes: number, minHours: number): { maxHours: number; ticks: number[] } {
  const neededHours = Math.max(minHours, Math.ceil((maxMinutes + 30) / 60));
  if (neededHours <= 12) {
    return { maxHours: 12, ticks: [0, 4, 8, 12] };
  }
  if (neededHours <= 16) {
    return { maxHours: 16, ticks: [0, 4, 8, 12, 16] };
  }
  if (neededHours <= 20) {
    return { maxHours: 20, ticks: [0, 5, 10, 15, 20] };
  }
  return { maxHours: 24, ticks: [0, 6, 12, 18, 24] };
}

function buildPolylinePoints(points: LinePoint[]): string {
  const valid = points.filter((p) => p.logged);
  if (valid.length < 2) return '';
  return valid.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export const WeeklySleepMiniChart: React.FC<WeeklySleepMiniChartProps> = ({
  sessions,
  language,
  babyBirthDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ChartViewMode>('dayNight');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const copy = getWeeklyTrendCopy(language);
  const locale = LOCALE_MAP[language] || 'en-US';

  const trend = useMemo(
    () => buildLast7DaysTrend(sessions, babyBirthDate),
    [sessions, babyBirthDate]
  );

  const yAxis = useMemo(() => {
    if (viewMode === 'dayNight') {
      const maxSplit = trend.days.reduce(
        (m, d) => Math.max(m, d.nightSleepMinutes, d.dayNapMinutes),
        0
      );
      return getNiceYAxis(maxSplit, 12);
    }

    const targetMaxMins = trend.ageTargetMaxHours ? trend.ageTargetMaxHours * 60 : 0;
    return getNiceYAxis(Math.max(trend.maxDayMinutes, targetMaxMins), 16);
  }, [viewMode, trend.days, trend.maxDayMinutes, trend.ageTargetMaxHours]);

  const maxMinutes = yAxis.maxHours * 60;

  const toY = (minutes: number) => {
    const ratio = Math.min(1, Math.max(0, minutes / maxMinutes));
    return PLOT_BOTTOM - ratio * PLOT_HEIGHT;
  };

  const activeDay = useMemo(() => {
    if (selectedDateStr) {
      const found = trend.days.find((d) => d.dateStr === selectedDateStr);
      if (found) return found;
    }
    for (let i = trend.days.length - 1; i >= 0; i--) {
      if (trend.days[i].totalMinutes > 0) return trend.days[i];
    }
    return trend.days[trend.days.length - 1] ?? null;
  }, [selectedDateStr, trend.days]);

  const targetStatus = useMemo(() => {
    if (
      trend.loggedDaysCount === 0 ||
      trend.ageTargetMinHours === null ||
      trend.ageTargetMaxHours === null
    ) {
      return null;
    }
    const avgHours = trend.avgDailyTotalMinutes / 60;
    if (avgHours < trend.ageTargetMinHours) {
      return { text: copy.targetStatusLow, colorClass: 'text-[#f5b895]' };
    }
    if (avgHours > trend.ageTargetMaxHours) {
      return { text: copy.targetStatusHigh, colorClass: 'text-sky-300' };
    }
    return { text: copy.targetStatusIn, colorClass: 'text-emerald-300' };
  }, [trend, copy]);

  const { nightPoints, dayPoints, totalPoints, nightPolyline, dayPolyline, totalPolyline } =
    useMemo(() => {
      const nPts: LinePoint[] = [];
      const dPts: LinePoint[] = [];
      const tPts: LinePoint[] = [];

      trend.days.forEach((day, idx) => {
        const x = PLOT_LEFT + (idx + 0.5) * COL_WIDTH;
        const hasAnySleep = day.totalMinutes > 0;

        nPts.push({
          index: idx,
          dateStr: day.dateStr,
          x,
          y: toY(day.nightSleepMinutes),
          minutes: day.nightSleepMinutes,
          logged: day.nightSleepMinutes > 0,
        });
        dPts.push({
          index: idx,
          dateStr: day.dateStr,
          x,
          y: toY(day.dayNapMinutes),
          minutes: day.dayNapMinutes,
          logged: day.dayNapMinutes > 0 || (hasAnySleep && !day.isToday),
        });
        tPts.push({
          index: idx,
          dateStr: day.dateStr,
          x,
          y: toY(day.totalMinutes),
          minutes: day.totalMinutes,
          logged: hasAnySleep,
        });
      });

      return {
        nightPoints: nPts,
        dayPoints: dPts,
        totalPoints: tPts,
        nightPolyline: buildPolylinePoints(nPts),
        dayPolyline: buildPolylinePoints(dPts),
        totalPolyline: buildPolylinePoints(tPts),
      };
    }, [trend.days, maxMinutes]);

  const getShortWeekday = (dateStr: string, isToday: boolean) => {
    if (isToday) return copy.todayShort;
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr.slice(-2);
    const label = d.toLocaleDateString(locale, { weekday: 'short' }).replace(/\.$/, '');
    return label.slice(0, 3);
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const targetBandTopY =
    viewMode === 'total' && trend.ageTargetMaxHours !== null
      ? toY(trend.ageTargetMaxHours * 60)
      : null;
  const targetBandBottomY =
    viewMode === 'total' && trend.ageTargetMinHours !== null
      ? toY(trend.ageTargetMinHours * 60)
      : null;

  const hitLeftPct = (PLOT_LEFT / SVG_WIDTH) * 100;
  const hitWidthPct = (PLOT_WIDTH / SVG_WIDTH) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden transition-colors">
      {/* Compact Collapsible Trigger Header */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp className="w-4 h-4 text-sky-300 shrink-0" />
          <span className="text-xs font-semibold text-white/85 truncate">{copy.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-white/55 tabular-nums whitespace-nowrap">
            {trend.loggedDaysCount > 0
              ? copy.avgPerDayShort(formatMinutesCompact(trend.avgDailyTotalMinutes))
              : copy.noDataShort}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/55 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOpen ? 'rotate-180 text-sky-300' : ''
            }`}
          />
        </div>
      </button>

      {/* Smooth Unrolling Classic Line Chart */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-4 pb-4 pt-3 border-t border-white/5 flex flex-col gap-3 transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOpen ? 'translate-y-0' : '-translate-y-2'
            }`}
          >
            {trend.loggedDaysCount === 0 ? (
              <p className="py-3 text-center text-xs text-white/50 leading-relaxed">
                {copy.emptyHint}
              </p>
            ) : (
              <>
                {/* Top Controls: View Switcher + Selected Day Breakdown */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      role="tablist"
                      aria-label={copy.title}
                      className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.06] border border-white/[0.06] shrink-0"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'dayNight'}
                        onClick={() => {
                          triggerHaptic('light');
                          setViewMode('dayNight');
                        }}
                        className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0 transition-colors touch-manipulation ${
                          viewMode === 'dayNight'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-white/55 hover:text-white/80'
                        }`}
                      >
                        {copy.viewDayNight}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'total'}
                        onClick={() => {
                          triggerHaptic('light');
                          setViewMode('total');
                        }}
                        className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0 transition-colors touch-manipulation ${
                          viewMode === 'total'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-white/55 hover:text-white/80'
                        }`}
                      >
                        {copy.legendTotal}
                      </button>
                    </div>

                    {activeDay && (
                      <span className="text-xs font-semibold text-white/90 truncate">
                        {formatShortDate(activeDay.dateStr)}
                      </span>
                    )}
                  </div>

                  {/* Selected Day Exact Values */}
                  {activeDay && (
                    <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
                          <Moon className="w-3.5 h-3.5" />
                          {formatMinutesCompact(activeDay.nightSleepMinutes)}
                        </span>
                        <span className="text-white/20" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#f5b895]">
                          <Sun className="w-3.5 h-3.5" />
                          {formatMinutesCompact(activeDay.dayNapMinutes)}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-100">
                        {copy.legendTotal}:{' '}
                        {activeDay.totalMinutes > 0
                          ? formatMinutesCompact(activeDay.totalMinutes)
                          : '0m'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Classic Straight Line Chart (Unified Proportional SVG, LTR chronological) */}
                <div className="relative w-full select-none" dir="ltr">
                  <svg
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    className="w-full h-auto block"
                    role="img"
                    aria-label={copy.title}
                  >
                    {/* Subtle Selected Day Column Highlight */}
                    {trend.days.map((day, idx) => {
                      if (activeDay?.dateStr !== day.dateStr) return null;
                      const colX = PLOT_LEFT + idx * COL_WIDTH + 3;
                      return (
                        <rect
                          key={`sel-${day.dateStr}`}
                          x={colX}
                          y={PLOT_TOP - 6}
                          width={COL_WIDTH - 6}
                          height={PLOT_HEIGHT + 10}
                          rx="6"
                          fill="rgba(255, 255, 255, 0.055)"
                        />
                      );
                    })}

                    {/* Clean Horizontal Gridlines + Y-Axis Hour Labels */}
                    {yAxis.ticks.map((hour) => {
                      const y = toY(hour * 60);
                      const isZero = hour === 0;
                      return (
                        <g key={`tick-${hour}`}>
                          <line
                            x1={PLOT_LEFT}
                            y1={y}
                            x2={PLOT_RIGHT}
                            y2={y}
                            stroke={isZero ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}
                            strokeWidth="1"
                          />
                          <text
                            x={PLOT_LEFT - 6}
                            y={y + 3}
                            textAnchor="end"
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                          >
                            {hour}h
                          </text>
                        </g>
                      );
                    })}

                    {/* Clean Left Y-Axis Hairline */}
                    <line
                      x1={PLOT_LEFT}
                      y1={PLOT_TOP}
                      x2={PLOT_LEFT}
                      y2={PLOT_BOTTOM}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                    />

                    {/* Age-Recommended 24h Target Band (Total view only, solid soft tint) */}
                    {viewMode === 'total' &&
                      targetBandTopY !== null &&
                      targetBandBottomY !== null && (
                        <rect
                          x={PLOT_LEFT}
                          y={targetBandTopY}
                          width={PLOT_WIDTH}
                          height={Math.max(2, targetBandBottomY - targetBandTopY)}
                          fill="rgba(52, 211, 153, 0.12)"
                        />
                      )}

                    {/* Crisp Straight Lines (No area fills, no Bezier waves, no dashes) */}
                    {viewMode === 'total' ? (
                      <>
                        {totalPolyline && (
                          <polyline
                            points={totalPolyline}
                            fill="none"
                            stroke={TOTAL_COLOR}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {totalPoints.map((pt) => {
                          const isSelected = activeDay?.dateStr === pt.dateStr;
                          if (!pt.logged) {
                            return (
                              <circle
                                key={`te-${pt.dateStr}`}
                                cx={pt.x}
                                cy={PLOT_BOTTOM}
                                r={isSelected ? 2.5 : 1.8}
                                fill={isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.16)'}
                              />
                            );
                          }

                          const hoursText = `${(pt.minutes / 60).toFixed(1).replace(/\.0$/, '')}h`;
                          const labelY = Math.max(10, pt.y - 8);

                          return (
                            <g key={`tp-${pt.dateStr}`}>
                              <text
                                x={pt.x}
                                y={labelY}
                                textAnchor="middle"
                                fill={isSelected ? '#ffffff' : 'rgba(226,232,240,0.65)'}
                                fontSize="9"
                                fontWeight={isSelected ? 700 : 500}
                                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                              >
                                {hoursText}
                              </text>
                              {isSelected && (
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="7"
                                  fill="rgba(226, 232, 240, 0.16)"
                                />
                              )}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isSelected ? 4 : 3}
                                fill={isSelected ? '#0f172a' : TOTAL_COLOR}
                                stroke={isSelected ? TOTAL_COLOR : '#0f172a'}
                                strokeWidth={isSelected ? 2 : 1.2}
                              />
                            </g>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {nightPolyline && (
                          <polyline
                            points={nightPolyline}
                            fill="none"
                            stroke={NIGHT_COLOR}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {dayPolyline && (
                          <polyline
                            points={dayPolyline}
                            fill="none"
                            stroke={DAY_COLOR}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {trend.days.map((day, idx) => {
                          const isSelected = activeDay?.dateStr === day.dateStr;
                          const nPt = nightPoints[idx];
                          const dPt = dayPoints[idx];

                          if (day.totalMinutes <= 0) {
                            return (
                              <circle
                                key={`em-${day.dateStr}`}
                                cx={nPt.x}
                                cy={PLOT_BOTTOM}
                                r={isSelected ? 2.5 : 1.8}
                                fill={isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.16)'}
                              />
                            );
                          }

                          return (
                            <g key={`pts-${day.dateStr}`}>
                              {nPt.logged && (
                                <>
                                  {isSelected && (
                                    <circle
                                      cx={nPt.x}
                                      cy={nPt.y}
                                      r="7"
                                      fill="rgba(125, 211, 252, 0.18)"
                                    />
                                  )}
                                  <circle
                                    cx={nPt.x}
                                    cy={nPt.y}
                                    r={isSelected ? 4 : 3}
                                    fill={isSelected ? '#0f172a' : NIGHT_COLOR}
                                    stroke={isSelected ? NIGHT_COLOR : '#0f172a'}
                                    strokeWidth={isSelected ? 2 : 1.2}
                                  />
                                </>
                              )}

                              {dPt.logged && (
                                <>
                                  {isSelected && (
                                    <circle
                                      cx={dPt.x}
                                      cy={dPt.y}
                                      r="7"
                                      fill="rgba(245, 184, 149, 0.18)"
                                    />
                                  )}
                                  <circle
                                    cx={dPt.x}
                                    cy={dPt.y}
                                    r={isSelected ? 4 : 3}
                                    fill={isSelected ? '#0f172a' : DAY_COLOR}
                                    stroke={isSelected ? DAY_COLOR : '#0f172a'}
                                    strokeWidth={isSelected ? 2 : 1.2}
                                  />
                                </>
                              )}
                            </g>
                          );
                        })}
                      </>
                    )}

                    {/* X-Axis Weekday Labels aligned directly under each column */}
                    {trend.days.map((day, idx) => {
                      const cx = PLOT_LEFT + (idx + 0.5) * COL_WIDTH;
                      const isSelected = activeDay?.dateStr === day.dateStr;
                      return (
                        <text
                          key={`xlbl-${day.dateStr}`}
                          x={cx}
                          y={SVG_HEIGHT - 6}
                          textAnchor="middle"
                          fill={
                            isSelected
                              ? '#ffffff'
                              : day.isToday
                              ? 'rgba(255,255,255,0.78)'
                              : 'rgba(255,255,255,0.45)'
                          }
                          fontSize="10"
                          fontWeight={isSelected ? 700 : day.isToday ? 600 : 400}
                        >
                          {getShortWeekday(day.dateStr, day.isToday)}
                        </text>
                      );
                    })}
                  </svg>

                  {/* Accessible Full-Height Touch Columns aligned over the 7 day columns */}
                  <div
                    className="absolute top-0 bottom-0 grid grid-cols-7 z-10"
                    style={{ left: `${hitLeftPct}%`, width: `${hitWidthPct}%` }}
                  >
                    {trend.days.map((day) => (
                      <button
                        key={`tap-${day.dateStr}`}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedDateStr(day.dateStr);
                        }}
                        className="h-full w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-300/70 rounded-lg touch-manipulation"
                        aria-label={`${formatShortDate(day.dateStr)}: ${formatMinutesCompact(day.totalMinutes)}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Clean Context-Aware Legend */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-white/60 pt-2 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                    {viewMode === 'dayNight' ? (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-[2.5px] rounded-full bg-sky-300" />
                          {copy.legendNight}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-[2.5px] rounded-full bg-[#f5b895]" />
                          {copy.legendDay}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-slate-200">
                          <span className="w-3 h-[2.5px] rounded-full bg-slate-200" />
                          {copy.legendTotal}
                        </span>
                        {trend.ageTargetRangeText && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-300/90">
                            <span className="w-3 h-2 rounded-[2px] bg-emerald-400/25" />
                            {copy.legendTarget(trend.ageTargetRangeText)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {targetStatus && (
                    <span className={`font-medium ${targetStatus.colorClass}`}>
                      {targetStatus.text}
                    </span>
                  )}
                </div>

                {/* Compact 7-day Averages Strip */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/5 text-xs tabular-nums">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avgDailyLabel}</span>
                    <span className="font-semibold text-white">
                      {formatMinutesCompact(trend.avgDailyTotalMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avgNightLabel}</span>
                    <span className="font-semibold text-sky-200">
                      {formatMinutesCompact(trend.avgNightSleepMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avgDayLabel}</span>
                    <span className="font-semibold text-[#f8cbb0]">
                      {formatMinutesCompact(trend.avgDayNapMinutes)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
