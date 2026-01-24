// components/common/form/extensions/ExcalidrawNode.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/common/ui/Button';
import { X, Maximize } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

// Import Excalidraw CSS
import '@excalidraw/excalidraw/index.css';

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Loading Editor..." />
      </div>
    ) 
  }
);

const exportToBlob = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.exportToBlob),
  { ssr: false }
);

export interface ExcalidrawAttributes {
  data: string; // JSON string of scene elements
  width: string | number;
  height: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExcalidrawComponent = (props: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawAPI = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const data = props.node.attrs.data ? JSON.parse(props.node.attrs.data) : [];

  // Force ready state after modal renders
  useLayoutEffect(() => {
    if (isEditing && containerRef.current) {
      // Small delay to ensure DOM is fully painted
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isEditing]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePreview = useCallback(async (elements: any[]) => {
    if (!elements || elements.length === 0) return;
    try {
      // @ts-expect-error - Dynamic import typing
      const blob = await (await exportToBlob)({
        elements,
        mimeType: 'image/png',
        appState: { viewBackgroundColor: '#ffffff' },
        files: null,
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      console.error('Failed to generate preview', e);
    }
  }, []);

  // Generate initial preview
  useEffect(() => {
    if (data.length > 0 && !previewUrl) {
      updatePreview(data);
    }
  }, [data, previewUrl, updatePreview]);

  const handleSave = async () => {
    if (excalidrawAPI.current) {
      const elements = excalidrawAPI.current.getSceneElements();
      props.updateAttributes({
        data: JSON.stringify(elements),
      });
      await updatePreview(elements);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="my-4 relative group block w-full">
      {/* Preview Card */}
      <div 
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-pointer relative min-h-[200px] flex items-center justify-center transition-all hover:ring-2 hover:ring-blue-500/50 hover:shadow-md"
        onClick={() => setIsEditing(true)}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={previewUrl} 
            alt="Diagram Preview" 
            className="max-w-full h-auto object-contain p-2" 
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <div className="text-gray-400 flex flex-col items-center p-8 gap-3">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <span className="text-4xl">🎨</span>
            </div>
            <span className="text-sm font-medium">Click to create diagram</span>
          </div>
        )}
        
        {/* Actions Overlay */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <Button 
            size="xs" 
            variant="secondary" 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Edit"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          <Button 
            size="xs" 
            variant="danger" 
            onClick={(e) => {
              e.stopPropagation();
              props.deleteNode();
            }}
            title="Delete"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors pointer-events-none" />
      </div>

      {/* Full-screen Editing Modal */}
      {isEditing && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[1800px] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-semibold">Edit Diagram</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Excalidraw Container */}
            <div 
              ref={containerRef}
              className="flex-1 min-h-0 w-full"
            >
              {isReady && (
                <div style={{ width: '100%', height: '100%' }}>
                  <Excalidraw
                    initialData={{ 
                      elements: data, 
                      appState: { 
                        viewBackgroundColor: "#ffffff", 
                        currentItemFontFamily: 1,
                      } 
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    excalidrawAPI={(api: any) => {
                      excalidrawAPI.current = api;
                    }}
                    theme="light"
                  />
                </div>
              )}
              {!isReady && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <LoadingSpinner text="Initializing editor..." />
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="shrink-0 flex justify-between items-center px-6 py-4 bg-white border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Double-click tools to keep them active.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Diagram
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const ExcalidrawExtension = Node.create({
  name: 'excalidraw',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      data: {
        default: '[]',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="excalidraw"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawComponent);
  },
});