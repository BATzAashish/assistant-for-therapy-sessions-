import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { authAPI, assistantAPI } from "@/lib/api";
import { 
  Brain, 
  Send, 
  Loader2, 
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

const AssistantPage = () => {
  const { collapsed } = useSidebar();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to load user", error);
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to React elements
    let formatted = content;
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (but not already in bold)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
    
    return formatted;
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const response = await assistantAPI.query(query);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer || "I couldn't generate a response.",
        sources: response.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Query failed",
        description: error.message || "Failed to process query",
        variant: "destructive",
      });

      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user} />
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="container mx-auto px-6 py-8 max-w-full h-screen flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                AI Assistant
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Ask questions about your clients, notes, and therapy resources using RAG-powered AI
            </p>
          </div>

          {/* Chat Interface - Full Height */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle>Chat with Assistant</CardTitle>
              <CardDescription>
                Ask questions about your practice, clients, session notes, or therapy techniques
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Messages - Scrollable Area */}
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto pr-2 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-500">
                      <Brain className="h-20 w-20 mx-auto mb-6 opacity-40" />
                      <p className="text-xl font-medium mb-3">Start a conversation with your AI assistant</p>
                      <div className="text-base space-y-2 max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
                        <p className="font-semibold text-purple-600 dark:text-purple-400">💡 Try asking:</p>
                        <div className="space-y-1">
                          <p className="bg-slate-100 dark:bg-slate-800 rounded px-4 py-2">"What are the latest notes for John Doe?"</p>
                          <p className="bg-slate-100 dark:bg-slate-800 rounded px-4 py-2">"Summarize all client progress this month"</p>
                          <p className="bg-slate-100 dark:bg-slate-800 rounded px-4 py-2">"What are effective techniques for anxiety treatment?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      } animate-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-5 shadow-md ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                          <div 
                            className="whitespace-pre-wrap leading-relaxed text-base break-words word-break"
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                          />
                        </div>
                        <p className="text-xs opacity-60 mt-3 whitespace-nowrap">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-md">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Assistant is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Query Input - Fixed at Bottom */}
              <div className="border-t pt-4 flex-shrink-0">
                <form onSubmit={handleQuery} className="flex gap-3">
                  <Input
                    placeholder="Ask a question about your practice, clients, or notes..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="flex-1 h-14 text-base"
                  />
                  <Button type="submit" disabled={loading || !query.trim()} size="lg" className="px-8 h-14">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AssistantPage;
