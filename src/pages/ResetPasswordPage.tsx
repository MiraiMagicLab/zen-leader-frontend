import { useMemo, useState, type FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import zenleaderLogo from "@/assets/logo-zenleader.png"

function useQueryEmail() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get("email") ?? "", [search])
}

export default function ResetPasswordPage() {
  const initialEmail = useQueryEmail()
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await authApi.verifyOtp({ email, otp })
      await authApi.resetPassword({ email, otp, newPassword })
      setDone(true)
      toast.success("Password đã được đặt lại thành công.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể đặt lại mật khẩu."
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src={zenleaderLogo} alt="Zenleader" className="mb-2 h-16 w-auto object-contain" />
          <h1 className="text-lg font-semibold">Zenleader Admin</h1>
          <p className="text-sm text-muted-foreground">System management portal</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Use the OTP from your email to create a new password.</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <ShieldAlert className="size-4" />
                  Password updated
                </div>
                <p>You can now sign in with your new password.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email" className="text-sm font-semibold">
                    Email
                  </FieldLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@zenleader.com"
                      autoComplete="email"
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="otp" className="text-sm font-semibold">
                    OTP code
                  </FieldLabel>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the verification code"
                    autoComplete="one-time-code"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="newPassword" className="text-sm font-semibold">
                    New password
                  </FieldLabel>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="pl-10 pr-10"
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword" className="text-sm font-semibold">
                    Confirm password
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </Field>

                {passwordMismatch && <FieldError className="rounded-md bg-destructive/10 p-3 font-medium text-destructive">Passwords do not match.</FieldError>}
                {error && <FieldError className="rounded-md bg-destructive/10 p-3 font-medium text-destructive">{error}</FieldError>}

                <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={isSubmitting || passwordMismatch}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Reset password
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
