import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Brain, Sparkles, Lock, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.login(usernameOrEmail, password);
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.full_name}!`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and header with animation */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transform hover:scale-110 transition-transform duration-300">
            <Brain className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            TherapyHub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI-Powered Therapy Session Management
          </p>
        </div>

        {/* Login card with glass morphism effect */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 p-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username or Email input with animation */}
            <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500 delay-300">
              <Label 
                htmlFor="usernameOrEmail" 
                className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Username or Email
              </Label>
              <div className="relative group">
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="username or email@example.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setFocusedInput("usernameOrEmail")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  disabled={loading}
                  className={`
                    w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                    bg-white/50 dark:bg-slate-800/50
                    ${focusedInput === "usernameOrEmail" 
                      ? "border-blue-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 scale-[1.02]" 
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }
                    focus:outline-none focus:ring-0
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
              </div>
            </div>

            {/* Password input with animation */}
            <div className="space-y-2 animate-in fade-in slide-in-from-right duration-500 delay-400">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  disabled={loading}
                  className={`
                    w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                    bg-white/50 dark:bg-slate-800/50
                    ${focusedInput === "password" 
                      ? "border-blue-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 scale-[1.02]" 
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }
                    focus:outline-none focus:ring-0
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
              </div>
            </div>

            {/* Submit button with animation */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in zoom-in duration-500 delay-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sign In to Dashboard
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 animate-in fade-in duration-500 delay-600">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 dark:bg-slate-900/70 px-2 text-slate-500 dark:text-slate-400">
                Test Account
              </span>
            </div>
          </div>

          {/* Test credentials with animation */}
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom duration-500 delay-700">
            <div className="inline-block px-4 py-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Demo Credentials:</p>
              <p className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">
                therapist@example.com
              </p>
              <p className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">
                password123
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6 animate-in fade-in duration-500 delay-800 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Secure therapist portal with end-to-end encryption
          </p>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-6 animate-in fade-in duration-500 delay-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-4 animate-in fade-in duration-500 delay-1000">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Empowering therapists with AI-driven insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
