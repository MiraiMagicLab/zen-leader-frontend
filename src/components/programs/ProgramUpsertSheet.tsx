import { useEffect, useState } from "react"
import { FolderKanban, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type ProgramSheetMode = "create" | "settings" | null
export type ProgramFormErrors = Partial<Record<"code" | "title" | "description" | "thumbnailFile", string>>

export type ProgramFormState = {
  code: string
  title: string
  description: string
  thumbnailUrl: string
  thumbnailFile: File | null
  isPublished: boolean
}

function ProgramForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  errors,
}: {
  form: ProgramFormState
  onChange: (next: ProgramFormState) => void
  onSubmit: () => void
  submitLabel: string
  errors: ProgramFormErrors
}) {
  const isInvalid = !form.code.trim() || !form.title.trim()
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!form.thumbnailFile) {
      setThumbnailPreview(null)
      return
    }

    const url = URL.createObjectURL(form.thumbnailFile)
    setThumbnailPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.thumbnailFile])

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isInvalid) onSubmit()
      }}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-4 no-scrollbar">
        <div className="space-y-2">
          <Label htmlFor="program-code" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program Code</Label>
          <Input
            id="program-code"
            value={form.code}
            aria-invalid={Boolean(errors.code)}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })}
            placeholder="EXEC-LEAD-2026"
            className="h-10 rounded-xl"
          />
          {errors.code ? <p className="text-xs text-destructive font-bold ml-1">{errors.code}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-title" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
          <Input
            id="program-title"
            value={form.title}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="Zenith Executive Leadership"
            className="h-10 rounded-xl"
          />
          {errors.title ? <p className="text-xs text-destructive font-bold ml-1">{errors.title}</p> : null}
        </div>

        <div className="space-y-2">
          <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thumbnail</Label>
          <div className="space-y-4">
            {(thumbnailPreview || form.thumbnailUrl) ? (
              <div className="overflow-hidden rounded-xl border border-border/40">
                <img
                  alt="Preview"
                  src={thumbnailPreview ?? form.thumbnailUrl}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-sm">
                <ImageOff className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-muted-foreground">No imagery provided.</p>
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                onChange({ ...form, thumbnailFile: file })
              }}
              className="h-10 cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
          <Textarea
            id="program-description"
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Program description..."
            className="min-h-[140px] rounded-xl"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <Label htmlFor="program-published" className="text-sm font-semibold">Public Visibility</Label>
          <Switch
            id="program-published"
            checked={form.isPublished}
            onCheckedChange={(checked) => onChange({ ...form, isPublished: checked })}
          />
        </div>
      </div>

      <SheetFooter className="mt-auto pt-6 border-t">
        <Button
          type="submit"
          disabled={isInvalid}
          className="w-full h-11"
        >
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}

export function ProgramUpsertSheet({
  open,
  mode,
  form,
  errors,
  onChange,
  onSubmit,
  onOpenChange,
}: {
  open: boolean
  mode: ProgramSheetMode
  form: ProgramFormState
  errors: ProgramFormErrors
  onChange: (next: ProgramFormState) => void
  onSubmit: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <FolderKanban className="size-7" />
          </div>
          <SheetTitle>{mode === "create" ? "Create Program" : "Edit Program"}</SheetTitle>
          <SheetDescription>
            Configure the essential metadata for your educational program.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <ProgramForm
            form={form}
            onChange={onChange}
            errors={errors}
            onSubmit={onSubmit}
            submitLabel={mode === "create" ? "Create Program" : "Save Changes"}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
