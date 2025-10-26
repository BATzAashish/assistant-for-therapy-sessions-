import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Video, Brain, FileText, Users, ArrowRight, Twitter, Linkedin, Mail } from "lucide-react";
import AnimatedHero from "@/components/AnimatedHero";
import DashboardPreview from "@/components/DashboardPreview";
import WelcomeBookAnimation from "@/components/WelcomeBookAnimation";
import AnimatedSteps from "@/components/AnimatedSteps";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MarqueeTestimonials } from "@/components/ui/marquee-testimonials";
import { useState, useRef } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleAnimationComplete = () => {
    setShowWelcome(false);
    
    // Smooth scroll to hero section after a brief delay
    setTimeout(() => {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const features = [
    {
      icon: Video,
      title: "Live Video Sessions",
      description: "High-quality WebRTC video conferencing with clients. Secure, HIPAA-compliant, and reliable connections for every session."
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Real-time emotion detection, stress indicators, and intelligent prompts to guide your therapeutic conversations."
    },
    {
      icon: FileText,
      title: "Session Notes & Summaries",
      description: "Automatically generated session summaries, treatment notes, and follow-up recommendations after each session."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Comprehensive client profiles, session history, progress tracking, and upcoming appointment scheduling."
    }
  ];

  const testimonials = [
    {
      quote: "TherapyHub has transformed how I manage sessions. The AI insights help me identify patterns I might have missed.",
      author: "Dr. Sarah Mitchell",
      role: "Clinical Psychologist"
    },
    {
      quote: "The automated note-taking saves me hours every week. I can focus entirely on my clients during sessions.",
      author: "Michael Chen, LMFT",
      role: "Marriage & Family Therapist"
    },
    {
      quote: "Finally, a platform built specifically for therapists. The interface is intuitive and the features are exactly what we need.",
      author: "Dr. Emily Rodriguez",
      role: "Licensed Therapist"
    },
    {
      quote: "The real-time emotion detection gives me valuable insights during sessions. It's like having a co-therapist.",
      author: "Dr. James Thompson",
      role: "Clinical Social Worker"
    },
    {
      quote: "Client management and scheduling has never been easier. TherapyHub streamlines my entire practice workflow.",
      author: "Lisa Anderson, PsyD",
      role: "Child Psychologist"
    },
    {
      quote: "The HIPAA-compliant video conferencing is crystal clear and reliable. My clients love the seamless experience.",
      author: "Dr. Marcus Williams",
      role: "Trauma Specialist"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Book Animation */}
      {showWelcome && <WelcomeBookAnimation onAnimationComplete={handleAnimationComplete} />}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-semibold text-foreground">TherapyHub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
            <Button onClick={() => navigate("/login")}>Sign Up</Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div ref={heroRef}>
        <AnimatedHero />
      </div>

      {/* Dashboard Preview Section */}
      <DashboardPreview />

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Everything You Need for Modern Therapy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional tools designed specifically for mental health practitioners
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <AnimatedSteps />

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Trusted by Therapists Nationwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what mental health professionals are saying
            </p>
          </div>
          <MarqueeTestimonials testimonials={testimonials} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Join hundreds of therapists who are already using TherapyHub to provide better care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")} className="text-lg">
              Start Free Trial
              <ArrowRight className="ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/login")}>
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold text-foreground">TherapyHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional therapy session management with AI-powered insights.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 TherapyHub. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
