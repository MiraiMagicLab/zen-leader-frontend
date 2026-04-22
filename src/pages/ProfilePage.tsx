import { useEffect, useMemo, useState, type ChangeEventHandler, type FormEvent } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { User, Shield, Key, BadgeCheck, Mail, Camera, Save, RefreshCw, Loader2 } from "lucide-react"

import { authApi, assetApi, userApi, type UserResponse } from "@/lib/api"
import { authStorage } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoading } from "@/components/common/PageLoading"
import { PageHeader } from "@/components/common/PageHeader"

type ProfileFormState = {
  displayName: string
  avatarUrl: string
}

type PasswordFormState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>
type PasswordFormErrors = Partial<Record<keyof PasswordFormState, string>>

const MAX_AVATAR_SIZE = 5 * 1024 * 1024

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(120, "Display name must be at most 120 characters."),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, "Avatar URL is too long.")
    .optional()
    .or(z.literal("")),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Confirm password does not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  })

function buildInitialProfileForm(user: UserResponse | null): ProfileFormState {
  return {
    displayName: user?.displayName ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  }
}

function validateProfileForm(form: ProfileFormState): ProfileFormErrors {
  const result = profileSchema.safeParse(form)
  if (result.success) return {}
  const errors = result.error.flatten().fieldErrors
  return {
    displayName: errors.displayName?.[0],
    avatarUrl: errors.avatarUrl?.[0],
  }
}

function validatePasswordForm(form: PasswordFormState): PasswordFormErrors {
  const result = passwordSchema.safeParse(form)
  if (result.success) return {}
  const errors = result.error.flatten().fieldErrors
  return {
    currentPassword: errors.currentPassword?.[0],
    newPassword: errors.newPassword?.[0],
    confirmPassword: errors.confirmPassword?.[0],
  }
}

function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "ZU"
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [profileForm, setProfileForm] = useState<ProfileFormState>(buildInitialProfileForm(null))
  const [profileErrors, setProfileErrors] = useState<ProfileFormErrors>({})

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const me = await userApi.getMe()
        setUser(me)
        setProfileForm(buildInitialProfileForm(me))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile."
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [])

  const avatarPreview = useMemo(() => {
    if (!avatarFile) return null
    return URL.createObjectURL(avatarFile)
  }, [avatarFile])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const accountStatusText = user?.isVerified ? "Verified" : "Unverified"

  if (loading) {
    return <PageLoading />
  }

  const handleAvatarChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setAvatarFile(null)
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar file must be 5MB or smaller.")
      event.currentTarget.value = ""
      return
    }
    setAvatarFile(file)
  }

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateProfileForm(profileForm)
    setProfileErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    try {
      setIsSavingProfile(true)
      let avatarUrl = profileForm.avatarUrl.trim()
      if (avatarFile) {
        const uploaded = await assetApi.uploadLessonAsset(avatarFile)
        avatarUrl = uploaded.url
      }

      const updated = await userApi.updateMe({
        displayName: profileForm.displayName.trim(),
        avatarUrl,
      })

      setUser(updated)
      setProfileForm(buildInitialProfileForm(updated))
      setAvatarFile(null)
      authStorage.setUser({
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        roles: updated.roles,
        appMetadata: updated.appMetadata,
      })
      toast.success("Profile updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed."
      toast.error(message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validatePasswordForm(passwordForm)
    setPasswordErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    try {
      setIsChangingPassword(true)
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordErrors({})
      toast.success("Password secured.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed."
      toast.error(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Control your personal presence and security preferences."
        stats={[
          { label: "Status", value: accountStatusText },
          { label: "Privileges", value: user?.roles?.[0] || "User" }
        ]}
      />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6 h-12 justify-start gap-1 p-1 bg-muted/40">
          <TabsTrigger value="details" className="px-8 font-semibold data-[state=active]:bg-background">
            <User className="mr-2 size-4" />
            General Information
          </TabsTrigger>
          <TabsTrigger value="password" className="px-8 font-semibold data-[state=active]:bg-background">
            <Key className="mr-2 size-4" />
            Change Password
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="details" className="focus-visible:outline-none">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-muted/30 border-b p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                        <AvatarImage src={avatarPreview ?? (profileForm.avatarUrl || undefined)} className="object-cover" />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials(profileForm.displayName)}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform ring-4 ring-background">
                        <Camera className="size-4" />
                        <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </Label>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{user?.displayName}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user?.isVerified ? "default" : "secondary"} className="h-7 px-3 font-bold uppercase tracking-wide text-[10px]">
                      {user?.isVerified && <BadgeCheck className="mr-1.5 size-3.5" />}
                      {accountStatusText}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleProfileSubmit} className="space-y-8 max-w-2xl">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Display Name</Label>
                      <Input
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                        className="h-11 rounded-xl bg-muted/30 border-transparent focus:bg-background font-semibold"
                        placeholder="e.g. Aris Thorne"
                      />
                      {profileErrors.displayName && <p className="text-xs font-bold text-destructive ml-1">{profileErrors.displayName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Email Address</Label>
                      <Input
                        value={user?.email}
                        disabled
                        className="h-11 rounded-xl bg-muted/60 border-transparent font-medium opacity-70"
                      />
                      <p className="text-[10px] text-muted-foreground font-medium italic ml-1">Contact administrators to modify primary security email.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Shield className="size-4" />
                      Encrypted Profile Data
                    </div>
                    <Button type="submit" size="lg" disabled={isSavingProfile} className="min-w-[160px] font-bold shadow-lg shadow-primary/10">
                      {isSavingProfile ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="focus-visible:outline-none">
            <Card className="overflow-hidden border shadow-sm max-w-2xl">
              <CardHeader className="bg-muted/30 border-b p-8">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Key className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Credentials Security</CardTitle>
                    <CardDescription>Update your login credentials to a unique, strong password.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="h-11 rounded-xl font-medium"
                    />
                    {passwordErrors.currentPassword && <p className="text-xs font-bold text-destructive ml-1">{passwordErrors.currentPassword}</p>}
                  </div>

                  <Separator className="my-6" />

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">New Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="h-11 rounded-xl font-medium"
                      />
                      {passwordErrors.newPassword && <p className="text-xs font-bold text-destructive ml-1">{passwordErrors.newPassword}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Confirm Selection</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="h-11 rounded-xl font-medium"
                      />
                      {passwordErrors.confirmPassword && <p className="text-xs font-bold text-destructive ml-1">{passwordErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button type="submit" size="lg" disabled={isChangingPassword} className="w-full font-bold">
                      {isChangingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                      Establish New Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
