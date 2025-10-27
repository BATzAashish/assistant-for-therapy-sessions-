import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import ThreeDCalendar from "@/components/ThreeDCalendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Plus, Video, Clock, MapPin } from "lucide-react";
import { sessionAPI, authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";

interface Session {
  _id: string;
  client_id: {
    _id: string;
    name: string;
  };
  scheduled_date: string;
  duration?: number;
  status: string;
  location?: string;
  meeting_link?: string;
}

interface User {
  full_name: string;
  email: string;
  specialization?: string;
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collapsed } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = await authAPI.getCurrentUser();
      setUser(userData.user);

      const sessionsResponse = await sessionAPI.getAll();
      const sessionsData = sessionsResponse.sessions || [];
      setSessions(sessionsData);
    } catch (error: any) {
      toast({
        title: "Error loading calendar",
        description: error.message || "Failed to load calendar data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      if (!session.scheduled_date) return false;
      const sessionDate = new Date(session.scheduled_date);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClientColor = (clientId: string) => {
    const colors = [
      { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", light: "bg-blue-100 dark:bg-blue-950" },
      { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", light: "bg-purple-100 dark:bg-purple-950" },
      { bg: "bg-green-500", text: "text-green-500", border: "border-green-500", light: "bg-green-100 dark:bg-green-950" },
      { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", light: "bg-orange-100 dark:bg-orange-950" },
      { bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-500", light: "bg-pink-100 dark:bg-pink-950" },
      { bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500", light: "bg-teal-100 dark:bg-teal-950" },
      { bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500", light: "bg-indigo-100 dark:bg-indigo-950" },
      { bg: "bg-red-500", text: "text-red-500", border: "border-red-500", light: "bg-red-100 dark:bg-red-950" },
    ];
    
    const hash = clientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });
  const year = currentDate.getFullYear();
  const selectedDateSessions = getSessionsForDate(selectedDate);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user || undefined} />

      <div 
        className={`flex-1 overflow-hidden transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Main Calendar Area - Full Height */}
        <div className="h-screen p-3 pr-[320px] overflow-hidden relative flex items-stretch">
          {loading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <Card className="p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {monthName} {year}
                  </h2>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={previousMonth}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentDate(new Date());
                        setSelectedDate(new Date());
                      }}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 h-8 text-xs px-3"
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={nextMonth}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <ThreeDCalendar
                    currentDate={currentDate}
                    sessions={sessions}
                    onDateClick={setSelectedDate}
                    getClientColor={getClientColor}
                    getInitials={getInitials}
                    formatTime={formatTime}
                  />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Fixed Session Panel on Right - Full Height */}
        <div className="fixed top-3 right-3 w-[310px] h-[calc(100vh-24px)] z-10">
          <Card className="p-4 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0 pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <Badge variant="outline" className="font-semibold text-[10px] h-4">
                  {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {selectedDateSessions.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                      <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      No sessions scheduled
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                      Create a new session to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                      {selectedDateSessions
                        .sort(
                          (a, b) =>
                            new Date(a.scheduled_date || 0).getTime() -
                            new Date(b.scheduled_date || 0).getTime()
                        )
                        .map((session) => {
                          const color = getClientColor(session.client_id?._id || "");
                          return (
                            <div
                              key={session._id}
                              className={`
                                group p-2 rounded-md transition-all duration-200
                                hover:scale-[1.01] hover:shadow-md cursor-pointer
                                border-l-2 ${color.border}
                                bg-white dark:bg-slate-800
                                shadow-sm
                              `}
                              onClick={() => navigate(`/dashboard/sessions`)}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6 ring-1 ring-white dark:ring-slate-700">
                                    <AvatarFallback className={`${color.bg} text-white text-[9px] font-bold`}>
                                      {getInitials(session.client_id?.name || "Unknown")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-[10px] text-slate-900 dark:text-white">
                                      {session.client_id?.name || "Unknown Client"}
                                    </p>
                                    <div className="flex items-center gap-0.5 text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      <Clock className="h-2 w-2" />
                                      <span>
                                        {session.scheduled_date ? formatTime(session.scheduled_date) : "Time not set"}
                                        {session.duration && ` • ${session.duration} min`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {session.location && (
                                <div className="flex items-center gap-0.5 text-[9px] text-slate-600 dark:text-slate-400 mb-1.5 pl-8">
                                  <MapPin className="h-2 w-2" />
                                  <span className="truncate">{session.location}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pl-8">
                                <Badge
                                  variant={
                                    session.status === "scheduled"
                                      ? "default"
                                      : session.status === "completed"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-[9px] h-4 px-1.5"
                                >
                                  {session.status}
                                </Badge>
                                {session.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`${color.text} border-current hover:${color.bg} hover:text-white transition-all h-5 text-[9px] px-1.5`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (session.meeting_link) {
                                        window.open(session.meeting_link, "_blank");
                                      } else {
                                        navigate(`/dashboard/sessions/${session._id}/video`);
                                      }
                                    }}
                                  >
                                    <Video className="h-2 w-2 mr-0.5" />
                                    Join
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            </Card>
          </div>
      </div>
    </div>
  );
};

export default CalendarPage;
