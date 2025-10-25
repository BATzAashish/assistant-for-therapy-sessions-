import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const NotesPanel = () => {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Notes saved",
      description: "Session notes have been saved successfully.",
    });
  };

  return (
    <Card className="p-4 flex flex-col h-64">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Session Notes</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>

      <Textarea
        placeholder="Type your observations, key points, and session notes here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 resize-none"
      />
    </Card>
  );
};

export default NotesPanel;
