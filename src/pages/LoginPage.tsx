import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { authApi, userApi } from "@/lib/api"
import { authStorage } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import zenleaderLogo from "@/assets/logo-zenleader.png"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-6">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-10 text-center"
        >
            <div className="mb-6">
                <img src={zenleaderLogo} alt="Zenleader" className="h-12 w-auto" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">Zenleader</h1>
            <p className="text-muted-foreground font-medium tracking-tight">Learning management platform</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full rounded-xl border border-border bg-card p-8 shadow-sm dark:bg-card/95 md:p-12"
        >
            <div className="mb-10 text-center sm:text-left">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">Welcome Back</h2>
            <p className="font-medium text-muted-foreground">Sign in to continue.</p>
            </div>

            {error && (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4 text-error"
            >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
            </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email" className="ml-1 text-xs font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="executive@zenleader.com" 
                    className="h-10 rounded-xl border-input/80 bg-background/70 pl-10 font-medium dark:border-input dark:bg-background"
                    required
                />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                </Link>
                </div>
                <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-xl border-input/80 bg-background/70 pl-10 pr-10 font-medium dark:border-input dark:bg-background"
                    required
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
                </div>
            </div>

            <div className="flex items-center space-x-3 ml-1">
                <Checkbox id="remember" className="rounded-md data-[state=checked]:bg-primary" />
                <label
                htmlFor="remember"
                className="cursor-pointer text-xs font-medium leading-none text-muted-foreground"
                >
                Keep me signed in
                </label>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading}
                className="h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
                {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  Signing in...
                </span>
                ) : (
                "Sign in"
                )}
            </Button>
            </form>

            <div className="mt-10 border-t border-border/50 pt-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
                New to the platform?{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                Create account
                </Link>
            </p>
            </div>
        </motion.div>

        {/* Footer Section */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground/80">
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/terms" className="hover:text-primary">Terms</Link>
            <Link to="/support" className="hover:text-primary">Support</Link>
        </div>
      </div>
    </div>
  )
}
