import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Video,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { clientAPI, sessionAPI, authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";

interface Client {
  _id: string;
  name: string;
  email: string;
  status: string;
  diagnosis?: string;
}

interface Session {
  _id: string;
  client_id: {
    _id: string;
    name: string;
  };
  start_time: string;
  end_time: string;
  status: string;
  duration?: number;
}

interface User {
  full_name: string;
  email: string;
  specialization?: string;
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collapsed } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    upcomingSessions: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData.user);

      // Fetch clients
      const clientsResponse = await clientAPI.getAll();
      const clientsData = clientsResponse.clients || [];
      setClients(clientsData);

      // Fetch sessions
      const sessionsResponse = await sessionAPI.getAll();
      const sessionsData = sessionsResponse.sessions || [];
      
      // Filter upcoming sessions (scheduled status)
      const upcoming = sessionsData
        .filter((s: Session) => s.status === "scheduled")
        .sort(
          (a: Session, b: Session) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        .slice(0, 5);
      setUpcomingSessions(upcoming);

      // Calculate stats
      const activeClients = clientsData.filter(
        (c: Client) => c.status === "active"
      ).length;
      
      const today = new Date().toDateString();
      const completedToday = sessionsData.filter((s: Session) => {
        const sessionDate = new Date(s.start_time).toDateString();
        return sessionDate === today && s.status === "completed";
      }).length;

      setStats({
        totalClients: clientsData.length,
        activeClients,
        upcomingSessions: upcoming.length,
        completedToday,
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (name: string) => {
    const firstName = name.split(" ")[0];
    // Add "Dr." prefix if not already present
    if (name.toLowerCase().startsWith("dr.") || name.toLowerCase().startsWith("dr ")) {
      return firstName;
    }
    return `Dr. ${firstName}`;
  };

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "bg-blue-500",
      trend: "+12%",
    },
    {
      title: "Active Clients",
      value: stats.activeClients,
      icon: TrendingUp,
      color: "bg-green-500",
      trend: "+8%",
    },
    {
      title: "Upcoming Sessions",
      value: stats.upcomingSessions,
      icon: Calendar,
      color: "bg-purple-500",
      trend: stats.upcomingSessions.toString(),
    },
    {
      title: "Sessions Today",
      value: stats.completedToday,
      icon: Clock,
      color: "bg-orange-500",
      trend: "Completed",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user || undefined} />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user || undefined} />

      {/* Main Content */}
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user ? getDisplayName(user.full_name) : "Doctor"}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Here's what's happening with your practice today
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard/add-client")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {stat.trend}
                    </p>
                  </div>
                  <div
                    className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Upcoming Sessions
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard/sessions")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No upcoming sessions scheduled
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => navigate("/dashboard/calendar")}
                  >
                    Schedule a session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/sessions/${session._id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                            {getInitials(session.client_id.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {session.client_id.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(session.start_time)}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Clients */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Clients
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard/clients")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 mb-3">
                    No clients yet
                  </p>
                  <Button onClick={() => navigate("/dashboard/add-client")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 5).map((client) => (
                    <div
                      key={client._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-semibold">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {client.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {client.diagnosis || "No diagnosis"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          client.status === "active" ? "default" : "secondary"
                        }
                      >
                        {client.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
