import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.fullName && formData.email) {
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.fullName,
      });

      toast({
        title: "Registration successful!",
        description: "Your account has been created. Please sign in.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 25) return "Weak";
    if (strength <= 50) return "Fair";
    if (strength <= 75) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-violet-950 dark:via-purple-950 dark:to-indigo-950 p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and header with animation */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50 dark:shadow-violet-500/30 transform hover:scale-110 transition-transform duration-300">
            <Brain className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Join TherapyHub
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create your therapist account to get started
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 animate-in fade-in duration-500 delay-100">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-2 transition-all duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${step >= 1 ? 'bg-violet-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Personal Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className={`flex items-center gap-2 transition-all duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${step >= 2 ? 'bg-violet-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                2
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Security</span>
            </div>
          </div>
        </div>

        {/* Registration card with glass morphism effect */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 rounded-3xl shadow-2xl shadow-violet-500/10 dark:shadow-violet-500/5 p-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              {/* Full Name input */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500 delay-300">
                <Label 
                  htmlFor="fullName" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <div className="relative group">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={formData.fullName}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("fullName")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    className={`
                      w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                      bg-white/50 dark:bg-slate-800/50
                      ${focusedInput === "fullName" 
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10 scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                      focus:outline-none focus:ring-0
                    `}
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-2 animate-in fade-in slide-in-from-right duration-500 delay-400">
                <Label 
                  htmlFor="email" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane.smith@clinic.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    className={`
                      w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                      bg-white/50 dark:bg-slate-800/50
                      ${focusedInput === "email" 
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10 scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                      focus:outline-none focus:ring-0
                    `}
                  />
                </div>
              </div>

              {/* Next button */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in zoom-in duration-500 delay-500"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Username input */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500">
                <Label 
                  htmlFor="username" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <div className="relative group">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="janesmith"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("username")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    disabled={loading}
                    className={`
                      w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                      bg-white/50 dark:bg-slate-800/50
                      ${focusedInput === "username" 
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10 scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                      focus:outline-none focus:ring-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                </div>
              </div>

              {/* Password input with strength indicator */}
              <div className="space-y-2 animate-in fade-in slide-in-from-right duration-500 delay-100">
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
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    disabled={loading}
                    className={`
                      w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                      bg-white/50 dark:bg-slate-800/50
                      ${focusedInput === "password" 
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10 scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                      focus:outline-none focus:ring-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                </div>
                {formData.password && (
                  <div className="space-y-1 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Password strength:</span>
                      <span className={`font-medium ${passwordStrength() > 75 ? 'text-green-600' : passwordStrength() > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength()}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password input */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500 delay-200">
                <Label 
                  htmlFor="confirmPassword" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("confirmPassword")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    disabled={loading}
                    className={`
                      w-full h-12 px-4 rounded-xl border-2 transition-all duration-300
                      bg-white/50 dark:bg-slate-800/50
                      ${focusedInput === "confirmPassword" 
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10 scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                      focus:outline-none focus:ring-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-xs animate-in fade-in duration-300">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <span className="text-red-600">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 animate-in fade-in zoom-in duration-500 delay-300">
                <Button 
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-1/3 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Create Account
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 animate-in fade-in duration-500 delay-400">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 dark:bg-slate-900/70 px-2 text-slate-500 dark:text-slate-400">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign in link */}
          <div className="text-center animate-in fade-in duration-500 delay-500">
            <Link to="/login">
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 font-medium">
                  Sign in to your account
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-6 animate-in fade-in duration-500 delay-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            By creating an account, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
