import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Video, FileText, Activity, Users, Calendar, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const DashboardPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="dashboard-preview" className="relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">See It In Action</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground px-4">
              Your Command Center for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Therapy Excellence
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-4 px-6">
              Everything you need at your fingertips - intuitive, powerful, and beautifully designed
            </p>
          </div>
        }
      >
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-6 rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Users, label: "Active Clients", value: "24", change: "+3 this week" },
              { icon: Calendar, label: "Today's Sessions", value: "5", change: "2 completed" },
              { icon: Clock, label: "Session Hours", value: "142", change: "This month" },
              { icon: TrendingUp, label: "Success Rate", value: "94%", change: "+5% vs last month" },
            ].map((stat, index) => (
              <Card 
                key={index} 
                className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Upcoming Sessions</h3>
              </div>
              <div className="space-y-3">
                {[
                  { time: "2:00 PM", name: "Sarah Johnson", type: "Follow-up" },
                  { time: "3:30 PM", name: "Michael Chen", type: "Initial" },
                  { time: "5:00 PM", name: "Emily Davis", type: "Therapy" },
                ].map((session, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground">{session.name}</div>
                      <div className="text-xs text-muted-foreground">{session.type}</div>
                    </div>
                    <div className="text-xs font-semibold text-primary">{session.time}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Video, text: "Completed session with Sarah J.", time: "1h ago" },
                  { icon: FileText, text: "Generated session notes", time: "1h ago" },
                  { icon: Brain, text: "AI analysis completed", time: "2h ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2">
                    <activity.icon className="w-4 h-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-foreground">{activity.text}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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
          </div>
        </div>
      </ContainerScroll>
      
      <div className="container mx-auto px-6 text-center pb-20">
        <Button 
          size="lg" 
          onClick={() => navigate("/login")}
          className="group hover:scale-105 transition-transform"
        >
          Experience the Dashboard
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required  Free 14-day trial
        </p>
      </div>
    </section>
  );
};

export default DashboardPreview;
