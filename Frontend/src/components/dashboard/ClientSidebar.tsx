import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientAPI } from "@/lib/api";

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface ClientSidebarProps {
  activeClient: string | null;
  onClientSelect: (clientId: string) => void;
}

const ClientSidebar = ({ activeClient, onClientSelect }: ClientSidebarProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientAPI.getAll();
        setClients(data.clients);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching clients:", err);
        setError(err.message || "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <aside className="w-80 border-r border-border bg-card p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-80 border-r border-border bg-card p-4">
        <div className="text-center text-destructive">
          <p className="font-semibold">Error loading clients</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </aside>
    );
  }
  return (
    <aside className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">Clients</h2>
        <p className="text-sm text-muted-foreground">
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No clients found</p>
          <p className="text-sm mt-2">Add your first client to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
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
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground truncate">
                      {client.name}
                    </h3>
                    <Badge
                      variant={client.status === "active" ? "default" : "secondary"}
                      className="ml-2 text-xs"
                    >
                      {client.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">{client.email}</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Added: {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </aside>
  );
};

export default ClientSidebar;
