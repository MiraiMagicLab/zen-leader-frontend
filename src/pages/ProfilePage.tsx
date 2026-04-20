import { useEffect, useMemo, useState, type ChangeEventHandler, type FormEvent } from "react"
import { z } from "zod"
import { toast } from "sonner"

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

  const accountStatusText = user?.isVerified ? "Verified account" : "Not verified"
  const roleText = user?.roles?.join(", ") || "User"

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
        const uploaded = await assetApi.upload(avatarFile)
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
      toast.success("Profile updated successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile."
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
      toast.success("Password changed successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password."
      toast.error(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information and security settings.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Profile details</TabsTrigger>
          <TabsTrigger value="password">Change password</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>Update your display information and avatar.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border">
                        <AvatarImage src={avatarPreview ?? (profileForm.avatarUrl || undefined)} alt="User avatar" />
                        <AvatarFallback>{initials(profileForm.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.email ?? "Unknown email"}</p>
                        <p className="text-xs text-muted-foreground">Your login email cannot be changed here.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user?.isVerified ? "default" : "secondary"}>{accountStatusText}</Badge>
                      <Badge variant="outline">{roleText}</Badge>
                    </div>
                  </div>

                  <Separator />

                  <form className="space-y-5" onSubmit={handleProfileSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="profile-display-name">Display name</Label>
                      <Input
                        id="profile-display-name"
                        value={profileForm.displayName}
                        aria-invalid={Boolean(profileErrors.displayName)}
                        onChange={(event) => {
                          setProfileErrors((prev) => ({ ...prev, displayName: undefined }))
                          setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))
                        }}
                        placeholder="Your display name"
                      />
                      {profileErrors.displayName ? <p className="text-xs text-destructive">{profileErrors.displayName}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-avatar-upload">Avatar image</Label>
                      <Input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} />
                      <p className="text-xs text-muted-foreground">Upload a new avatar image (max 5MB).</p>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSavingProfile}>
                        {isSavingProfile ? "Saving..." : "Save profile"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use a strong password that you do not use elsewhere.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleChangePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                    onChange={(event) => {
                      setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }))
                      setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                    }}
                  />
                  {passwordErrors.currentPassword ? <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    onChange={(event) => {
                      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }))
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }}
                  />
                  {passwordErrors.newPassword ? <p className="text-xs text-destructive">{passwordErrors.newPassword}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    onChange={(event) => {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }}
                  />
                  {passwordErrors.confirmPassword ? <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p> : null}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
