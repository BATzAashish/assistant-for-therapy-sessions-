import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  initials: string;
  lastSession: string;
  nextSession: string;
  status: "scheduled" | "in-session" | "completed";
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Emma Thompson",
    initials: "ET",
    lastSession: "2 days ago",
    nextSession: "Today, 2:00 PM",
    status: "scheduled",
  },
  {
    id: "2",
    name: "James Wilson",
    initials: "JW",
    lastSession: "1 week ago",
    nextSession: "Tomorrow, 10:00 AM",
    status: "completed",
  },
  {
    id: "3",
    name: "Sofia Rodriguez",
    initials: "SR",
    lastSession: "3 days ago",
    nextSession: "Today, 4:00 PM",
    status: "scheduled",
  },
  {
    id: "4",
    name: "Michael Chen",
    initials: "MC",
    lastSession: "Yesterday",
    nextSession: "Friday, 1:00 PM",
    status: "completed",
  },
];

interface ClientSidebarProps {
  activeClient: string | null;
  onClientSelect: (clientId: string) => void;
}

const ClientSidebar = ({ activeClient, onClientSelect }: ClientSidebarProps) => {
  return (
    <aside className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">Clients</h2>
        <p className="text-sm text-muted-foreground">Manage your sessions</p>
      </div>

      <div className="space-y-3">
        {mockClients.map((client) => (
          <Card
            key={client.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              activeClient === client.id && "ring-2 ring-primary"
            )}
            onClick={() => onClientSelect(client.id)}
          >
            <div className="flex items-start space-x-3">
              <Avatar>
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {client.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground truncate">
                    {client.name}
                  </h3>
                  <Badge
                    variant={client.status === "scheduled" ? "default" : "secondary"}
                    className="ml-2 text-xs"
                  >
                    {client.status === "scheduled" ? "Upcoming" : "Done"}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Last: {client.lastSession}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Next: {client.nextSession}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </aside>
  );
};

export default ClientSidebar;
