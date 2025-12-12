"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Code,
  Heading1,
  Heading2,
  Table as TableIcon,
  PlusSquare,
  MinusSquare,
  Trash2,
  Merge,
  Split
} from "lucide-react";
import { useEffect } from "react";
import { Label } from "@/components/common/ui/label/Label";
import { Table } from "@tiptap/extension-table";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const baseBtn = "p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300";
  const activeBtn = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg items-center">
      {/* Basic Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${baseBtn} ${editor.isActive("bold") ? activeBtn : ""}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${baseBtn} ${editor.isActive("italic") ? activeBtn : ""}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${baseBtn} ${editor.isActive("heading", { level: 1 }) ? activeBtn : ""}`}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${baseBtn} ${editor.isActive("heading", { level: 2 }) ? activeBtn : ""}`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${baseBtn} ${editor.isActive("bulletList") ? activeBtn : ""}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${baseBtn} ${editor.isActive("orderedList") ? activeBtn : ""}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Blocks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${baseBtn} ${editor.isActive("blockquote") ? activeBtn : ""}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${baseBtn} ${editor.isActive("codeBlock") ? activeBtn : ""}`}
        title="Code Block"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Table Controls */}
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={`${baseBtn}`}
        title="Insert Table"
      >
        <TableIcon size={16} />
      </button>

      {/* Conditional Table Controls - Only show when cursor is in a table */}
      {editor.isActive('table') && (
        <>
           <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
           
           <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={`${baseBtn}`}
            title="Add Column"
          >
            <PlusSquare size={16} className="rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={`${baseBtn} hover:text-red-500`}
            title="Delete Column"
          >
            <MinusSquare size={16} className="rotate-90" />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={`${baseBtn}`}
            title="Add Row"
          >
            <PlusSquare size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={`${baseBtn} hover:text-red-500`}
            title="Delete Row"
          >
            <MinusSquare size={16} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            className={`${baseBtn}`}
            title="Merge Cells"
          >
            <Merge size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            className={`${baseBtn}`}
            title="Split Cell"
          >
            <Split size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={`${baseBtn} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
            title="Delete Table"
          >
            <Trash2 size={16} />
          </button>
        </>
      )}

      <div className="flex-1" />

      {/* History */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={`${baseBtn} disabled:opacity-50`}
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={`${baseBtn} disabled:opacity-50`}
        title="Redo"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor = ({ value, onChange, label, error, disabled, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default link extension from StarterKit to avoid conflicts
        link: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
        },
      }),
      // Table Extensions with Tailwind styling
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-gray-300 dark:border-gray-600',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 p-2 align-top relative',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3 text-sm text-gray-800 dark:text-gray-200',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  }, []);

  // Handle form reset or external updates
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.isEmpty && value) {
         editor.commands.setContent(value);
      }
      if (value === "" && !editor.isEmpty) {
        editor.commands.clearContent();
      }
    }
  }, [value, editor]);

  return (
    <div className="w-full">
      {label && <Label className="mb-2">{label}</Label>}
      <div className={`
        border rounded-lg overflow-hidden bg-white dark:bg-gray-900 transition-colors
        ${error 
          ? "border-red-500 dark:border-red-500" 
          : "border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      `}>
        <MenuBar editor={editor} />
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};