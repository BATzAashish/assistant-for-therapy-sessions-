import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Video,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  ChevronRight,
  MapPin,
  Link as LinkIcon,
  Search,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { sessionAPI, clientAPI, notesAPI } from "@/lib/api";
import { aiAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/contexts/SidebarContext";

interface Session {
  _id: string;
  client_id: {
    _id: string;
    name: string;
  };
  scheduled_date: string;
  status: string;
  duration?: number;
  session_type?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  meeting_link?: string;
}

const SessionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collapsed } = useSidebar();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSelectedDates, setClientSelectedDates] = useState<Map<string, string>>(new Map());
  const [formData, setFormData] = useState({
    client_id: searchParams.get("client") || "",
    scheduled_date: "",
    duration: 60,
    session_type: "individual",
    location: "",
    meeting_link: "",
    // Recurring session fields
    is_recurring: false,
    recurrence_type: "weekly" as "weekly" | "monthly" | "custom",
    recurrence_count: 4,
    custom_interval_days: 7,
  });

  useEffect(() => {
    const clientParam = searchParams.get("client");
    const nameParam = searchParams.get("name");
    console.log("🔍 URL Params - client:", clientParam, "name:", nameParam);
    
    fetchSessions();
    fetchClients();
    
    // Open dialog if client is pre-selected from URL
    if (searchParams.get("client")) {
      setIsOpen(true);
    }
  }, []);

  // Filter sessions based on search term only
  useEffect(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((session) => 
        session.client_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm]);

  // Get unique dates for a specific client
  const getClientDates = (clientId: string) => {
    const clientSessions = sessions.filter(s => s.client_id?._id === clientId);
    const dates = clientSessions.map(session => {
      const date = new Date(session.scheduled_date);
      return date.toISOString().split('T')[0];
    });
    return Array.from(new Set(dates)).sort();
  };

  // Set selected date for a client
  const setClientSelectedDate = (clientId: string, date: string) => {
    setClientSelectedDates(prev => {
      const newMap = new Map(prev);
      newMap.set(clientId, date);
      return newMap;
    });
  };

  // Get sessions for a client on selected date
  const getClientSessionsForDate = (clientId: string) => {
    const selectedDate = clientSelectedDates.get(clientId);
    const clientSessions = sessions.filter(s => s.client_id?._id === clientId);
    
    if (!selectedDate) {
      return clientSessions;
    }
    
    return clientSessions.filter(session => {
      const sessionDate = new Date(session.scheduled_date).toISOString().split('T')[0];
      return sessionDate === selectedDate;
    });
  };

  // Group sessions by client
  const getGroupedSessions = () => {
    const grouped = new Map<string, Session[]>();
    
    filteredSessions.forEach(session => {
      const clientId = session.client_id?._id;
      if (!clientId) return;
      
      if (!grouped.has(clientId)) {
        grouped.set(clientId, []);
      }
      grouped.get(clientId)!.push(session);
    });

    return grouped;
  };

  // Format date for display in dropdown
  const formatDateForDropdown = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `Today - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else if (isTomorrow) {
      return `Tomorrow - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
      return `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`;
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getAll();
      setSessions(response.sessions || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll();
      setClients(response.clients || []);
    } catch (error: any) {
      console.error("Failed to load clients", error);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (submitting) {
      console.log("⚠️ Already submitting, ignoring duplicate request");
      return;
    }
    
    console.log("🟢 Form Data:", formData);
    console.log("🟢 Available Clients:", clients.map(c => ({ id: c._id, name: c.name })));
    
    if (!formData.client_id || !formData.scheduled_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);

    try {
      const selectedClient = clients.find(c => c._id === formData.client_id);
      const clientName = selectedClient?.name || "Client";
      
      // Calculate sessions to create based on recurrence
      const sessionsToCreate = [];
      const baseDate = new Date(formData.scheduled_date);
      const sessionCount = formData.is_recurring ? formData.recurrence_count : 1;
      
      for (let i = 0; i < sessionCount; i++) {
        let sessionDate = new Date(baseDate);
        
        if (i > 0) {
          // Calculate future dates based on recurrence type
          if (formData.recurrence_type === "weekly") {
            sessionDate.setDate(baseDate.getDate() + (i * 7));
          } else if (formData.recurrence_type === "monthly") {
            sessionDate.setMonth(baseDate.getMonth() + i);
          } else if (formData.recurrence_type === "custom") {
            sessionDate.setDate(baseDate.getDate() + (i * formData.custom_interval_days));
          }
        }
        
        // Auto-generate meeting link for each session
        let meetingLink = formData.meeting_link;
        
        if (!meetingLink) {
          try {
            const endTime = new Date(sessionDate.getTime() + formData.duration * 60000);
            const meetingResponse = await aiAPI.createMeeting({
              client_name: clientName,
              start_time: sessionDate.toISOString(),
              end_time: endTime.toISOString(),
            });
            meetingLink = meetingResponse.meeting_link;
          } catch (meetingError) {
            console.warn("Failed to generate meeting link:", meetingError);
          }
        }
        
        sessionsToCreate.push({
          client_id: formData.client_id,
          scheduled_date: sessionDate.toISOString(),
          duration: formData.duration,
          session_type: formData.session_type,
          status: "scheduled",
          location: formData.location || undefined,
          meeting_link: meetingLink || undefined,
        });
      }
      
      // Create all sessions
      const createdSessions = [];
      for (const sessionData of sessionsToCreate) {
        try {
          console.log(`📤 Creating session for ${new Date(sessionData.scheduled_date).toLocaleString()}`);
          const result = await sessionAPI.create(sessionData);
          
          // Check if it was a duplicate (status 200 vs 201)
          if (result.message === 'Session already exists') {
            console.log('⚠️ Duplicate session detected by backend, skipping');
          } else {
            createdSessions.push(result);
            console.log('✅ Session created successfully');
          }
        } catch (error) {
          console.error("❌ Failed to create session:", error);
        }
      }
      
      toast({
        title: "Success",
        description: formData.is_recurring 
          ? `Created ${createdSessions.length} recurring sessions!`
          : "Session created successfully",
      });
      
      setFormData({
        client_id: "",
        scheduled_date: "",
        duration: 60,
        session_type: "individual",
        location: "",
        meeting_link: "",
        is_recurring: false,
        recurrence_type: "weekly",
        recurrence_count: 4,
        custom_interval_days: 7,
      });
      setIsOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to cancel this session?")) {
      try {
        await sessionAPI.cancel(sessionId);
        toast({
          title: "Success",
          description: "Session cancelled successfully",
        });
        fetchSessions();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel session",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      try {
        await sessionAPI.delete(sessionId);
        toast({
          title: "Success",
          description: "Session deleted successfully",
        });
        fetchSessions();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete session",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Sessions
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and schedule therapy sessions
              </p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                    <Plus className="h-5 w-5 mr-2" />
                    New Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule a New Session</DialogTitle>
                  <DialogDescription>
                    Create single or recurring therapy sessions with a client
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <select
                      id="client"
                      value={formData.client_id}
                      onChange={(e) =>
                        setFormData({ ...formData, client_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled-date">Scheduled Date & Time *</Label>
                    <Input
                      id="scheduled-date"
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduled_date: e.target.value })
                      }
                      className="border-slate-300 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })
                      }
                      className="border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-type">Session Type</Label>
                    <select
                      id="session-type"
                      value={formData.session_type}
                      onChange={(e) =>
                        setFormData({ ...formData, session_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="individual">Individual</option>
                      <option value="group">Group</option>
                      <option value="family">Family</option>
                      <option value="couples">Couples</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., Office 201, Online, etc."
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-link">
                      Meeting Link (Optional)
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        Auto-generated if empty
                      </span>
                    </Label>
                    <Input
                      id="meeting-link"
                      type="url"
                      placeholder="Leave empty to auto-generate Google Meet link"
                      value={formData.meeting_link}
                      onChange={(e) =>
                        setFormData({ ...formData, meeting_link: e.target.value })
                      }
                      className="border-slate-300 dark:border-slate-700"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      💡 A Google Meet link will be created automatically if you don't provide one
                    </p>
                  </div>

                  {/* Recurring Session Options */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="is-recurring"
                        checked={formData.is_recurring}
                        onChange={(e) =>
                          setFormData({ ...formData, is_recurring: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="is-recurring" className="cursor-pointer font-semibold">
                        Schedule Recurring Sessions
                      </Label>
                    </div>

                    {formData.is_recurring && (
                      <div className="space-y-3 pl-6 border-l-2 border-blue-300 dark:border-blue-700">
                        <div className="space-y-2">
                          <Label htmlFor="recurrence-type">Recurrence Pattern</Label>
                          <select
                            id="recurrence-type"
                            value={formData.recurrence_type}
                            onChange={(e) =>
                              setFormData({ 
                                ...formData, 
                                recurrence_type: e.target.value as "weekly" | "monthly" | "custom" 
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="weekly">Weekly (Every 7 days)</option>
                            <option value="monthly">Monthly (Every 30 days)</option>
                            <option value="custom">Custom Interval</option>
                          </select>
                        </div>

                        {formData.recurrence_type === "custom" && (
                          <div className="space-y-2">
                            <Label htmlFor="custom-interval">Interval (Days)</Label>
                            <Input
                              id="custom-interval"
                              type="number"
                              min="1"
                              max="90"
                              value={formData.custom_interval_days}
                              onChange={(e) =>
                                setFormData({ 
                                  ...formData, 
                                  custom_interval_days: parseInt(e.target.value) || 7 
                                })
                              }
                              className="border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="recurrence-count">Number of Sessions</Label>
                          <Input
                            id="recurrence-count"
                            type="number"
                            min="2"
                            max="52"
                            value={formData.recurrence_count}
                            onChange={(e) =>
                              setFormData({ 
                                ...formData, 
                                recurrence_count: parseInt(e.target.value) || 4 
                              })
                            }
                            className="border-slate-300 dark:border-slate-700"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formData.recurrence_type === "weekly" 
                              ? `📅 Creates ${formData.recurrence_count} weekly sessions`
                              : formData.recurrence_type === "monthly"
                              ? `📅 Creates ${formData.recurrence_count} monthly sessions`
                              : `📅 Creates ${formData.recurrence_count} sessions every ${formData.custom_interval_days} days`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      "Creating..."
                    ) : formData.is_recurring ? (
                      `Create ${formData.recurrence_count} Sessions`
                    ) : (
                      "Create Session"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search sessions by client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Sessions
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start by creating your first therapy session
              </p>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Sessions Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm 
                  ? `No sessions match "${searchTerm}". Try a different search term.`
                  : "No sessions found."}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Array.from(getGroupedSessions().entries()).map(([clientId, allClientSessions]) => {
                const clientDates = getClientDates(clientId);
                const selectedDate = clientSelectedDates.get(clientId) || clientDates[0];
                const displaySessions = getClientSessionsForDate(clientId);
                const primarySession = displaySessions[0];
                
                if (!primarySession) return null;

                return (
                  <Card
                    key={clientId}
                    className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Primary Session Display */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {primarySession.client_id?.name || "Unknown Client"}
                            </h3>
                            <Badge
                              className={`${getStatusColor(primarySession.status)} flex items-center gap-1`}
                            >
                              {getStatusIcon(primarySession.status)}
                              {primarySession.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {primarySession.scheduled_date && formatDate(primarySession.scheduled_date)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {primarySession.scheduled_date && formatTime(primarySession.scheduled_date)}
                            </div>
                            {primarySession.duration && (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                {primarySession.duration} min
                              </div>
                            )}
                            {primarySession.session_type && (
                              <div className="flex items-center gap-2 capitalize">
                                <User className="h-4 w-4" />
                                {primarySession.session_type}
                              </div>
                            )}
                          </div>
                          
                          {/* Location and Meeting Link */}
                          {(primarySession.location || primarySession.meeting_link) && (
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              {primarySession.location && (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <MapPin className="h-4 w-4" />
                                  <span>{primarySession.location}</span>
                                </div>
                              )}
                              {primarySession.meeting_link && (
                                <a
                                  href={primarySession.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                  <span>Join Meeting</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Date Selector Dropdown for this client */}
                          {clientDates.length > 1 && (
                            <select
                              value={selectedDate}
                              onChange={(e) => setClientSelectedDate(clientId, e.target.value)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {clientDates.map((date) => (
                                <option key={date} value={date}>
                                  📅 {formatDateForDropdown(date)}
                                </option>
                              ))}
                            </select>
                          )}
                          {primarySession.status === "scheduled" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => navigate(`/dashboard/sessions/${primarySession._id}/video`)}
                                title="Join Video Session"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 dark:text-orange-400 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                                onClick={() => handleCancelSession(primarySession._id)}
                                title="Cancel Session"
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDeleteSession(primarySession._id)}
                                title="Delete Session"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
