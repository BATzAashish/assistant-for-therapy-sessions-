import { Brain } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const DashboardPreview = () => {
  // Video configuration - change this to use YouTube, local video, or fallback image
  const videoConfig = {
    type: 'local', // Options: 'local', 'youtube', 'image'
    localSrc: '/demo-video.mp4', // Path to local video in public folder
    youtubeSrc: 'https://www.youtube.com/embed/YOUR_VIDEO_ID', // YouTube embed URL
    posterImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop',
  };

  return (
    <section id="dashboard-preview" className="relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">See TherapyHub in Action</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground px-4">
              Watch how our platform streamlines{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                therapy sessions
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-4 px-6">
              AI-powered insights, real-time transcription, and automated clinical documentation
            </p>
          </div>
        }
      >
        {/* Video Container with Scrolling Effect */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-4 rounded-2xl shadow-2xl">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border-4 border-slate-700/50">
            {/* Local Video */}
            {videoConfig.type === 'local' && (
              <video 
                className="w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
                poster={videoConfig.posterImage}
                controls
              >
                <source src={videoConfig.localSrc} type="video/mp4" />
                {/* Fallback image */}
                <img 
                  src={videoConfig.posterImage} 
                  alt="TherapyHub Dashboard Demo"
                  className="w-full h-full object-cover"
                />
              </video>
            )}

            {/* YouTube Embed */}
            {videoConfig.type === 'youtube' && (
              <iframe
                className="w-full h-full"
                src={videoConfig.youtubeSrc}
                title="TherapyHub Dashboard Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Static Image Fallback */}
            {videoConfig.type === 'image' && (
              <img 
                src={videoConfig.posterImage} 
                alt="TherapyHub Dashboard Preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
};

export default DashboardPreview;
