import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  Copy,
  FileSpreadsheet,
  FileText,
  Share2,
} from 'lucide-react';
import { Language, SleepSession } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  SummaryPeriodDays,
  buildPediatricSummary,
  copyTextWithFallback,
  exportPediatricCsvReport,
  formatMinutesCompact,
  formatPediatricPlainTextReport,
  getPediatricSummaryCopy,
  sharePediatricTextReport,
} from '../utils/pediatricSummary';

interface PediatricSummarySectionProps {
  sessions: SleepSession[];
  language: Language;
  babyName?: string;
  babyBirthDate?: string;
  onNotify: (message: string) => void;
}

export const PediatricSummarySection: React.FC<PediatricSummarySectionProps> = ({
  sessions,
  language,
  babyName,
  babyBirthDate,
  onNotify,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [periodDays, setPeriodDays] = useState<SummaryPeriodDays>(7);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const copy = getPediatricSummaryCopy(language);

  const report = useMemo(
    () => buildPediatricSummary(sessions, periodDays, babyName, babyBirthDate),
    [sessions, periodDays, babyName, babyBirthDate]
  );

  const plainTextReport = useMemo(
    () => formatPediatricPlainTextReport(report, language),
    [report, language]
  );

  const hasData = report.totalSessionsCount > 0;

  const handleShareText = async () => {
    if (!hasData || isBusy) return;
    triggerHaptic('medium');
    setIsBusy(true);
    try {
      const outcome = await sharePediatricTextReport(report, language);
      if (outcome === 'shared') {
        onNotify(copy.toastShared);
      } else if (outcome === 'copied') {
        onNotify(copy.toastCopied);
      }
    } catch {
      onNotify(copy.toastError);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyText = async () => {
    if (!hasData || isBusy) return;
    triggerHaptic('light');
    const ok = await copyTextWithFallback(plainTextReport);
    onNotify(ok ? copy.toastCopied : copy.toastError);
  };

  const handleExportCsv = async () => {
    if (!hasData || isBusy) return;
    triggerHaptic('medium');
    setIsBusy(true);
    try {
      const outcome = await exportPediatricCsvReport(report, language);
      if (outcome === 'shared') {
        onNotify(copy.toastCsvShared);
      } else if (outcome === 'downloaded') {
        onNotify(copy.toastCsvDownloaded);
      } else if (outcome === 'saved_documents') {
        onNotify(copy.toastCsvSaved);
      }
    } catch {
      onNotify(copy.toastError);
    } finally {
      setIsBusy(false);
    }
  };

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
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-white/85 truncate">
            {copy.sectionTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-white/50 tabular-nums whitespace-nowrap">
            {periodDays === 7 ? copy.period7d : copy.period14d}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/55 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOpen ? 'rotate-180 text-amber-300' : ''
            }`}
          />
        </div>
      </button>

      {/* Smooth Unrolling Content */}
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
            {/* Subtitle + Segmented 7d / 14d Period Switcher */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-white/55 leading-snug">{copy.sectionSubtitle}</p>
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.06] border border-white/10 shrink-0">
                {([7, 14] as SummaryPeriodDays[]).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPeriodDays(days);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap touch-manipulation ${
                      periodDays === days
                        ? 'bg-emerald-400 text-slate-950 shadow-sm'
                        : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {days === 7 ? copy.period7d : copy.period14d}
                  </button>
                ))}
              </div>
            </div>

            {!hasData ? (
              <p className="py-3 text-center text-xs text-white/50">
                {copy.noDataInPeriod(periodDays)}
              </p>
            ) : (
              <>
                {/* Quiet Metadata Line */}
                <div className="text-[11px] text-white/55 tabular-nums">
                  {copy.daysRecordedMeta(
                    report.loggedDaysCount,
                    report.periodDays,
                    report.totalSessionsCount
                  )}
                </div>

                {/* Compact Metric Summary Row */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-white/5 text-[11px] tabular-nums">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avg24hLabel}</span>
                    <span className="font-bold text-white">
                      {formatMinutesCompact(report.avgDailyTotalMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avgDayLabel}</span>
                    <span className="font-semibold text-amber-200">
                      {formatMinutesCompact(report.avgDayNapMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/45">{copy.avgNightLabel}</span>
                    <span className="font-semibold text-indigo-200">
                      {formatMinutesCompact(report.avgNightSleepMinutes)}
                    </span>
                  </div>
                </div>

                {/* Typical Bedtime & Wake-up Times */}
                {(report.typicalBedtime || report.typicalWakeTime) && (
                  <div className="flex items-center gap-4 text-[11px] text-white/70 tabular-nums">
                    {report.typicalBedtime && (
                      <span>
                        {copy.bedtimeLabel}:{' '}
                        <strong className="text-white font-semibold">
                          ~{report.typicalBedtime}
                        </strong>
                      </span>
                    )}
                    {report.typicalWakeTime && (
                      <span>
                        {copy.wakeupLabel}:{' '}
                        <strong className="text-white font-semibold">
                          ~{report.typicalWakeTime}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleShareText}
                    className="w-full min-h-[42px] py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all touch-manipulation shadow-md disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{copy.shareTextBtn}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleCopyText}
                      className="min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white/90 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="truncate">{copy.copyTextBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleExportCsv}
                      className="min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white/90 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span className="truncate">{copy.exportCsvBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Collapsible Plain-Text Preview */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowTextPreview((prev) => !prev);
                    }}
                    className="text-[11px] font-medium text-white/55 hover:text-amber-200 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    {showTextPreview ? copy.previewToggleHide : copy.previewToggleShow}
                  </button>

                  {showTextPreview && (
                    <pre className="mt-2 p-3 rounded-xl bg-slate-950/85 border border-white/10 text-[11px] leading-relaxed text-white/80 font-mono whitespace-pre-wrap break-words max-h-52 overflow-y-auto select-text">
                      {plainTextReport}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
