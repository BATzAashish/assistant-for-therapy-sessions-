import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoConference from "@/components/VideoConference";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { sessionAPI, authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const VideoSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadSessionData();
  }, [sessionId]);
  
  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userData = await authAPI.getCurrentUser();
      console.log('[VideoSessionPage] Loaded user data:', userData.user);
      setUser(userData.user);
      
      // Get session details
      if (sessionId) {
        const sessionData = await sessionAPI.getById(sessionId);
        setSession(sessionData.session);
      }
      
    } catch (err: any) {
      console.error("Error loading session:", err);
      setError(err.message || "Failed to load session");
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSessionEnd = async (sessionData: any) => {
    try {
      toast({
        title: "Processing Session Data",
        description: "Generating session notes and analysis...",
      });
      
      // Here you would call your AI service to generate MOM
      // For now, we'll just navigate back
      setTimeout(() => {
        navigate(`/dashboard/sessions`);
        toast({
          title: "Session Complete",
          description: "Session notes have been generated",
        });
      }, 2000);
      
    } catch (err: any) {
      console.error("Error processing session:", err);
      toast({
        title: "Error",
        description: "Failed to process session data",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Card className="p-8 bg-slate-800 text-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading session...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error || !session || !sessionId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Card className="p-8 bg-slate-800 text-white max-w-md">
          <h2 className="text-xl font-bold mb-4">Session Not Found</h2>
          <p className="text-slate-300 mb-6">{error || "This session does not exist or you don't have access to it."}</p>
          <Button onClick={() => navigate("/dashboard/sessions")}>
            Back to Sessions
          </Button>
        </Card>
      </div>
    );
  }
  
  // Determine user type based on session ownership
  // If user is the therapist who created the session, they are "therapist"
  // Otherwise, they are "client" (the person being analyzed)
  // Check both _id and id fields (user object might use either)
  const userId = user?._id || user?.id;
  const isSessionTherapist = session?.therapist_id === userId;
  const userType = isSessionTherapist ? "therapist" : "client";
  const userName = user?.full_name || user?.username || "User";
  
  console.log('[VideoSessionPage] User type determination:', {
    userId: userId,
    userIdField: user?._id,
    userIdAlt: user?.id,
    sessionTherapistId: session?.therapist_id,
    isSessionTherapist,
    userType,
    fullUserObject: user
  });
  
  return (
    <VideoConference
      sessionId={sessionId}
      userType={userType}
      userName={userName}
      onSessionEnd={handleSessionEnd}
    />
  );
};

export default VideoSessionPage;
