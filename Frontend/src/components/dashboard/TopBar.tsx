import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TopBar = () => {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">TherapyHub</h1>
          <p className="text-xs text-muted-foreground">Professional Session Portal</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            2
          </Badge>
        </Button>

        <div className="flex items-center space-x-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Dr. Sarah Mitchell</p>
            <p className="text-xs text-muted-foreground">Clinical Psychologist</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">SM</AvatarFallback>
          </Avatar>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
