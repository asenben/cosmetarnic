"use client";

import { BulletList } from "@tiptap/extension-list";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, Extension, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  IndentDecrease,
  IndentIncrease,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  type LucideIcon,
} from "lucide-react";

const MAX_INDENT = 4;

type BulletKind = "disc" | "check" | "dash";

// A bullet list that remembers which marker it uses; .rich-text in globals.css draws each kind.
const KindBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: "disc",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-kind") ?? "disc",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind }),
      },
    };
  },
});

// Lets a paragraph outside a list be moved in by a few steps; .rich-text turns the step into a margin.
const ParagraphIndent = Extension.create({
  name: "paragraphIndent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => Number(element.getAttribute("data-indent")) || 0,
            renderHTML: (attributes) => (attributes.indent > 0 ? { "data-indent": attributes.indent } : {}),
          },
        },
      },
    ];
  },
});

function toggleBullets(editor: Editor, kind: BulletKind) {
  const chain = editor.chain().focus();
  if (editor.isActive("bulletList", { kind })) chain.toggleBulletList().run();
  else if (editor.isActive("bulletList")) chain.updateAttributes("bulletList", { kind }).run();
  else chain.toggleBulletList().updateAttributes("bulletList", { kind }).run();
}

// Inside a list this nests the item one level deeper or shallower; elsewhere it moves the paragraph.
function changeIndent(editor: Editor, step: 1 | -1) {
  const chain = editor.chain().focus();
  if (editor.isActive("listItem")) {
    if (step === 1) chain.sinkListItem("listItem").run();
    else chain.liftListItem("listItem").run();
    return;
  }
  const current = Number(editor.getAttributes("paragraph").indent) || 0;
  chain.updateAttributes("paragraph", { indent: Math.min(MAX_INDENT, Math.max(0, current + step)) }).run();
}

const tools: ({ label: string; icon: LucideIcon; active?: string; run: (editor: Editor) => void } | "divider")[] = [
  { label: "Списък с точки", icon: List, active: "disc", run: (editor) => toggleBullets(editor, "disc") },
  {
    label: "Номериран списък",
    icon: ListOrdered,
    active: "number",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  { label: "Списък с отметки", icon: ListChecks, active: "check", run: (editor) => toggleBullets(editor, "check") },
  { label: "Списък с тирета", icon: Minus, active: "dash", run: (editor) => toggleBullets(editor, "dash") },
  "divider",
  { label: "Ред навътре", icon: IndentIncrease, run: (editor) => changeIndent(editor, 1) },
  { label: "Ред навън", icon: IndentDecrease, run: (editor) => changeIndent(editor, -1) },
];

type DescriptionFieldProps = {
  id: string;
  // The formatted description is submitted as HTML under this name, and its plain text under
  // `${name}_text` for checks such as the minimum length.
  name: string;
  // The description the editor starts with, as the HTML it produced earlier.
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  invalid?: boolean;
};

// A small word-processor for the listing's description: four kinds of lists and indenting, all
// shown as they will look. The text is always 16px: there is no size to choose, and the size of
// pasted text is dropped, since the editor has no way to keep it.
export default function DescriptionField({
  id,
  name,
  defaultValue = "",
  placeholder,
  maxLength,
  invalid,
}: DescriptionFieldProps) {
  const editor = useEditor({
    content: defaultValue,
    // Rendered on the client only: the server has no document to build the editor in.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: false,
        strike: false,
      }),
      KindBulletList,
      ParagraphIndent,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    editorProps: {
      attributes: {
        id,
        // Lets the form find and focus the editor by the field's name, like its other inputs.
        name,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Описание",
        class: "rich-text scrollbar-soft max-h-96 min-h-48 overflow-y-auto px-3.5 py-2.5 text-base text-brand-ink outline-none",
      },
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      const bullets = editor.isActive("bulletList") ? (editor.getAttributes("bulletList").kind as string) : null;
      return {
        html: editor.isEmpty ? "" : editor.getHTML(),
        text: editor.getText(),
        activeList: editor.isActive("orderedList") ? "number" : bullets,
      };
    },
  });

  return (
    <div className="mt-3">
      <div role="toolbar" aria-label="Оформяне на описанието" className="flex flex-wrap items-center gap-1.5">
        {tools.map((tool, index) =>
          tool === "divider" ? (
            <span key={index} className="mx-1 h-5 w-px bg-black/10" aria-hidden />
          ) : (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              aria-pressed={tool.active ? state?.activeList === tool.active : undefined}
              title={tool.label}
              // Keep the caret and the selection in the text while the button is pressed.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor && tool.run(editor)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-brand-ink/70 transition-colors hover:border-brand-rose/50 hover:bg-brand-rose/10 hover:text-brand-rose aria-pressed:border-brand-rose aria-pressed:bg-brand-rose/10 aria-pressed:text-brand-rose"
            >
              <tool.icon className="size-4" aria-hidden />
            </button>
          ),
        )}
      </div>

      <div
        aria-invalid={invalid}
        className="mt-2 rounded-xl border border-black/10 bg-white transition-colors focus-within:border-brand-rose aria-invalid:border-red-500"
      >
        <EditorContent editor={editor} />
      </div>
      {/* Until the editor has started, the description it was given stands in for its content. */}
      <input type="hidden" name={name} value={state?.html ?? defaultValue} />
      <input type="hidden" name={`${name}_text`} value={state?.text ?? defaultValue.replace(/<[^>]*>/g, " ")} />
    </div>
  );
}
