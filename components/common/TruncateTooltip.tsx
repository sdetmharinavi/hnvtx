// @/components/common/TruncateTooltip.tsx
import React, { useEffect, useRef, useState } from "react";

export interface TruncateTooltipProps {
  /**
   * Accepts plain text or HTML content as string.
   */
  text: string;
  className?: string;
  /**
   * Optional id suffix for ARIA. If omitted, a random id will be generated.
   */
  id?: string;
  /**
   * Optional: control max width of tooltip in px. Default 320.
   */
  maxWidth?: number;
  /**
   * Whether to render text as HTML.
   * If true, content will use dangerouslySetInnerHTML.
   */
  renderAsHtml?: boolean;
}

/**
 * Renders truncated single-line text and shows a custom tooltip on hover/focus
 * only when the content is visually truncated.
 */
export const TruncateTooltip: React.FC<TruncateTooltipProps> = ({
  text,
  className,
  id,
  maxWidth = 320,
  renderAsHtml = false,
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const textRef = useRef<HTMLSpanElement>(null);
  const tooltipId = `tt-${id ?? Math.random().toString(36).slice(2)}`;

  const checkOverflow = () => {
    const el = textRef.current;
    if (!el) return false;
    const overflow = el.scrollWidth > el.clientWidth;
    setIsOverflowing(overflow);
    return overflow;
  };

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    checkOverflow();
    const ro = new ResizeObserver(() => checkOverflow());
    ro.observe(el);
    const onWin = () => checkOverflow();
    window.addEventListener("resize", onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, []);

  const show = () => {
    if (checkOverflow()) {
      const el = textRef.current!;
      const rect = el.getBoundingClientRect();
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - maxWidth - 8);
      setPos({ top: rect.bottom + 8, left });
      setShowTooltip(true);
    }
  };
  const hide = () => setShowTooltip(false);

  return (
    <>
      <span
        ref={textRef}
        className={`truncate block max-w-full overflow-hidden min-w-0 flex-1 ${className ?? ""}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={isOverflowing ? 0 : -1}
        aria-describedby={showTooltip && isOverflowing ? tooltipId : undefined}
        {...(renderAsHtml ? { dangerouslySetInnerHTML: { __html: text } } : {})}
      >
        {!renderAsHtml ? text : null}
      </span>

      {showTooltip && isOverflowing && (
        <div
          id={tooltipId}
          role="tooltip"
          className="fixed px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-300 whitespace-normal break-words pointer-events-none z-[9999]"
          style={{ top: pos.top, left: pos.left, maxWidth }}
          {...(renderAsHtml ? { dangerouslySetInnerHTML: { __html: text } } : {})}
        >
          {!renderAsHtml ? text : null}
        </div>
      )}
    </>
  );
};

export default TruncateTooltip;

