import { PortDisplayInfo } from "@/components/map/ClientRingMap/types";

export const getReadableTextColor = (bgColor: string): string => {
  const c = bgColor.substring(1);
  const rgb = parseInt(c, 16);
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
  isDark: boolean
) => {
  const bgClass = isDark ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-slate-50' : 'text-slate-900';
  const borderClass = isDark ? 'border-slate-600' : 'border-slate-300';

  let portsHtml = '';
  if (ports.length > 0) {
    const visiblePorts = ports.slice(0, 6);
    const hiddenCount = ports.length - 6;

    const portItems = visiblePorts
      .map((p) => {
        const textColor = getReadableTextColor(p.color);
        return `<div class="px-1 font-bold py-px text-[12px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap" style="background-color: ${p.color}; color: ${textColor}; border-color: rgba(255,255,255,0.3)"><span>${p.port}</span></div>`;
      })
      .join('');

    const moreItem =
      hiddenCount > 0
        ? `<div class="text-[9px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">+${hiddenCount}</div>`
        : '';

    portsHtml = `<div class="mt-1 flex flex-row gap-px items-center justify-center max-w-[200px]">${portItems}${moreItem}</div>`;
  }

  return `
    <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto">
      <div class="px-2 py-1 text-[13px] font-bold rounded-md border shadow-lg backdrop-blur-md whitespace-nowrap z-10 ${bgClass} ${textClass} ${borderClass}">
        ${name} ${
    ip ? `<span class="font-mono font-normal opacity-80 text-[11px] ml-1">| ${ip}</span>` : ''
  }
      </div>
      ${portsHtml}
    </div>
  `;
};