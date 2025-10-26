import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Video, Sparkles, User, Activity, FileText, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BeamsBackground } from "./BeamsBackground";

const AnimatedHero = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative py-20 md:py-32 pb-32 overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background">
      {/* Beams Background Effect */}
      <BeamsBackground />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI-Powered Therapy Platform</span>
            </div>

            {/* Main heading */}
            <h1
              className={`text-4xl md:text-6xl font-bold text-foreground leading-tight transition-all duration-700 delay-150 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Transform Your Therapy Sessions with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
                AI Insights
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-xl text-muted-foreground leading-relaxed transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Empower your practice with intelligent session management, real-time analytics, and automated documentation.
            </p>

            {/* Feature highlights */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-700 delay-450 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {[
                { icon: Video, text: "Live Video Sessions" },
                { icon: Brain, text: "AI Analysis" },
                { icon: Sparkles, text: "Auto Notes" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:scale-105"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-600 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="text-lg group hover:scale-105 transition-transform"
              >
                Get Started Free
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="hover:scale-105 transition-transform"
              >
                Request Demo
              </Button>
            </div>
          </div>

          {/* Right content - Desktop Screen with App */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {/* Static wrapper - no floating animation */}
            <div className="relative">
              {/* Desktop/Laptop Frame */}
              <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl shadow-2xl border-4 border-slate-700 dark:border-slate-800 p-3">
                {/* Browser-like window chrome */}
                <div className="bg-slate-700 dark:bg-slate-800 rounded-t-lg px-3 py-2 flex items-center gap-2 mb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-slate-600/50 dark:bg-slate-900/50 rounded px-3 py-1 text-xs text-slate-300">
                    therapyhub.com/session
                  </div>
                </div>

                {/* App Interface */}
                <div className="bg-slate-900 dark:bg-black rounded-lg overflow-hidden">
                  {/* Video Meeting Grid */}
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative p-4">
                    {/* Two-person video grid */}
                    <div className="grid grid-cols-2 gap-3 h-full">
                      {/* Therapist Video */}
                      <div className="relative bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-xl border-2 border-blue-500/30 overflow-hidden group">
                        {/* Simulated video background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20"></div>
                        
                        {/* Person silhouette/avatar */}
                        <div className="absolute inset-0 flex items-end justify-center pb-8">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-300/30">
                              <User className="w-12 h-12 text-white" />
                            </div>
                            {/* Mic indicator */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        {/* Name tag */}
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg">
                          <div className="text-xs font-medium text-white">Dr. Sarah Mitchell</div>
                        </div>

                        {/* Active speaking indicator */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/90 rounded-full">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-medium text-white">Speaking</span>
                        </div>
                      </div>

                      {/* Client Video */}
                      <div className="relative bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-xl border-2 border-purple-500/30 overflow-hidden group">
                        {/* Simulated video background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
                        
                        {/* Person silhouette/avatar */}
                        <div className="absolute inset-0 flex items-end justify-center pb-8">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center border-4 border-purple-300/30">
                              <User className="w-12 h-12 text-white" />
                            </div>
                            {/* Mic indicator */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        {/* Name tag */}
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg">
                          <div className="text-xs font-medium text-white">Client</div>
                        </div>
                      </div>
                    </div>

                    {/* AI Assistant Overlay */}
                    <div className="absolute top-4 right-4 max-w-xs">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm border border-blue-400/30 animate-float-delay-1">
                        <div className="flex items-start gap-2">
                          <Brain className="w-5 h-5 text-white flex-shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <div className="text-xs font-bold text-white mb-1">AI Suggestion</div>
                            <div className="text-[11px] text-blue-100 leading-tight">
                              "Try exploring their recent stress triggers..."
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Insights Panel */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/80 backdrop-blur-md rounded-xl border border-cyan-500/30 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                            <div className="text-xs text-gray-300">
                              <span className="text-green-400 font-semibold">Emotion:</span> Calm & Engaged
                            </div>
                          </div>
                          <div className="w-px h-4 bg-slate-600"></div>
                          <div className="flex items-center gap-2 flex-1">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <div className="text-xs text-gray-300">
                              <span className="text-blue-400 font-semibold">Notes:</span> Auto-recording
                            </div>
                          </div>
                          <div className="w-px h-4 bg-slate-600"></div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                            <div className="text-xs text-yellow-400 font-semibold">Live</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-scan"></div>
                        </div>
                      </div>
                    </div>

                    {/* Video controls bar */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-600">
                        <button className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                          <Video className="w-4 h-4 text-white" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                          <span className="text-white text-xs">🎤</span>
                        </button>
                        <button className="w-10 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors px-3">
                          <span className="text-white text-xs font-semibold">End</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats bar at bottom of app */}
                  <div className="bg-slate-800 dark:bg-slate-950 px-4 py-3 border-t border-slate-700">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Uptime", value: "99.9%", color: "text-green-400" },
                        { label: "Sessions", value: "10k+", color: "text-blue-400" },
                        { label: "Therapists", value: "500+", color: "text-purple-400" },
                      ].map((stat, index) => (
                        <div key={index} className="text-center">
                          <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-[10px] text-slate-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes subtle-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delay-1 {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-delay-2 {
          animation: float 5s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        .animate-subtle-pulse {
          animation: subtle-pulse 4s ease-in-out infinite;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
};

export default AnimatedHero;
