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
  adminEmail: z.string().trim().email("Enter a valid email address."),
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
    
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Portal configuration updated.")
    }, 500)
  }

  const handleResetGeneral = () => {
    const loaded = loadSettings()
    setGeneralForm({
      workspaceTitle: loaded.workspaceTitle,
      adminEmail: loaded.adminEmail,
    })
    setGeneralErrors({})
    toast.info("Form reset to saved values.")
  }

  const handleNotificationToggle = (checked: boolean) => {
    const next: PortalSettings = { ...settings, emailProductUpdates: checked }
    setSettings(next)
    saveSettings(next)
    toast.success(checked ? "Email alerts activated." : "Email alerts paused.")
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
       <PageHeader
        title="Portal Settings"
        subtitle="Configure the administrative environment and workspace attributes."
        stats={[
            { label: "Environment", value: "Production" },
            { label: "Status", value: "Operational" }
        ]}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 h-12 justify-start gap-1 p-1 bg-muted/40">
          <TabsTrigger value="general" className="px-8 font-semibold data-[state=active]:bg-background">
            <Globe className="mr-2 size-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-8 font-semibold data-[state=active]:bg-background">
            <Bell className="mr-2 size-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="appearance" className="px-8 font-semibold data-[state=active]:bg-background">
            <Palette className="mr-2 size-4" />
            Aesthetics
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="general" className="focus-visible:outline-none">
            <Card className="overflow-hidden border shadow-sm max-w-2xl">
              <CardHeader className="bg-muted/30 border-b p-8">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Settings className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">General configuration</CardTitle>
                    <CardDescription>Workspace identification and contact parameters.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
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
                      <p className="text-xs font-bold text-destructive ml-1">{generalErrors.workspaceTitle}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Support Contact Email</Label>
                    <Input
                      type="email"
                      value={generalForm.adminEmail}
                      onChange={(e) => setGeneralForm({ ...generalForm, adminEmail: e.target.value })}
                      className="h-11 rounded-xl font-medium"
                      placeholder="ops@zenleader.com"
                    />
                    {generalErrors.adminEmail && (
                      <p className="text-xs font-bold text-destructive ml-1">{generalErrors.adminEmail}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isSaving} className="flex-1 h-11 font-bold shadow-lg shadow-primary/10">
                       {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                       Synchronize Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetGeneral} className="h-11 px-6 font-semibold">
                      <RefreshCw className="mr-2 size-4" />
                      Discard
                    </Button>
                  </div>
                </form>
              </CardContent>
              <div className="bg-muted/10 p-6 border-t">
                 <p className="text-[10px] text-center font-bold uppercase tracking-widest text-muted-foreground opacity-60 flex items-center justify-center gap-2">
                    <ShieldCheck className="size-3" /> Standard encryption applied to local state
                 </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="focus-visible:outline-none">
            <Card className="overflow-hidden border shadow-sm max-w-2xl">
              <CardHeader className="bg-muted/30 border-b p-8">
                 <CardTitle className="text-lg">Communication Preferences</CardTitle>
                 <CardDescription>Define how the portal notifies you about critical system updates.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between gap-6 rounded-2xl border border-border/40 bg-muted/20 p-6">
                        <div className="space-y-1">
                            <Label className="text-base font-bold">Product Intelligence</Label>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                Receive curated feature release notes, performance tips, and architectural insights.
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
            <Card className="overflow-hidden border shadow-sm max-w-2xl">
              <CardHeader className="bg-muted/30 border-b p-8">
                 <CardTitle className="text-lg">Visual Experience</CardTitle>
                 <CardDescription>Customize the portal aesthetic to align with your workspace brand.</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center space-y-4">
                 <div className="flex justify-center flex-col items-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                        <Laptop className="size-8 opacity-40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Aesthetic Synthesis</p>
                    <p className="text-xs font-medium text-muted-foreground max-w-[280px] mx-auto mt-2 leading-relaxed">
                        Interface density and dynamic theming are currently synchronized with system-level design tokens.
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
