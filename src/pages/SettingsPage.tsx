import { useState, type FormEvent } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { Settings, Bell, Palette, Globe, Save, RefreshCw, Loader2, ShieldCheck, Laptop } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"

const SETTINGS_STORAGE_KEY = "zl_admin_portal_settings"

type PortalSettings = {
  workspaceTitle: string
  adminEmail: string
  emailProductUpdates: boolean
}

const DEFAULT_SETTINGS: PortalSettings = {
  workspaceTitle: "Zenleader Admin",
  adminEmail: "",
  emailProductUpdates: false,
}

const generalSchema = z.object({
  workspaceTitle: z
    .string()
    .trim()
    .min(2, "Workspace title must be at least 2 characters.")
    .max(120, "Workspace title must be at most 120 characters."),
  adminEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
})

type GeneralErrors = Partial<Record<"workspaceTitle" | "adminEmail", string>>

function loadSettings(): PortalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<PortalSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      workspaceTitle: typeof parsed.workspaceTitle === "string" ? parsed.workspaceTitle : DEFAULT_SETTINGS.workspaceTitle,
      adminEmail: typeof parsed.adminEmail === "string" ? parsed.adminEmail : DEFAULT_SETTINGS.adminEmail,
      emailProductUpdates: Boolean(parsed.emailProductUpdates),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings: PortalSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PortalSettings>(() => loadSettings())
  const [generalForm, setGeneralForm] = useState(() => {
    const loaded = loadSettings()
    return { workspaceTitle: loaded.workspaceTitle, adminEmail: loaded.adminEmail }
  })
  const [generalErrors, setGeneralErrors] = useState<GeneralErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveGeneral = (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = generalSchema.safeParse(generalForm)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setGeneralErrors({
        workspaceTitle: fieldErrors.workspaceTitle?.[0],
        adminEmail: fieldErrors.adminEmail?.[0],
      })
      setIsSaving(false)
      return
    }

    setGeneralErrors({})
    const next: PortalSettings = {
      ...settings,
      workspaceTitle: result.data.workspaceTitle,
      adminEmail: result.data.adminEmail,
    }
    setSettings(next)
    saveSettings(next)

    window.setTimeout(() => {
      setIsSaving(false)
      toast.success("Preferences saved in this browser.")
    }, 300)
  }

  const handleResetGeneral = () => {
    const loaded = loadSettings()
    setGeneralForm({
      workspaceTitle: loaded.workspaceTitle,
      adminEmail: loaded.adminEmail,
    })
    setGeneralErrors({})
    toast.info("Form reset to the last saved local values.")
  }

  const handleNotificationToggle = (checked: boolean) => {
    const next: PortalSettings = { ...settings, emailProductUpdates: checked }
    setSettings(next)
    saveSettings(next)
    toast.success(checked ? "Notification preference saved locally." : "Notification preference turned off locally.")
  }

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Local Preferences"
        subtitle="These controls are browser-local only. There is no backend settings API connected for this screen yet."
        stats={[
          { label: "Storage", value: "This browser" },
          { label: "Sync", value: "Local only" },
        ]}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 h-12 justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="general" className="px-8 font-semibold data-[state=active]:bg-background">
            <Globe className="mr-2 size-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-8 font-semibold data-[state=active]:bg-background">
            <Bell className="mr-2 size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="px-8 font-semibold data-[state=active]:bg-background">
            <Palette className="mr-2 size-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="general" className="focus-visible:outline-none">
            <Card className="max-w-2xl overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/30 p-8">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Settings className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Workspace labels</CardTitle>
                    <CardDescription>
                      Update labels and contact hints for this browser session only.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
                  This page currently stores values in <code>localStorage</code>. Refreshing the browser keeps them on
                  this device, but they are not synced to the backend or to other admins.
                </div>

                <form className="space-y-6" onSubmit={handleSaveGeneral}>
                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Workspace Title</Label>
                    <Input
                      value={generalForm.workspaceTitle}
                      onChange={(e) => setGeneralForm({ ...generalForm, workspaceTitle: e.target.value })}
                      className="h-11 rounded-xl font-semibold"
                      placeholder="Zenleader Admin"
                    />
                    {generalErrors.workspaceTitle && (
                      <p className="ml-1 text-xs font-bold text-destructive">{generalErrors.workspaceTitle}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Support Contact Email</Label>
                    <Input
                      type="email"
                      value={generalForm.adminEmail}
                      onChange={(e) => setGeneralForm({ ...generalForm, adminEmail: e.target.value })}
                      className="h-11 rounded-xl font-medium"
                      placeholder="Optional"
                    />
                    {generalErrors.adminEmail && (
                      <p className="ml-1 text-xs font-bold text-destructive">{generalErrors.adminEmail}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isSaving} className="h-11 flex-1 font-bold shadow-lg shadow-primary/10">
                      {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      Save Locally
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetGeneral} className="h-11 px-6 font-semibold">
                      <RefreshCw className="mr-2 size-4" />
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
              <div className="border-t bg-muted/10 p-6">
                <p className="flex items-center justify-center gap-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                  <ShieldCheck className="size-3" /> Stored in your browser only
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="focus-visible:outline-none">
            <Card className="max-w-2xl overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/30 p-8">
                <CardTitle className="text-lg">Local notification preference</CardTitle>
                <CardDescription>
                  Keep a simple on/off preference in this browser while the project has no centralized notification settings endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">Product update emails</Label>
                      <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                        This toggle is only a local preference right now. It does not subscribe or unsubscribe a real backend email job.
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailProductUpdates}
                      onCheckedChange={handleNotificationToggle}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="focus-visible:outline-none">
            <Card className="max-w-2xl overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/30 p-8">
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Visual theme settings are not configurable from this page yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Laptop className="size-8 opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No appearance controls yet</p>
                  <p className="mx-auto mt-2 max-w-[320px] text-xs font-medium leading-relaxed text-muted-foreground">
                    The app still follows its built-in styles. Add a dedicated settings API and theme model first if you want this tab to control real appearance options.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
