import MDEditor from "@uiw/react-md-editor"
import { useTheme } from "@/components/providers/ThemeProvider"
import "./MarkdownEditor.css"

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  height?: number
  readOnly?: boolean
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = 400,
  readOnly = false,
}: MarkdownEditorProps) {
  const { theme } = useTheme()
  const mode = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme

  return (
    <div className="w-full markdown-editor-container" data-color-mode={mode}>
      <MDEditor
        value={value}
        onChange={(val?: string) => onChange(val ?? "")}
        height={height}
        preview={readOnly ? "preview" : "live"}
        hideToolbar={readOnly}
        textareaProps={{
          placeholder,
        }}
      />
    </div>
  )
}

export function MarkdownRenderer({ content }: { content: string }) {
  const { theme } = useTheme()
  const mode = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme

  return (
    <div className="w-full" data-color-mode={mode}>
      <MDEditor.Markdown 
        source={content} 
        className="!bg-transparent"
      />
    </div>
  )
}
