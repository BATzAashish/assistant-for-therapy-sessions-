import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { notesAPI } from "@/lib/api";

interface NotesPanelProps {
  activeClient?: string | null;
  activeSession?: string | null;
}

const NotesPanel = ({ activeClient, activeSession }: NotesPanelProps) => {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!activeClient) {
      toast({
        title: "No client selected",
        description: "Please select a client first to save notes.",
        variant: "destructive",
      });
      return;
    }

    if (!notes.trim()) {
      toast({
        title: "Empty notes",
        description: "Please enter some notes before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await notesAPI.create({
        client_id: activeClient,
        session_id: activeSession || undefined,
        content: notes,
        note_type: "session",
      });

      toast({
        title: "Notes saved",
        description: "Session notes have been saved successfully.",
      });

      // Clear notes after saving
      setNotes("");
    } catch (error: any) {
      toast({
        title: "Error saving notes",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 flex flex-col h-64">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Session Notes</h3>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleSave}
          disabled={saving || !notes.trim()}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>

      <Textarea
        placeholder={
          activeClient
            ? "Type your observations, key points, and session notes here..."
            : "Select a client to start taking notes..."
        }
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 resize-none"
        disabled={!activeClient || saving}
      />
    </Card>
  );
};

export default NotesPanel;
