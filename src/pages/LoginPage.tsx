import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { authApi, userApi } from "@/lib/api"
import { authStorage } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import zenleaderLogo from "@/assets/logo-zenleader.png"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const resp = await authApi.login({ email, passwordHash: password })
      if (resp.authenticated && resp.accessToken) {
        authStorage.setToken(resp.accessToken)

        try {
          const user = await userApi.getMe()
          authStorage.setUser(user)
        } catch (uErr) {
          console.error("Failed to fetch user profile", uErr)
        }

        navigate("/dashboard")
      } else {
        setError("Authentication failed. Please check your credentials.")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again."
      console.error("Login Error:", err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
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
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your account details to access the admin system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-semibold">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zenleader.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-sm font-semibold">
                    Password
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="font-normal">
                  Keep me signed in
                </Label>
              </div>

              {error && (
                <FieldError className="rounded-md bg-destructive/10 p-3 font-medium text-destructive">
                  {error}
                </FieldError>
              )}

              <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Sign in
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center text-xs text-muted-foreground">
            Don&apos;t have admin access? Contact your system administrator.
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
