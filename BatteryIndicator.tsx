import React, { useState, useEffect } from 'react';

interface BatteryIndicatorProps {
  className?: string;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  className = 'text-white/45',
}) => {
  const [level, setLevel] = useState<number>(85);

  useEffect(() => {
    let batteryInstance: any = null;

    const updateBattery = (battery: any) => {
      setLevel(Math.round(battery.level * 100));
    };

    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryInstance = battery;
          updateBattery(battery);

          battery.addEventListener('levelchange', () => updateBattery(battery));
        })
        .catch(() => {
          // If Battery API is not supported or rejected, keep a calm default
          setLevel(85);
        });
    }

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => {});
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const isLow = level < 10;
  // Compute inner fill width (clamped 4% - 100%)
  const fillWidth = Math.max(4, Math.min(100, level));

  return (
    <div
      className={`inline-flex items-center select-none pointer-events-none transition-colors duration-300 ${
        isLow ? 'text-red-500' : className
      }`}
      title={`Batéria: ${level}%`}
      aria-label={`Batéria ${level}%`}
    >
      <div className="relative flex items-center">
        {/* Main Body Shell - Pure delicate outline, no background box/podklad */}
        <div
          className={`w-[21px] h-[11px] rounded-[3px] border p-[1.5px] flex items-center transition-colors duration-300 ${
            isLow ? 'border-red-500' : 'border-current'
          }`}
        >
          {/* Fill bar - turns red below 10% */}
          <div
            className={`h-full rounded-[1px] transition-all duration-500 ${
              isLow ? 'bg-red-500' : 'bg-current'
            }`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>

        {/* Battery terminal positive tip */}
        <div
          className={`w-[1.5px] h-[4px] rounded-r-[1px] ml-[1px] transition-colors duration-300 ${
            isLow ? 'bg-red-500' : 'bg-current opacity-70'
          }`}
        />
      </div>
    </div>
  );
};
