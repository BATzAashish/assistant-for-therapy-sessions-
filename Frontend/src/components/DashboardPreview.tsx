import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Video, FileText, Activity, Users, Calendar, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const DashboardPreview = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("dashboard-preview");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <section id="dashboard-preview" className="relative -mt-32 pt-8 py-20 overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Subtle continuing beam effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Fading vertical beams */}
        <div className="absolute top-0 left-[10%] w-[60px] h-[40%] bg-gradient-to-b from-blue-500/5 via-blue-500/2 to-transparent blur-xl" />
        <div className="absolute top-0 left-[25%] w-[50px] h-[35%] bg-gradient-to-b from-indigo-500/5 via-indigo-500/2 to-transparent blur-xl" />
        <div className="absolute top-0 right-[30%] w-[55px] h-[38%] bg-gradient-to-b from-purple-500/5 via-purple-500/2 to-transparent blur-xl" />
        <div className="absolute top-0 right-[15%] w-[50px] h-[35%] bg-gradient-to-b from-cyan-500/5 via-cyan-500/2 to-transparent blur-xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className={`text-center space-y-4 mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">See It In Action</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Your Command Center for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
              Therapy Excellence
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need at your fingertips - intuitive, powerful, and beautifully designed
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Browser Frame */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-800 overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-slate-700 dark:bg-slate-800 px-4 py-3 flex items-center gap-3 border-b border-slate-600">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-slate-600/50 dark:bg-slate-900/50 rounded px-4 py-1.5 text-sm text-slate-300 flex items-center gap-2">
                <div className="w-4 h-4 text-green-400">🔒</div>
                therapyhub.com/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-6">
              {/* Top Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, label: "Active Clients", value: "24", change: "+3 this week", color: "blue" },
                  { icon: Calendar, label: "Today's Sessions", value: "5", change: "2 completed", color: "green" },
                  { icon: Clock, label: "Session Hours", value: "142", change: "This month", color: "purple" },
                  { icon: TrendingUp, label: "Success Rate", value: "94%", change: "+5% vs last month", color: "cyan" },
                ].map((stat, index) => (
                  <Card 
                    key={index} 
                    className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 dark:bg-${stat.color}-400/20 flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</div>
                  </Card>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Upcoming Sessions */}
                <div className="col-span-1 space-y-4">
                  <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Upcoming Sessions
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { time: "2:00 PM", name: "Sarah Johnson", type: "Follow-up", color: "bg-blue-500" },
                        { time: "3:30 PM", name: "Michael Chen", type: "Initial", color: "bg-purple-500" },
                        { time: "5:00 PM", name: "Emily Davis", type: "Therapy", color: "bg-cyan-500" },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                          <div className={`w-2 h-12 rounded-full ${session.color}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{session.name}</div>
                            <div className="text-xs text-muted-foreground">{session.type}</div>
                          </div>
                          <div className="text-xs font-semibold text-primary">{session.time}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* AI Insights Card */}
                  <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 border-none">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">AI Insight</h4>
                        <p className="text-xs text-blue-100 leading-relaxed">
                          3 clients showing positive progress this week. Consider scheduling follow-ups.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Middle Column - Recent Activity */}
                <div className="col-span-1">
                  <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Recent Activity
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: Video, text: "Completed session with Sarah J.", time: "1h ago", color: "text-green-500" },
                        { icon: FileText, text: "Generated session notes", time: "1h ago", color: "text-blue-500" },
                        { icon: Brain, text: "AI analysis completed", time: "2h ago", color: "text-purple-500" },
                        { icon: Calendar, text: "New appointment scheduled", time: "3h ago", color: "text-cyan-500" },
                        { icon: FileText, text: "Treatment plan updated", time: "5h ago", color: "text-indigo-500" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                          <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-foreground">{activity.text}</div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right Column - Quick Actions & Progress */}
                <div className="col-span-1 space-y-4">
                  <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      {[
                        { icon: Video, text: "Start Session", color: "bg-blue-500" },
                        { icon: FileText, text: "New Note", color: "bg-purple-500" },
                        { icon: Users, text: "Add Client", color: "bg-cyan-500" },
                      ].map((action, index) => (
                        <Button
                          key={index}
                          className={`w-full justify-start ${action.color} hover:opacity-90 text-white`}
                          size="sm"
                        >
                          <action.icon className="w-4 h-4 mr-2" />
                          {action.text}
                        </Button>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-foreground mb-4">This Week's Progress</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Sessions Completed", value: 12, max: 15, color: "bg-blue-500" },
                        { label: "Notes Generated", value: 10, max: 12, color: "bg-purple-500" },
                        { label: "Client Check-ins", value: 18, max: 20, color: "bg-cyan-500" },
                      ].map((progress, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{progress.label}</span>
                            <span className="text-foreground font-semibold">{progress.value}/{progress.max}</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progress.color} transition-all duration-500`}
                              style={{ width: `${(progress.value / progress.max) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/20 dark:bg-blue-400/30 rounded-2xl blur-2xl animate-float"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/20 dark:bg-purple-400/30 rounded-2xl blur-2xl animate-float-delay-1"></div>
        </div>

        {/* CTA Below Dashboard */}
        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button 
            size="lg" 
            onClick={() => navigate("/login")}
            className="group hover:scale-105 transition-transform"
          >
            Experience the Dashboard
            <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free 14-day trial
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes float-delay-1 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(-5deg);
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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delay-1 {
          animation: float-delay-1 7s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default DashboardPreview;
