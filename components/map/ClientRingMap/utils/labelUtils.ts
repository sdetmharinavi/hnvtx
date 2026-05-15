// components/map/ClientRingMap/utils/labelUtils.ts
import { PortDisplayInfo } from "@/components/map/ClientRingMap/types";

// THE FIX: Robust hex to RGB converter handling both 3-digit and 6-digit hex codes
export const getReadableTextColor = (bgColor: string): string => {
  let c = bgColor.trim();
  
  // Basic validation - if it's not a hex code (e.g. named colors, rgb(), or empty), default to white
  if (!c.startsWith('#') || (c.length !== 4 && c.length !== 7)) {
    return '#ffffff';
  }

  // Remove the hash
  c = c.substring(1);
  
  // Expand 3-digit hex to 6-digit (e.g. "F00" -> "FF0000")
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }

  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return '#ffffff'; // Fallback if parsing failed

  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  
  // Standard perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
};

export const createLabelHtml = (
  name: string,
  ip: string | null,
  ports: PortDisplayInfo[],
  isDark: boolean,
  rotation: number = 0
) => {
  const bgClass = isDark ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-slate-50' : 'text-slate-900';
  const borderClass = isDark ? 'border-slate-600' : 'border-slate-300';

  let portsHtml = '';
  if (ports.length > 0) {
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
        ? `<div class="text-9px text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">+${hiddenCount}</div>`
        : '';

    portsHtml = `<div class="mt-1 flex flex-row gap-px items-center justify-center max-w-240px">${portItems}${moreItem}</div>`;
  }

  const transformStyle = rotation !== 0 ? `transform: rotate(${-rotation}deg);` : '';

  return `
    <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto" style="${transformStyle}">
      <div class="px-2 py-1 text-[13px] font-bold rounded-md border shadow-lg backdrop-blur-md whitespace-nowrap z-10 ${bgClass} ${textClass} ${borderClass}">
        ${name} ${
    ip ? `<span class="font-mono font-normal opacity-80 text-[11px] ml-1">| ${ip}</span>` : ''
  }
      </div>
      ${portsHtml}
    </div>
  `;
};