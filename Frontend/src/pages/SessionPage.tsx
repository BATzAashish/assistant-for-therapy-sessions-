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
} from "lucide-react";
import { sessionAPI, clientAPI } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: searchParams.get("client") || "",
    scheduled_date: "",
    duration: 60,
    session_type: "individual",
    location: "",
    meeting_link: "",
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

    try {
      // Step 1: Get client name for meeting generation
      const selectedClient = clients.find(c => c._id === formData.client_id);
      const clientName = selectedClient?.name || "Client";
      
      // Step 2: Auto-generate Google Meet link
      let generatedMeetingLink = formData.meeting_link;
      
      if (!generatedMeetingLink) {
        toast({
          title: "Generating meeting link...",
          description: "Creating Google Meet link for your session",
        });

        try {
          const scheduledDate = new Date(formData.scheduled_date);
          const endTime = new Date(scheduledDate.getTime() + formData.duration * 60000);
          
          const meetingResponse = await aiAPI.createMeeting({
            client_name: clientName,
            start_time: scheduledDate.toISOString(),
            end_time: endTime.toISOString(),
          });
          
          generatedMeetingLink = meetingResponse.meeting_link;
          
          toast({
            title: "Meeting link generated!",
            description: `Google Meet link created successfully`,
          });
        } catch (meetingError: any) {
          console.warn("Failed to generate meeting link:", meetingError);
          toast({
            title: "Warning",
            description: "Couldn't generate meeting link automatically. You can add it manually later.",
            variant: "destructive",
          });
        }
      }

      // Step 3: Create the session with the meeting link
      const sessionData = {
        client_id: formData.client_id,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        duration: formData.duration,
        session_type: formData.session_type,
        status: "scheduled",
        location: formData.location || undefined,
        meeting_link: generatedMeetingLink || undefined,
      };
      
      console.log("🟢 Sending to API:", sessionData);

      await sessionAPI.create(sessionData);
      toast({
        title: "Success",
        description: generatedMeetingLink 
          ? "Session created with meeting link!" 
          : "Session created successfully",
      });
      setFormData({
        client_id: "",
        scheduled_date: "",
        duration: 60,
        session_type: "individual",
        location: "",
        meeting_link: "",
      });
      setIsOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create session",
        variant: "destructive",
      });
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Sessions
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
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
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule a New Session</DialogTitle>
                  <DialogDescription>
                    Create a new therapy session with a client
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

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    Create Session
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card
                  key={session._id}
                  className="p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {session.client_id?.name || "Unknown Client"}
                        </h3>
                        <Badge
                          className={`${getStatusColor(session.status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(session.status)}
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {session.scheduled_date && formatDate(session.scheduled_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.scheduled_date && formatTime(session.scheduled_date)}
                        </div>
                        {session.duration && (
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            {session.duration} min
                          </div>
                        )}
                        {session.session_type && (
                          <div className="flex items-center gap-2 capitalize">
                            <User className="h-4 w-4" />
                            {session.session_type}
                          </div>
                        )}
                      </div>
                      
                      {/* Location and Meeting Link */}
                      {(session.location || session.meeting_link) && (
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          {session.location && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location}</span>
                            </div>
                          )}
                          {session.meeting_link && (
                            <a
                              href={session.meeting_link}
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

                    <div className="flex gap-2 ml-4">
                      {session.status === "scheduled" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => navigate(`/dashboard/sessions/${session._id}/video`)}
                            title="Join Video Session"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Video
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => handleDeleteSession(session._id)}
                            title="Delete Session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
