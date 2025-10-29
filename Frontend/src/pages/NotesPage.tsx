import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Calendar,
  User,
  Search,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { notesAPI, sessionAPI, clientAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/contexts/SidebarContext";

interface Note {
  _id: string;
  session_id: {
    _id: string;
    start_time: string;
  };
  client_id: {
    _id: string;
    name: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
  type?: string;
}

const NotesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collapsed } = useSidebar();
  const [notes, setNotes] = useState<Note[]>([]);
  const [groupedNotes, setGroupedNotes] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    session_id: "",
    content: "",
    note_type: "general",
  });

  useEffect(() => {
    fetchNotes();
    fetchSessions();
    fetchClients();
  }, []);

  useEffect(() => {
    // Sort notes by created date (chronological order - earliest first)
    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
    
    // Group notes by client and session
    const grouped: any = {};
    
    sortedNotes.forEach((note) => {
      const clientId = note.client_id?._id;
      const clientName = note.client_id?.name || "Unknown Client";
      const sessionId = note.session_id?._id || "no-session";
      
      if (!grouped[clientId]) {
        grouped[clientId] = {
          clientName,
          sessions: {},
        };
      }
      
      if (!grouped[clientId].sessions[sessionId]) {
        grouped[clientId].sessions[sessionId] = {
          sessionDate: note.session_id?.start_time,
          notes: [],
        };
      }
      
      grouped[clientId].sessions[sessionId].notes.push(note);
    });
    
    // Filter by search term
    if (searchTerm) {
      const filtered: any = {};
      Object.keys(grouped).forEach((clientId) => {
        const client = grouped[clientId];
        if (client.clientName.toLowerCase().includes(searchTerm.toLowerCase())) {
          filtered[clientId] = client;
        } else {
          // Check if any note content matches
          Object.keys(client.sessions).forEach((sessionId) => {
            const session = client.sessions[sessionId];
            const matchingNotes = session.notes.filter((note: Note) =>
              note.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (matchingNotes.length > 0) {
              if (!filtered[clientId]) {
                filtered[clientId] = {
                  clientName: client.clientName,
                  sessions: {},
                };
              }
              filtered[clientId].sessions[sessionId] = {
                ...session,
                notes: matchingNotes,
              };
            }
          });
        }
      });
      setGroupedNotes(filtered);
    } else {
      setGroupedNotes(grouped);
    }
  }, [notes, searchTerm]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getAll();
      setNotes(response.notes || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.sessions || []);
    } catch (error: any) {
      console.error("Failed to load sessions", error);
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

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.content) {
      toast({
        title: "Error",
        description: "Please select a client and enter note content",
        variant: "destructive",
      });
      return;
    }

    try {
      const noteData: any = {
        client_id: formData.client_id,
        content: formData.content,
        note_type: formData.note_type,
      };
      
      // Only include session_id if it's selected
      if (formData.session_id) {
        noteData.session_id = formData.session_id;
      }

      await notesAPI.create(noteData);
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      setFormData({
        client_id: "",
        session_id: "",
        content: "",
        note_type: "general",
      });
      setIsOpen(false);
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await notesAPI.delete(noteId);
        toast({
          title: "Success",
          description: "Note deleted successfully",
        });
        fetchNotes();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete note",
          variant: "destructive",
        });
      }
    }
  };

  const getNoteTypeColor = (type?: string) => {
    switch (type) {
      case "clinical":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "treatment-plan":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "general":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNoteContent = (content: string) => {
    if (!content) return '';
    
    // Convert markdown-style formatting to HTML
    let formatted = content
      // Headers (## Header)
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 flex items-center gap-2"><span class="w-1 h-6 bg-blue-500 rounded"></span>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b-2 border-blue-500">$1</h1>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">$1</h3>')
      
      // Bold text (**text**) - with yellow highlight background
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</strong>')
      
      // Lists with bullets (both * and - formats)
      .replace(/^\* (.+)$/gm, '<li class="ml-4 mb-2 flex items-start gap-2"><span class="text-blue-500 mt-1 font-bold">•</span><span class="flex-1">$1</span></li>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-2 flex items-start gap-2"><span class="text-blue-500 mt-1 font-bold">•</span><span class="flex-1">$1</span></li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-2 flex items-start gap-2"><span class="text-blue-500 font-semibold min-w-[20px]">$1.</span><span class="flex-1">$2</span></li>')
      
      // Transcript timestamps [00:00]
      .replace(/\[(\d{2}:\d{2})\]/g, '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">⏱️ $1</span>')
      
      // Horizontal rules (---)
      .replace(/^---$/gm, '<hr class="my-6 border-t-2 border-slate-200 dark:border-slate-700" />')
      
      // Paragraphs (double line breaks)
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
      
      // Single line breaks
      .replace(/\n/g, '<br />');
    
    // Wrap lists in ul tags
    formatted = formatted.replace(/(<li class="ml-4 mb-2 flex items-start gap-2"><span class="text-blue-500[^>]*>•<\/span>.*?<\/li>(\s|<br \/>)*)+/g, (match) => {
      return '<ul class="space-y-1 mb-4">' + match.replace(/<br \/>/g, '') + '</ul>';
    });
    
    formatted = formatted.replace(/(<li class="ml-4 mb-2 flex items-start gap-2"><span class="text-blue-500 font-semibold[^>]*>\d+\.<\/span>.*?<\/li>(\s|<br \/>)*)+/g, (match) => {
      return '<ol class="space-y-1 mb-4">' + match.replace(/<br \/>/g, '') + '</ol>';
    });
    
    // Wrap everything in a paragraph if it doesn't start with a tag
    if (!formatted.startsWith('<')) {
      formatted = '<p class="mb-4 leading-relaxed">' + formatted + '</p>';
    } else {
      formatted = '<div>' + formatted + '</div>';
    }
    
    return formatted;
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Session Notes
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage clinical notes and observations
              </p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <Plus className="h-5 w-5 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create a New Note</DialogTitle>
                  <DialogDescription>
                    Add clinical notes or observations from a session
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <select
                      id="client"
                      value={formData.client_id}
                      onChange={(e) => {
                        setFormData({ ...formData, client_id: e.target.value, session_id: "" });
                      }}
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
                    <Label htmlFor="session">Session (Optional)</Label>
                    <select
                      id="session"
                      value={formData.session_id}
                      onChange={(e) =>
                        setFormData({ ...formData, session_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      disabled={!formData.client_id}
                    >
                      <option value="">General note (no specific session)</option>
                      {sessions
                        .filter((session) => session.client_id?._id === formData.client_id)
                        .map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.scheduled_date
                              ? new Date(session.scheduled_date).toLocaleDateString()
                              : "Session"}{" "}
                            - {session.status}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Note Type</Label>
                    <select
                      id="type"
                      value={formData.note_type}
                      onChange={(e) =>
                        setFormData({ ...formData, note_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="general">General</option>
                      <option value="clinical">Clinical</option>
                      <option value="treatment-plan">Treatment Plan</option>
                      <option value="progress">Progress Update</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Note Content</Label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Enter your notes here..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    Create Note
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search notes by client name or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
            </div>
          ) : Object.keys(groupedNotes).length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Notes
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm
                  ? "No notes match your search"
                  : "Start by creating your first session note"}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotes).map(([clientId, clientData]: [string, any]) => (
                <Card key={clientId} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {clientData.clientName}
                    </h2>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {Object.entries(clientData.sessions)
                      .sort(([, sessionDataA]: [string, any], [, sessionDataB]: [string, any]) => {
                        // Sort sessions by date (chronological order - earliest first)
                        if (!sessionDataA.sessionDate) return 1;
                        if (!sessionDataB.sessionDate) return -1;
                        const dateA = new Date(sessionDataA.sessionDate).getTime();
                        const dateB = new Date(sessionDataB.sessionDate).getTime();
                        return dateA - dateB;
                      })
                      .map(([sessionId, sessionData]: [string, any], index) => (
                      <AccordionItem key={sessionId} value={sessionId}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            <span className="font-semibold">
                              Session {index + 1}
                              {sessionData.sessionDate &&
                                ` - ${new Date(sessionData.sessionDate).toLocaleDateString()}`}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {sessionData.notes.length} {sessionData.notes.length === 1 ? "note" : "notes"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 mt-4">
                            {sessionData.notes.map((note: Note) => (
                              <Card key={note._id} className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    {note.type && (
                                      <Badge className={`${getNoteTypeColor(note.type)} capitalize text-xs`}>
                                        {note.type}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(note.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                      onClick={() => handleDeleteNote(note._id)}
                                      title="Delete note"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                                  dangerouslySetInnerHTML={{
                                    __html: formatNoteContent(note.content)
                                  }}
                                />
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
