import { useEffect, useState, type FormEvent } from "react"
import { z } from "zod"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT_SETTINGS)
  const [generalForm, setGeneralForm] = useState({ workspaceTitle: "", adminEmail: "" })
  const [generalErrors, setGeneralErrors] = useState<GeneralErrors>({})

  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    setGeneralForm({
      workspaceTitle: loaded.workspaceTitle,
      adminEmail: loaded.adminEmail,
    })
  }, [])

  const handleSaveGeneral = (event: FormEvent) => {
    event.preventDefault()
    const result = generalSchema.safeParse(generalForm)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setGeneralErrors({
        workspaceTitle: fieldErrors.workspaceTitle?.[0],
        adminEmail: fieldErrors.adminEmail?.[0],
      })
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
    toast.success("General settings saved.")
  }

  const handleResetGeneral = () => {
    const loaded = loadSettings()
    setGeneralForm({
      workspaceTitle: loaded.workspaceTitle,
      adminEmail: loaded.adminEmail,
    })
    setGeneralErrors({})
  }

  const handleNotificationToggle = (checked: boolean) => {
    const next: PortalSettings = { ...settings, emailProductUpdates: checked }
    setSettings(next)
    saveSettings(next)
    toast.success(checked ? "Product update emails enabled." : "Product update emails disabled.")
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Portal preferences are stored in this browser only until a workspace API is available.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Workspace label and contact email for this admin session.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSaveGeneral}>
                <div className="space-y-2">
                  <Label htmlFor="workspace-title">Workspace title</Label>
                  <Input
                    id="workspace-title"
                    value={generalForm.workspaceTitle}
                    aria-invalid={Boolean(generalErrors.workspaceTitle)}
                    onChange={(e) => {
                      setGeneralErrors((prev) => ({ ...prev, workspaceTitle: undefined }))
                      setGeneralForm((prev) => ({ ...prev, workspaceTitle: e.target.value }))
                    }}
                    placeholder="Zenleader Admin"
                  />
                  {generalErrors.workspaceTitle ? (
                    <p className="text-xs text-destructive">{generalErrors.workspaceTitle}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin contact email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={generalForm.adminEmail}
                    aria-invalid={Boolean(generalErrors.adminEmail)}
                    onChange={(e) => {
                      setGeneralErrors((prev) => ({ ...prev, adminEmail: undefined }))
                      setGeneralForm((prev) => ({ ...prev, adminEmail: e.target.value }))
                    }}
                    placeholder="admin@example.com"
                  />
                  {generalErrors.adminEmail ? (
                    <p className="text-xs text-destructive">{generalErrors.adminEmail}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit">Save changes</Button>
                  <Button type="button" variant="outline" onClick={handleResetGeneral}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what we may notify you about in the portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <Label htmlFor="email-product">Product updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive occasional tips and release notes (stored locally; no server yet).
                  </p>
                </div>
                <Switch
                  id="email-product"
                  checked={settings.emailProductUpdates}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme follows your system and Zenleader design tokens.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dark mode and density controls can be wired here when the dashboard adds a global theme provider.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
