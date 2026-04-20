import { useState } from "react"
import { useUploadLessonAsset } from "@/lib/api/services/lms"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BadgeCheck, Upload } from "lucide-react"

interface LessonMediaUploaderProps {
  value?: string | null
  fileName?: string | null
  onChange: (url: string | null, metadata?: Record<string, unknown>) => void
  accept?: string
  label?: string
}

export function LessonMediaUploader({
  value,
  fileName,
  onChange,
  accept = "video/*,application/pdf",
  label = "Upload Content"
}: LessonMediaUploaderProps) {
  const uploadMutation = useUploadLessonAsset()
  const [progress, setProgress] = useState(0)

  const uploadFile = async (file: File) => {
    if (!file) return

    setProgress(10)
    try {
      // Simulate progress since uploadLessonAsset uses fetch and we don't have easy progress tracking without xhr/axios
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev))
      }, 500)

      const result = await uploadMutation.mutateAsync(file)
      clearInterval(interval)
      setProgress(100)
      
      onChange(result.url, {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        publicId: result.publicId
      })
      
      toast.success("File uploaded successfully")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
      setProgress(0)
    }
  }

  const openNativeFilePicker = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement | null
      const file = target?.files?.[0]
      if (!file) return
      void uploadFile(file)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {value ? (fileName || "File uploaded") : "No file selected"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={uploadMutation.isPending}
            onClick={openNativeFilePicker}
          >
            {uploadMutation.isPending ? "Uploading..." : value ? "Change" : "Select File"}
          </Button>
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="space-y-2 px-1">
          <Progress value={progress} className="h-1 shadow-none bg-muted" />
          <p className="animate-pulse text-center text-xs font-medium text-muted-foreground">
            Processing file upload to storage...
          </p>
        </div>
      )}

      {value && !uploadMutation.isPending && (
        <div className="p-3 rounded-xl bg-muted border border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <BadgeCheck className="size-4" />
            Available at: 
            <a 
              href={value} 
              target="_blank" 
              rel="noreferrer" 
              className="text-primary truncate hover:underline"
            >
              {value}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
