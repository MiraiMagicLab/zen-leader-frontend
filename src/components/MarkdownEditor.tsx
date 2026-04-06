import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownEditorProps {
  id?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
}

const FORMAT_ACTIONS = [
  { icon: "format_bold",        title: "Bold",   wrap: ["**", "**"] },
  { icon: "format_italic",      title: "Italic", wrap: ["_", "_"] },
  { icon: "format_list_bulleted", title: "List",   prefix: "- " },
  { icon: "link",               title: "Link",   wrap: ["[", "](url)"] },
]

export default function MarkdownEditor({ id = "md-editor", value, onChange, placeholder, rows = 8 }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write")

  const applyFormat = (action: typeof FORMAT_ACTIONS[0]) => {
    const textarea = document.getElementById(id) as HTMLTextAreaElement
    if (!textarea) return
    const { selectionStart: s, selectionEnd: e } = textarea
    const selected = value.slice(s, e)

    let result = value
    if (action.wrap) {
      const [open, close] = action.wrap
      result = value.slice(0, s) + open + selected + close + value.slice(e)
    } else if (action.prefix) {
      result = value.slice(0, s) + action.prefix + selected + value.slice(e)
    }
    onChange(result)
    setTimeout(() => {
      textarea.focus()
      const newPos = s + (action.wrap ? action.wrap[0].length : action.prefix!.length) + selected.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
      {/* Tabs + Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-surface-container-low">
        {/* Format buttons (only in write mode) */}
        <div className="flex items-center gap-0.5">
          {tab === "write" && FORMAT_ACTIONS.map((a) => (
            <button
              key={a.title}
              type="button"
              title={a.title}
              onClick={() => applyFormat(a)}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">{a.icon}</span>
            </button>
          ))}
        </div>

        {/* Write / Preview toggle */}
        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                tab === t
                  ? "bg-white text-secondary shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Write */}
      {tab === "write" && (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder ?? "Write with **bold**, _italic_, - lists..."}
          className="w-full px-4 py-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none resize-none bg-transparent font-mono leading-relaxed"
        />
      )}

      {/* Preview */}
      {tab === "preview" && (
        <div
          className="px-4 py-4 min-h-[120px] text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-strong:text-slate-900
            prose-ul:pl-5 prose-ul:list-disc
            prose-ol:pl-5 prose-ol:list-decimal
            prose-a:text-secondary prose-a:underline
            prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
            prose-blockquote:border-l-4 prose-blockquote:border-secondary/30 prose-blockquote:pl-4 prose-blockquote:text-slate-500 prose-blockquote:italic
          "
          style={{ minHeight: `${rows * 1.75}rem` }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-300 italic">Nothing to preview yet...</p>
          )}
        </div>
      )}
    </div>
  )
}
