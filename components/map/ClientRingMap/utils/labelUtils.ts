// components/map/ClientRingMap/utils/labelUtils.ts
import { PortDisplayInfo } from "@/components/map/ClientRingMap/types";
import { V_port_power_readingsRowSchema } from "@/schemas/zod-schemas";
import { formatDate } from "@/utils/formatters";

export const getReadableTextColor = (bgColor: string): string => {
  let c = bgColor.trim();
  
  if (!c.startsWith('#') || (c.length !== 4 && c.length !== 7)) {
    return '#ffffff';
  }

  c = c.substring(1);
  if (c.length === 3) c = c.split('').map(char => char + char).join('');

  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return '#ffffff'; 

  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
};

export const createLabelHtml = (
  name: string,
  ip: string | null,
  ports: PortDisplayInfo[],
  isDark: boolean,
  rotation: number = 0,
  showPowerLevels: boolean = false,
  systemId: string | null = null,
  powerData: Record<string, V_port_power_readingsRowSchema> = {}
) => {
  const bgClass = isDark ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-slate-50' : 'text-slate-900';
  const borderClass = isDark ? 'border-slate-600' : 'border-slate-300';

  let contentHtml = '';

  if (showPowerLevels && systemId && ports.length > 0) {
    const rowsHtml = ports.map((p) => {
      // THE FIX: Match the forceful lowercase trimming logic exactly
      const safeSysId = String(systemId).toLowerCase().trim();
      const safePort = String(p.port).toLowerCase().trim();
      const readingKey = `${safeSysId}_${safePort}`;
      
      const reading = powerData[readingKey];
      
      const tx = reading?.tx_power != null ? reading.tx_power.toFixed(2) : '--';
      const rx = reading?.rx_power != null ? reading.rx_power.toFixed(2) : '--';
      const dateStr = reading?.reading_date 
        ? formatDate(reading.reading_date, { format: 'dd MMM yyyy' }) 
        : 'N/A';
        
      const textColor = getReadableTextColor(p.color);

      const txColorClass = reading?.tx_power != null ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500';
      const rxColorClass = reading?.rx_power != null ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500';

      return `
        <tr class="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <td class="py-1 px-2 whitespace-nowrap">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold" style="background-color: ${p.color}; color: ${textColor};">
              ${p.port}
            </span>
          </td>
          <td class="py-1 px-2 font-mono text-[14px] font-bold ${txColorClass} text-right">${tx}</td>
          <td class="py-1 px-2 font-mono text-[14px] font-bold ${rxColorClass} text-right">${rx}</td>
          <td class="py-1 px-2 text-[11px] text-slate-500 whitespace-nowrap text-right">${dateStr}</td>
        </tr>
      `;
    }).join('');

    contentHtml = `
      <div class="mt-1 bg-white dark:bg-slate-800 border ${borderClass} rounded-lg shadow-xl overflow-hidden pointer-events-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase text-slate-500 font-bold border-b ${borderClass}">
            <tr>
              <th class="py-1.5 px-2">Port</th>
              <th class="py-1.5 px-2 text-right">Tx</th>
              <th class="py-1.5 px-2 text-right">Rx</th>
              <th class="py-1.5 px-2 text-right">Last Log</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } else if (ports.length > 0) {
    const VISIBLE_LIMIT = 8;
    const visiblePorts = ports.slice(0, VISIBLE_LIMIT);
    const hiddenCount = ports.length - VISIBLE_LIMIT;

    const portItems = visiblePorts
      .map((p) => {
        const textColor = getReadableTextColor(p.color);
        return `<div class="px-1 font-bold py-px text-[12px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap" style="background-color: ${p.color}; color: ${textColor}; border-color: rgba(255,255,255,0.3)"><span>${p.port}</span></div>`;
      })
      .join('');

    const moreItem =
      hiddenCount > 0
        ? `<div class="text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">+${hiddenCount}</div>`
        : '';

    contentHtml = `<div class="mt-1 flex flex-row gap-px items-center justify-center max-w-[240px] pointer-events-auto">${portItems}${moreItem}</div>`;
  }

  const transformStyle = rotation !== 0 ? `transform: rotate(${-rotation}deg);` : '';

  return `
    <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto" style="${transformStyle}">
      <div class="px-2 py-1 text-[13px] font-bold rounded-md border shadow-lg backdrop-blur-md whitespace-nowrap z-10 ${bgClass} ${textClass} ${borderClass}">
        ${name} ${ip ? `<span class="font-mono font-normal opacity-80 text-[11px] ml-1">| ${ip}</span>` : ''}
      </div>
      ${contentHtml}
    </div>
  `;
};