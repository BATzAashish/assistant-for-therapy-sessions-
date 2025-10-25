import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { LogIn, Users, Video, Brain, FileText } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Login",
    description: "Access your secure therapist dashboard",
    icon: LogIn,
  },
  {
    number: "2",
    title: "Select Client",
    description: "Choose from your client list",
    icon: Users,
  },
  {
    number: "3",
    title: "Start Session",
    description: "Launch video call with one click",
    icon: Video,
  },
  {
    number: "4",
    title: "Get Insights",
    description: "Receive real-time AI analysis",
    icon: Brain,
  },
  {
    number: "5",
    title: "Save Notes",
    description: "Auto-generated session summaries",
    icon: FileText,
  },
];

const AnimatedSteps = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Simple Workflow, Powerful Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From login to insights in just a few clicks
          </p>
        </div>

        {/* Desktop Dock View */}
        <div className="hidden md:flex justify-center">
          <Dock magnification={180} distance={250}>
            {steps.map((step, index) => (
              <DockItem
                key={index}
                className="aspect-square rounded-full bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all"
              >
                <DockLabel>
                  <div className="text-center">
                    <div className="font-bold text-base">{step.title}</div>
                    <div className="text-sm opacity-80 mt-1">{step.description}</div>
                  </div>
                </DockLabel>
                <DockIcon className="bg-gradient-to-br from-primary to-blue-600">
                  <div className="flex flex-col items-center justify-center h-full w-full text-white">
                    <step.icon className="w-12 h-12 mb-2" />
                    <span className="text-xl font-bold">{step.number}</span>
                  </div>
                </DockIcon>
              </DockItem>
            ))}
          </Dock>
        </div>

        {/* Mobile Grid View */}
        <div className="grid grid-cols-5 gap-4 md:hidden">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto shadow-lg">
                <div className="flex flex-col items-center text-white">
                  <step.icon className="w-5 h-5 mb-0.5" />
                  <span className="text-xs font-bold">{step.number}</span>
                </div>
              </div>
              <h3 className="text-xs font-semibold text-foreground">{step.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimatedSteps;
