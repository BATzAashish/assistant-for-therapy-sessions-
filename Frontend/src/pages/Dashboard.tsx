import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import ClientSidebar from "@/components/dashboard/ClientSidebar";
import VideoPanel from "@/components/dashboard/VideoPanel";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import NotesPanel from "@/components/dashboard/NotesPanel";
import SessionControls from "@/components/dashboard/SessionControls";

const Dashboard = () => {
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        <ClientSidebar 
          activeClient={activeClient} 
          onClientSelect={setActiveClient}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <VideoPanel sessionActive={sessionActive} />
              <NotesPanel activeClient={activeClient} />
            </div>
            
            <AIInsightsPanel sessionActive={sessionActive} />
          </div>
          
          <SessionControls 
            sessionActive={sessionActive}
            onSessionToggle={() => setSessionActive(!sessionActive)}
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
