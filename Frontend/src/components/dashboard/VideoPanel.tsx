import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Maximize2, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoPanelProps {
  sessionActive: boolean;
}

const VideoPanel = ({ sessionActive }: VideoPanelProps) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  return (
    <Card className="flex-1 p-4 bg-secondary/30 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Live Session</h2>
        <Button variant="ghost" size="icon">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 bg-muted rounded-lg overflow-hidden relative min-h-0">
        {sessionActive ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <div className="text-center space-y-3">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <User className="h-16 w-16 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Emma Thompson</p>
                <p className="text-sm text-muted-foreground">Session in progress</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <VideoOff className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No active session</p>
            </div>
          </div>
        )}

        {/* Video Controls Overlay */}
        {sessionActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <Button
              variant={videoEnabled ? "default" : "destructive"}
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => setVideoEnabled(!videoEnabled)}
            >
              {videoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={audioEnabled ? "default" : "destructive"}
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {sessionActive && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Duration: 24:15</span>
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                sessionActive ? "bg-success" : "bg-muted"
              )}
            />
            <span className="text-muted-foreground">Recording</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VideoPanel;
