// path: components/common/form/extensions/ExcalidrawNode.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/common/ui/Button';
import { X, Maximize } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

// Import Excalidraw CSS
import '@excalidraw/excalidraw/index.css';

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(() => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw), {
  ssr: false,
  loading: () => (
    <div className='h-full w-full flex items-center justify-center bg-gray-50'>
      <LoadingSpinner text='Loading Editor...' />
    </div>
  ),
});

export interface ExcalidrawAttributes {
  data: string; // JSON string of scene elements
  previewSrc: string | null; // THE FIX: Attribute to store the image Data URL
  width: string | number;
  height: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExcalidrawComponent = (props: any) => {
  const [isEditing, setIsEditing] = useState(false);
  // THE FIX: The preview URL is now derived directly from the node's attributes
  const [previewUrl, setPreviewUrl] = useState<string | null>(props.node.attrs.previewSrc);
  const [isReady, setIsReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawAPI = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const data = props.node.attrs.data ? JSON.parse(props.node.attrs.data) : [];

  useLayoutEffect(() => {
    if (isEditing && containerRef.current) {
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isEditing]);

  // THE FIX: The handleSave function now generates and saves a Data URL
  const handleSave = async () => {
    if (excalidrawAPI.current) {
      const elements = excalidrawAPI.current.getSceneElements();
      const jsonData = JSON.stringify(elements);
      let newPreviewSrc = null;

      if (elements && elements.length > 0) {
        try {
          // Use a dynamic import for the export function
          const { exportToCanvas } = await import('@excalidraw/excalidraw');
          const canvas = await exportToCanvas({
            elements,
            appState: { viewBackgroundColor: '#ffffff', exportWithDarkMode: false },
            files: null,
          });
          newPreviewSrc = canvas.toDataURL('image/png'); // Generate a base64 Data URL
        } catch (e) {
          console.error('Failed to generate data URL for preview', e);
        }
      }

      // Update the node attributes in the editor's state
      props.updateAttributes({
        data: jsonData,
        previewSrc: newPreviewSrc, // Save the new Data URL
      });

      setPreviewUrl(newPreviewSrc); // Update local state for immediate preview
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className='my-4 relative group block w-full'>
      {/* Preview Card */}
      <div
        className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-pointer relative min-h-[200px] flex items-center justify-center transition-all hover:ring-2 hover:ring-blue-500/50 hover:shadow-md'
        onClick={() => setIsEditing(true)}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt='Diagram Preview'
            className='max-w-full h-auto object-contain p-2'
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <div className='text-gray-400 flex flex-col items-center p-8 gap-3'>
            <div className='p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm'>
              <span className='text-4xl'>🎨</span>
            </div>
            <span className='text-sm font-medium'>Click to create diagram</span>
          </div>
        )}

        {/* Actions Overlay */}
        <div className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10'>
          <Button
            size='xs'
            variant='secondary'
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title='Edit'
          >
            <Maximize className='w-4 h-4' />
          </Button>
          <Button
            size='xs'
            variant='danger'
            onClick={(e) => {
              e.stopPropagation();
              props.deleteNode();
            }}
            title='Delete'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>

        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors pointer-events-none' />
      </div>

      {/* Full-screen Editing Modal */}
      {isEditing && (
        <div
          className='fixed inset-0 z-9999 bg-black/50 flex items-center justify-center p-4'
          onClick={handleCancel}
        >
          <div
            className='bg-white rounded-lg shadow-2xl w-full h-full max-w-[1800px] max-h-[90vh] flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0'>
              <h2 className='text-xl font-semibold'>Edit Diagram</h2>
              <button
                onClick={handleCancel}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Excalidraw Container */}
            <div ref={containerRef} className='flex-1 min-h-0 w-full'>
              {isReady && (
                <div style={{ width: '100%', height: '100%' }}>
                  <Excalidraw
                    initialData={{
                      elements: data,
                      appState: {
                        viewBackgroundColor: '#ffffff',
                        currentItemFontFamily: 1,
                      },
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    excalidrawAPI={(api: any) => {
                      excalidrawAPI.current = api;
                    }}
                    theme='light'
                  />
                </div>
              )}
              {!isReady && (
                <div className='w-full h-full flex items-center justify-center bg-gray-50'>
                  <LoadingSpinner text='Initializing editor...' />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='shrink-0 flex justify-between items-center px-6 py-4 bg-white border-t border-gray-200'>
              <div className='text-xs text-gray-500'>Double-click tools to keep them active.</div>
              <div className='flex gap-3'>
                <Button variant='outline' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant='primary' onClick={handleSave}>
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
      // THE FIX: Add the previewSrc attribute to store the image Data URL
      previewSrc: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-type="excalidraw"]',
        getAttrs: (dom) => {
          const element = dom as HTMLImageElement;
          return {
            // When loading saved HTML, we get the src but lose the raw data.
            // This is okay, as the image will still render. Re-editing will
            // start from a blank canvas if the `data` attribute isn't also saved.
            // For full fidelity, we'd need to save the data attribute on the img tag.
            previewSrc: element.getAttribute('src'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // THE FIX: Render an <img> tag if a preview source exists.
    if (HTMLAttributes.previewSrc) {
      return [
        'img',
        mergeAttributes(HTMLAttributes, {
          'data-type': 'excalidraw',
          src: HTMLAttributes.previewSrc,
          alt: 'Excalidraw Diagram',
          style: 'max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;',
        }),
      ];
    }
    // Fallback for nodes that might not have a preview yet.
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawComponent);
  },
});
