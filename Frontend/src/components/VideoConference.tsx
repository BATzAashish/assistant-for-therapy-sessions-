import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Activity,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoConferenceProps {
  sessionId: string;
  userType: "therapist" | "client";
  userName: string;
  onSessionEnd?: (sessionData: any) => void;
}

interface EmotionData {
  timestamp: string;
  dominant_emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
}

interface TranscriptSegment {
  timestamp: string;
  speaker: string;
  text: string;
}

const VideoConference = ({
  sessionId,
  userType,
  userName,
  onSessionEnd,
}: VideoConferenceProps) => {
  const { toast } = useToast();
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const remoteSidRef = useRef<string | null>(null);
  
  // Canvas for emotion detection
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  
  // WebRTC Configuration
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };
  
  useEffect(() => {
    initializeConnection();
    
    return () => {
      cleanup();
    };
  }, []);
  
  const initializeConnection = async () => {
    try {
      // Connect to Socket.IO
      const socket = io("http://localhost:5000", {
        transports: ["websocket"],
        auth: {
          token: localStorage.getItem("token"),
        },
      });
      
      socketRef.current = socket;
      
      // Socket event handlers
      socket.on("connected", (data) => {
        console.log("Connected to signaling server:", data.sid);
      });
      
      socket.on("user_joined", (data) => {
        console.log("User joined:", data);
        setParticipantCount(data.participant_count);
        toast({
          title: "User Joined",
          description: `${data.user_name} (${data.user_type}) has joined`,
        });
        
        // Store remote SID and create offer if we're the therapist
        if (userType === "therapist") {
          remoteSidRef.current = data.sid;
          createOffer(data.sid);
        }
      });
      
      socket.on("user_left", (data) => {
        console.log("User left:", data);
        setParticipantCount(data.participant_count);
        toast({
          title: "User Left",
          description: "Participant has left the session",
        });
      });
      
      socket.on("webrtc_offer", async (data) => {
        console.log("Received WebRTC offer");
        remoteSidRef.current = data.from_sid;
        await handleOffer(data.offer, data.from_sid);
      });
      
      socket.on("webrtc_answer", async (data) => {
        console.log("Received WebRTC answer");
        await handleAnswer(data.answer);
      });
      
      socket.on("webrtc_ice_candidate", async (data) => {
        console.log("Received ICE candidate");
        await handleIceCandidate(data.candidate);
      });
      
      socket.on("emotion_update", (data) => {
        if (userType === "therapist") {
          setCurrentEmotion(data.emotion_data);
          setEmotionHistory((prev) => [...prev, data.emotion_data]);
        }
      });
      
      socket.on("transcription_update", (data) => {
        setTranscript((prev) => [...prev, data]);
      });
      
      // Get local media
      await getLocalMedia();
      
      // Join session
      socket.emit("join_session", {
        session_id: sessionId,
        user_type: userType,
        user_name: userName,
      });
      
      setIsConnected(true);
      
    } catch (error: any) {
      console.error("Error initializing connection:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect",
        variant: "destructive",
      });
    }
  };
  
  const getLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      
      localStreamRef.current = stream;
      
      const localVideo = localVideoRef.current;
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      
      // Start emotion detection (client side)
      if (userType === "client") {
        startEmotionDetection();
      }
      
      toast({
        title: "Camera & Microphone",
        description: "Successfully connected",
      });
      
    } catch (error: any) {
      console.error("Error accessing media:", error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
    }
  };
  
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);
    
    // Add local stream tracks
    const localStream = localStreamRef.current;
    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Handle remote stream
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log("Received remote track");
      const remoteVideo = remoteVideoRef.current;
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      const socket = socketRef.current;
      const remoteSid = remoteSidRef.current;
      if (event.candidate && socket && remoteSid) {
        socket.emit("webrtc_ice_candidate", {
          target_sid: remoteSid,
          candidate: event.candidate,
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };
    
    peerConnectionRef.current = pc;
    return pc;
  };
  
  const createOffer = async (targetSid: string) => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const socket = socketRef.current;
      if (socket) {
        socket.emit("webrtc_offer", {
          target_sid: targetSid,
          offer: offer,
        });
      }
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromSid: string) => {
    try {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      const socket = socketRef.current;
      if (socket) {
        socket.emit("webrtc_answer", {
          target_sid: fromSid,
          answer: answer,
        });
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };
  
  const startEmotionDetection = () => {
    emotionIntervalRef.current = setInterval(() => {
      captureAndAnalyzeEmotion();
    }, 2000); // Analyze every 2 seconds
  };
  
  const captureAndAnalyzeEmotion = () => {
    const localVideo = localVideoRef.current;
    const canvas = canvasRef.current;
    
    if (!localVideo || !canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Draw current video frame to canvas
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    context.drawImage(localVideo, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    
    // Send to backend for analysis (would need backend endpoint)
    // For now, simulate with random emotions
    const emotions = ["happy", "sad", "angry", "neutral", "surprised", "fearful"];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const emotionData: EmotionData = {
      timestamp: new Date().toISOString(),
      dominant_emotion: randomEmotion,
      confidence: Math.random() * 0.3 + 0.7,
      all_emotions: {
        happy: Math.random(),
        sad: Math.random(),
        angry: Math.random(),
        neutral: Math.random(),
        surprised: Math.random(),
        fearful: Math.random(),
      },
    };
    
    // Send emotion data through socket
    const socket = socketRef.current;
    if (socket) {
      socket.emit("emotion_data", {
        session_id: sessionId,
        emotion_data: emotionData,
      });
    }
  };
  
  const toggleVideo = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };
  
  const toggleAudio = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };
  
  const endSession = async () => {
    try {
      // Get session data
      const response = await fetch(
        `http://localhost:5000/api/webrtc/session/${sessionId}/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (onSessionEnd) {
        onSessionEnd(data.session_data);
      }
      
      cleanup();
      
      toast({
        title: "Session Ended",
        description: "Video session has been terminated",
      });
      
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };
  
  const cleanup = () => {
    // Stop emotion detection
    const emotionInterval = emotionIntervalRef.current;
    if (emotionInterval) {
      clearInterval(emotionInterval);
    }
    
    // Stop local media
    const localStream = localStreamRef.current;
    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    
    // Close peer connection
    const peerConnection = peerConnectionRef.current;
    if (peerConnection) {
      peerConnection.close();
    }
    
    // Disconnect socket
    const socket = socketRef.current;
    if (socket) {
      socket.disconnect();
    }
    
    setIsConnected(false);
  };
  
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-green-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      neutral: "bg-gray-500",
      surprised: "bg-yellow-500",
      fearful: "bg-purple-500",
    };
    return colors[emotion] || "bg-gray-500";
  };
  
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="text-white">{participantCount} Participant(s)</span>
          </div>
          {isConnected && (
            <Badge className="bg-green-500 text-white">Connected</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideo}
            className={isVideoOn ? "text-white" : "text-red-500"}
          >
            {isVideoOn ? <Video /> : <VideoOff />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className={isAudioOn ? "text-white" : "text-red-500"}
          >
            {isAudioOn ? <Mic /> : <MicOff />}
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={endSession}
          >
            <PhoneOff />
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Video Area */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Remote Video */}
          <Card className="relative bg-black overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
              <span className="text-white text-sm">Remote Participant</span>
            </div>
          </Card>
          
          {/* Local Video */}
          <Card className="relative bg-black overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
              <span className="text-white text-sm">You ({userType})</span>
            </div>
            
            {/* Emotion Indicator */}
            {currentEmotion && userType === "therapist" && (
              <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-white" />
                  <span className="text-white text-sm">
                    Emotion: {currentEmotion.dominant_emotion}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${getEmotionColor(
                      currentEmotion.dominant_emotion
                    )}`}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Sidebar */}
        {userType === "therapist" && (
          <div className="w-96 flex flex-col gap-4">
            {/* Emotion Timeline */}
            <Card className="p-4 bg-slate-800 text-white flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5" />
                <h3 className="font-semibold">Emotion Timeline</h3>
              </div>
              
              <div className="space-y-2">
                {emotionHistory.slice(-10).reverse().map((emotion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{new Date(emotion.timestamp).toLocaleTimeString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{emotion.dominant_emotion}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${getEmotionColor(
                          emotion.dominant_emotion
                        )}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Live Transcript */}
            <Card className="p-4 bg-slate-800 text-white flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Live Transcript</h3>
              </div>
              
              <div className="space-y-3">
                {transcript.slice(-10).reverse().map((segment, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="text-slate-400 text-xs">
                      {new Date(segment.timestamp).toLocaleTimeString()} - {segment.speaker}
                    </div>
                    <div>{segment.text}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConference;
