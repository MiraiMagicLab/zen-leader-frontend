import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { authApi } from "@/lib/api"
import { authStorage } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("zenlender.online@gmail.com")
  const [password, setPassword] = useState("zen@123")
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1F3E72] to-[#3B82F6] flex flex-col items-center justify-center p-4 font-inter text-slate-800">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8 text-center"
      >
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg mb-4">
          <div className="w-6 h-6 bg-[#1F3E72] rounded-md opacity-80" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Zenleader</h1>
        <p className="text-blue-100 text-sm opacity-90">Elevating Executive Leadership</p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Sign in to access your dashboard.</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executive@zenleader.com" 
                className="pl-10 h-11 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#1F3E72]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#1F3E72] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#1F3E72]/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="bg-slate-50 border-slate-200" />
            <label
              htmlFor="remember"
              className="text-sm font-medium text-slate-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Keep me logged in
            </label>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-[#87C744] hover:bg-[#76AE3B] text-slate-900 font-bold text-lg rounded-xl shadow-lg border-none active:scale-[0.98] transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold text-[#1F3E72] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer Section */}
      <div className="mt-8 flex gap-6 text-xs text-white/60 font-medium">
        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        <Link to="/support" className="hover:text-white transition-colors">Support</Link>
      </div>
    </div>
  )
}
