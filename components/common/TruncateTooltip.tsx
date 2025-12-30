// components/common/TruncateTooltip.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiCopy, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'sonner';

export interface TruncateTooltipProps {
  text: string | null | undefined;
  className?: string;
  id?: string;
  maxWidth?: number;
  renderAsHtml?: boolean;
  copyOnDoubleClick?: boolean; // NEW PROP
  onCopy?: () => void;
}

export const TruncateTooltip: React.FC<TruncateTooltipProps> = ({
  text,
  className,
  id,
  maxWidth = 320,
  renderAsHtml = false,
  copyOnDoubleClick = false, // Default false
  onCopy,
}) => {
  const displayText = text ?? '';
  
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  
  const textRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const tooltipId = `tt-${id ?? Math.random().toString(36).slice(2)}`;

  const checkOverflow = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    // Allow a small tolerance (1px) for sub-pixel rendering differences
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowing(hasOverflow);
  }, []);

  useEffect(() => {
    // Check on mount and resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, displayText]);

  // Re-check on hover to ensure state is accurate before showing
  const handleMouseEnter = () => {
    checkOverflow();
    if (!isLocked) {
      updatePosition();
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setIsHovered(false);
    }
  };

  const updatePosition = useCallback(() => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      const top = rect.bottom + 8;
      let left = rect.left;

      // Prevent going off right edge
      if (left + maxWidth > viewportWidth) {
        left = viewportWidth - maxWidth - 16;
      }
      // Prevent going off left edge
      if (left < 16) left = 16;

      setCoords({ top, left });
    }
  }, [maxWidth]);

  const doCopy = async () => {
    try {
      const textToCopy = renderAsHtml 
        ? displayText.replace(/<[^>]*>?/gm, '') 
        : displayText;
        
      await navigator.clipboard.writeText(textToCopy);
      setJustCopied(true);
      toast.success("Copied to clipboard");
      if (onCopy) onCopy();
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy");
    }
  };

  // Single Click: Toggle Lock (Only if truncated)
  const handleClick = (e: React.MouseEvent) => {
    if (isOverflowing) {
      e.stopPropagation();
      updatePosition();
      setIsLocked((prev) => !prev);
      setIsHovered(false);
    }
  };

  // Double Click: Copy (Always allowed if enabled)
  const handleDoubleClick = async (e: React.MouseEvent) => {
    if (copyOnDoubleClick) {
      e.stopPropagation();
      e.preventDefault(); // Prevent text selection
      await doCopy();
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLocked(false);
    setIsHovered(false);
  };

  // Close on Escape / Outside Click
  useEffect(() => {
    if (!isLocked) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) && 
        textRef.current && !textRef.current.contains(e.target as Node)
      ) {
        setIsLocked(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLocked(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('scroll', updatePosition, true); 

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', updatePosition, true);
    };
  }, [isLocked, updatePosition]);

  // Show tooltip if hovered/locked AND (overflowing OR locked)
  // We allow showing it if locked even if not strictly overflowing (rare case, but safe)
  const showTooltip = (isHovered && isOverflowing) || isLocked;

  return (
    <>
      <span
        ref={textRef}
        className={`truncate block max-w-full overflow-hidden min-w-0 flex-1 cursor-default ${
          isLocked ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-1 rounded -ml-1' : ''
        } ${className ?? ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        tabIndex={isOverflowing ? 0 : -1}
        aria-describedby={showTooltip ? tooltipId : undefined}
        title={undefined} // Remove native tooltip
        {...(renderAsHtml ? { dangerouslySetInnerHTML: { __html: displayText } } : {})}
      >
        {!renderAsHtml ? displayText : null}
      </span>

      {showTooltip && (
        <Portal>
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={`
              fixed z-9999 flex flex-col gap-2 rounded-lg shadow-xl border
              text-sm wrap-wrap-break-word whitespace-normal
              transition-all duration-200 ease-in-out
              ${isLocked 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-blue-500 ring-2 ring-blue-500/20 pointer-events-auto' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-500 ring-2 ring-gray-500/20 pointer-events-none px-3 py-2'
              }
            `}
            style={{ 
              top: coords.top, 
              left: coords.left, 
              maxWidth: maxWidth,
              minWidth: '200px'
            }}
          >
            <div className={`${isLocked ? 'p-3 max-h-[300px] overflow-y-auto custom-scrollbar' : ''} select-text`}>
              {renderAsHtml ? <div dangerouslySetInnerHTML={{ __html: displayText }} /> : displayText}
            </div>

            {isLocked && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                <div className="text-xs text-gray-800 italic">
                  {copyOnDoubleClick ? "Double-click text to copy" : "Select text to copy"}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); doCopy(); }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Copy content"
                  >
                    {justCopied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded text-gray-500 transition-colors"
                    title="Close tooltip"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Portal>
      )}
    </>
  );
};

const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === 'undefined') return null;
  return createPortal(children, document.body);
};

export default TruncateTooltip;