import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionControlsProps {
  sessionActive: boolean;
  onSessionToggle: () => void;
}

const SessionControls = ({
  sessionActive,
  onSessionToggle,
}: SessionControlsProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Session notes and transcript are being prepared for download.",
    });
  };

  const handleEndSession = () => {
    if (sessionActive) {
      toast({
        title: "Session ended",
        description: "The session has been concluded and saved.",
      });
      onSessionToggle();
    }
  };

  return (
    <div className="border-t border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {!sessionActive ? (
            <Button onClick={onSessionToggle} className="space-x-2">
              <Play className="h-4 w-4" />
              <span>Start Session</span>
            </Button>
          ) : (
            <>
              <Button variant="secondary" className="space-x-2">
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndSession}
                className="space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>End Session</span>
              </Button>
            </>
          )}
        </div>

        <Button variant="outline" onClick={handleExport} className="space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Notes</span>
        </Button>
      </div>
    </div>
  );
};

export default SessionControls;
