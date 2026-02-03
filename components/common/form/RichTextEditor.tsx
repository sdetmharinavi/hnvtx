// components/common/form/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent, Editor, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Table } from '@tiptap/extension-table';
import EmojiExtension from '@tiptap/extension-emoji'; // Import Emoji
import { ExcalidrawExtension } from './extensions/ExcalidrawNode'; // Import Diagram
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'; // Import Picker
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Table as TableIcon,
  PlusSquare,
  MinusSquare,
  Trash2,
  Merge,
  Split,
  Type,
  Smile,
  PenTool,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/common/ui/label/Label';
import { useThemeStore } from '@/stores/themeStore'; // For Emoji Picker Theme

// --- EXISTING CUSTOM EXTENSIONS (TextStyle, FontSize) REMAIN UNCHANGED ---

const TextStyle = Mark.create({
  name: 'textStyle',
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => ((element as HTMLElement).hasAttribute('style') ? {} : false),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    excalidraw: {
      setExcalidraw: () => ReturnType;
    };
  }
}

const FontSize = Mark.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useThemeStore();

  // Fix: Moved useEffect before the conditional return
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)) {
        // Check if click is inside the picker (it renders in a portal usually or absolute)
        const picker = document.querySelector('.EmojiPickerReact');
        if (picker && !picker.contains(event.target as Node)) {
          setShowEmojiPicker(false);
        }
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Fix: Conditional return is now SAFE after all hooks are called
  if (!editor) return null;

  const baseBtn =
    'p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 flex items-center justify-center relative';
  const activeBtn = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';

  const fontSizes = [
    { label: 'Default', value: '' },
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '30px', value: '30px' },
  ];

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';

  return (
    <div className='flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg items-center z-20 relative'>
      {/* Font Size Dropdown */}
      <div className='relative flex items-center mr-1'>
        <Type size={14} className='absolute left-2 text-gray-400 pointer-events-none' />
        <select
          value={currentFontSize}
          onChange={(e) => {
            const size = e.target.value;
            if (size) editor.chain().focus().setFontSize(size).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
          className='pl-7 pr-2 py-1 h-8 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500'
          title='Font Size'>
          {fontSizes.map((size) => (
            <option key={size.label} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      <div className='w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1' />

      {/* Basic Formatting */}
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${baseBtn} ${editor.isActive('bold') ? activeBtn : ''}`}
        title='Bold (Ctrl+B)'>
        <Bold size={16} />
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${baseBtn} ${editor.isActive('italic') ? activeBtn : ''}`}
        title='Italic (Ctrl+I)'>
        <Italic size={16} />
      </button>

      <div className='w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1' />

      {/* Headings */}
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${baseBtn} ${editor.isActive('heading', { level: 1 }) ? activeBtn : ''}`}
        title='Heading 1'>
        <Heading1 size={16} />
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${baseBtn} ${editor.isActive('heading', { level: 2 }) ? activeBtn : ''}`}
        title='Heading 2'>
        <Heading2 size={16} />
      </button>

      {/* Lists */}
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${baseBtn} ${editor.isActive('bulletList') ? activeBtn : ''}`}
        title='Bullet List'>
        <List size={16} />
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${baseBtn} ${editor.isActive('orderedList') ? activeBtn : ''}`}
        title='Ordered List'>
        <ListOrdered size={16} />
      </button>

      <div className='w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1' />

      {/* Rich Features: Emojis & Diagrams */}
      <div className='relative'>
        <button
          ref={emojiButtonRef}
          type='button'
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`${baseBtn} ${showEmojiPicker ? activeBtn : ''}`}
          title='Insert Emoji'>
          <Smile size={16} />
        </button>

        {showEmojiPicker && (
          <div className='absolute top-full left-0 mt-2 z-50 shadow-xl rounded-lg'>
            <EmojiPicker
              theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
              onEmojiClick={(emojiData) => {
                editor.chain().focus().insertContent(emojiData.emoji).run();
                setShowEmojiPicker(false);
              }}
              width={300}
              height={400}
            />
          </div>
        )}
      </div>

      <button
        type='button'
        onClick={() => {
          // Insert Excalidraw Node
          editor
            .chain()
            .focus()
            .insertContent({ type: 'excalidraw', attrs: { data: '[]' } })
            .run();
        }}
        className={baseBtn}
        title='Insert Drawing/Diagram'>
        <PenTool size={16} />
      </button>

      <div className='w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1' />

      {/* Table Controls (unchanged) */}
      <button
        type='button'
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className={`${baseBtn}`}
        title='Insert Table'>
        <TableIcon size={16} />
      </button>
      {editor.isActive('table') && (
        <>
          <div className='w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1' />
          <button
            type='button'
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={`${baseBtn}`}
            title='Add Column'>
            <PlusSquare size={16} className='rotate-90' />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={`${baseBtn} hover:text-red-500`}
            title='Delete Column'>
            <MinusSquare size={16} className='rotate-90' />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={`${baseBtn}`}
            title='Add Row'>
            <PlusSquare size={16} />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={`${baseBtn} hover:text-red-500`}
            title='Delete Row'>
            <MinusSquare size={16} />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().mergeCells().run()}
            className={`${baseBtn}`}
            title='Merge Cells'>
            <Merge size={16} />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().splitCell().run()}
            className={`${baseBtn}`}
            title='Split Cell'>
            <Split size={16} />
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={`${baseBtn} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
            title='Delete Table'>
            <Trash2 size={16} />
          </button>
        </>
      )}

      <div className='flex-1' />
      <button
        type='button'
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={`${baseBtn} disabled:opacity-50`}
        title='Undo'>
        <Undo size={16} />
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={`${baseBtn} disabled:opacity-50`}
        title='Redo'>
        <Redo size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor = ({
  value,
  onChange,
  label,
  error,
  disabled,
  placeholder,
}: RichTextEditorProps) => {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          link: false,
          // Enabling History is default in StarterKit
        }),
        TextStyle,
        FontSize,
        EmojiExtension, // Shortcode support :smile:
        ExcalidrawExtension, // Drawing Support
        LinkExtension.configure({
          openOnClick: false,
          autolink: true, // Auto-detect links
          HTMLAttributes: { class: 'text-blue-500 hover:underline cursor-pointer' },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class:
              'border-collapse table-auto w-full my-4 border border-gray-300 dark:border-gray-600',
          },
        }),
        TableRow,
        TableHeader.configure({
          HTMLAttributes: {
            class:
              'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 font-semibold text-left',
          },
        }),
        TableCell.configure({
          HTMLAttributes: {
            class: 'border border-gray-300 dark:border-gray-600 p-2 align-top relative',
          },
        }),
      ],
      editorProps: {
        attributes: {
          // THE FIX: Added `max-h-[50vh] overflow-y-auto custom-scrollbar`
          // This forces the editor to scroll internally when content exceeds 50vh,
          // preventing the modal from growing uncontrollably.
          class:
            'prose dark:prose-invert max-w-none focus:outline-none min-h-[150px] max-h-[80vh] overflow-y-auto custom-scrollbar px-4 py-3 text-sm text-gray-800 dark:text-gray-200 [&_table]:w-full [&_td]:min-w-[100px]',
          // Native Spellcheck enabled (browser default behavior)
          spellcheck: 'true',
        },
      },
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      immediatelyRender: false,
    },
    [],
  );

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.isEmpty && value) {
        editor.commands.setContent(value);
      } else if (value === '' && !editor.isEmpty) {
        editor.commands.clearContent();
      }
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (editor) editor.destroy();
    };
  }, [editor]);

  return (
    <div className='w-full'>
      {label && <Label className='mb-2'>{label}</Label>}
      <div
        className={`border rounded-lg bg-white dark:bg-gray-900 transition-colors flex flex-col ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <MenuBar editor={editor} />
        {/*
            The EditorContent div wraps the Tiptap instance.
            The max-height logic is applied directly to the .ProseMirror class via editorProps above,
            but adding it here too ensures container constraint.
        */}
        <div className='overflow-x-auto w-full rounded-b-lg'>
          <EditorContent editor={editor} placeholder={placeholder} />
        </div>
      </div>
      {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
    </div>
  );
};