import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import zenleaderLogo from "@/assets/logo-zenleader.png"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success("OTP đã được gửi tới email của bạn.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể gửi yêu cầu quên mật khẩu."
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
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>Enter your email and we&apos;ll send an OTP to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4" />
                  Check your inbox
                </div>
                <p>
                  We sent a verification code to <span className="font-medium">{email}</span>. Use it on the reset password page.
                </p>
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

                {error && <FieldError className="rounded-md bg-destructive/10 p-3 font-medium text-destructive">{error}</FieldError>}

                <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Send OTP
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            {sent ? (
              <Button className="w-full" size="lg" onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>
                Continue to reset password
              </Button>
            ) : null}
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
