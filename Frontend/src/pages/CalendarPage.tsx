import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Plus, Video } from "lucide-react";
import { sessionAPI, authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";

interface Session {
  _id: string;
  client_id: {
    _id: string;
    name: string;
  };
  start_time: string;
  end_time: string;
  status: string;
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.start_time);
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

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });
  const year = currentDate.getFullYear();
  const today = new Date();
  const selectedDateSessions = getSessionsForDate(selectedDate);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user || undefined} />

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
                Calendar
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                View and manage your scheduled sessions
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard/sessions/new")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {monthName} {year}
                    </h2>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={previousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentDate(new Date());
                          setSelectedDate(new Date());
                        }}
                      >
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day names */}
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Empty cells before first day */}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square p-2" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        day
                      );
                      const sessionsOnDay = getSessionsForDate(date);
                      const isToday =
                        date.toDateString() === today.toDateString();
                      const isSelected =
                        date.toDateString() === selectedDate.toDateString();

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`aspect-square p-2 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : isToday
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-sm font-medium">{day}</div>
                          {sessionsOnDay.length > 0 && (
                            <div className="mt-1 flex justify-center">
                              <div
                                className={`w-1 h-1 rounded-full ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-blue-600 dark:bg-blue-400"
                                }`}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Selected Date Sessions */}
              <div>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>

                  {selectedDateSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-slate-400 mb-2">
                        <svg
                          className="mx-auto h-12 w-12"
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
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No sessions scheduled
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateSessions
                        .sort(
                          (a, b) =>
                            new Date(a.start_time).getTime() -
                            new Date(b.start_time).getTime()
                        )
                        .map((session) => (
                          <div
                            key={session._id}
                            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                                    {getInitials(session.client_id.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                                    {session.client_id.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatTime(session.start_time)} -{" "}
                                    {formatTime(session.end_time)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  session.status === "scheduled"
                                    ? "default"
                                    : session.status === "completed"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {session.status}
                              </Badge>
                              {session.status === "scheduled" && (
                                <Button size="sm" variant="outline">
                                  <Video className="h-3 w-3 mr-1" />
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
