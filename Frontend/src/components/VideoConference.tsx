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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmotionMonitor from "@/components/dashboard/EmotionMonitor";

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
  
  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // State
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isExpandedLayout, setIsExpandedLayout] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  
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
  
  // Ensure local stream stays attached to video element even when layout changes
  useEffect(() => {
    const localVideo = localVideoRef.current;
    const localStream = localStreamRef.current;
    
    if (localVideo && localStream && localVideo.srcObject !== localStream) {
      console.log('[VideoConference] Re-attaching local stream to video element');
      localVideo.srcObject = localStream;
      localVideo.play().catch(e => console.error('Error playing video:', e));
    }
  }, [isExpandedLayout]); // Re-attach when layout changes
  
  // Ensure remote stream stays attached to video element even when layout changes
  useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    
    if (remoteVideo && remoteVideo.srcObject) {
      console.log('[VideoConference] Remote video has stream');
    }
  }, [isExpandedLayout]);
  
  const initializeConnection = async () => {
    try {
      // Connect to Socket.IO - use polling only to match backend configuration
      const socket = io("http://localhost:5000", {
        transports: ["polling"],
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
      // Request with more permissive constraints and timeout
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      // Add timeout to prevent hanging
      const mediaPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Media request timeout')), 10000)
      );

      const stream = await Promise.race([mediaPromise, timeoutPromise]) as MediaStream;
      
      console.log('[VideoConference] Got media stream:', stream.getTracks().map(t => t.kind));
      
      localStreamRef.current = stream;
      
      const localVideo = localVideoRef.current;
      if (localVideo) {
        console.log('[VideoConference] Attaching stream to video element');
        localVideo.srcObject = stream;
        
        // Ensure video plays
        try {
          await localVideo.play();
          console.log('[VideoConference] ✓ Video playing successfully');
        } catch (playError) {
          console.error('[VideoConference] Error playing video:', playError);
          // Try to play without await
          localVideo.play().catch(e => console.error('Play failed:', e));
        }
      } else {
        console.error('[VideoConference] ✗ Local video ref is null!');
      }
      
      // Start emotion detection (therapist analyzes client's video)
      // Note: Emotion detection of remote video happens after peer connection is established
      
      // Start speech recognition for transcription
      startSpeechRecognition();
      
      toast({
        title: "Camera & Microphone",
        description: "Successfully connected",
      });
      
    } catch (error: any) {
      console.error("Error accessing media:", error);
      
      // Try audio-only fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setIsVideoOn(false);
        
        // Start speech recognition even without video
        startSpeechRecognition();
        
        toast({
          title: "Audio Only Mode",
          description: "Camera unavailable, microphone connected",
          variant: "default",
        });
      } catch (audioError) {
        toast({
          title: "Media Access Error",
          description: "Could not access camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
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
        
        // Start emotion detection when remote video is available (therapist only)
        if (userType === "therapist") {
          remoteVideo.onloadeddata = () => {
            console.log('[VideoConference] Remote video ready, starting emotion detection');
            startEmotionDetection();
          };
        }
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
    console.log('[VideoConference] ✓ Starting emotion detection interval');
    emotionIntervalRef.current = setInterval(() => {
      console.log('[VideoConference] Capturing frame for emotion analysis...');
      captureAndAnalyzeEmotion();
    }, 2000); // Analyze every 2 seconds
  };
  
  const captureAndAnalyzeEmotion = async () => {
    // Therapist analyzes client's video (remote video)
    const videoToAnalyze = userType === "therapist" ? remoteVideoRef.current : localVideoRef.current;
    const canvas = canvasRef.current;
    
    if (!videoToAnalyze || !canvas) {
      console.log('[VideoConference] Missing video element or canvas');
      return;
    }
    
    if (videoToAnalyze.readyState < 2) {
      console.log('[VideoConference] Video not ready yet (readyState:', videoToAnalyze.readyState, ')');
      return;
    }
    
    const context = canvas.getContext("2d");
    if (!context) {
      console.error('[VideoConference] Failed to get canvas context');
      return;
    }
    
    // Draw current video frame to canvas
    canvas.width = videoToAnalyze.videoWidth || 640;
    canvas.height = videoToAnalyze.videoHeight || 480;
    context.drawImage(videoToAnalyze, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    
    // Send frame to backend emotion detection API
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('[VideoConference] No auth token for emotion detection');
        return;
      }

      console.log('[VideoConference] Sending frame to API for session:', sessionId);
      const response = await fetch(`http://localhost:5000/api/emotion/session/${sessionId}/analyze-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          frame: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          timestamp: Date.now() / 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[VideoConference] ✓ Emotion detected:', data.emotion?.dominant_emotion, 'confidence:', data.emotion?.confidence);
        
        // Update local emotion state if needed
        if (data.emotion) {
          setCurrentEmotion({
            timestamp: new Date().toISOString(),
            dominant_emotion: data.emotion.dominant_emotion,
            confidence: data.emotion.confidence,
            all_emotions: data.emotion.emotion_probabilities || {}
          });
        }
      } else {
        const error = await response.text();
        console.error('[VideoConference] Emotion API error:', response.status, error);
        console.error('[VideoConference] Emotion analysis failed:', response.status, error);
      }
    } catch (error) {
      console.error('[VideoConference] Error analyzing emotion:', error);
    }
  };
  
  const startSpeechRecognition = () => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Use English as primary language - Chrome will auto-detect Hindi/English mix
    // Setting to 'en-IN' (Indian English) helps browser understand Hinglish better
    recognition.lang = 'en-IN';
    
    console.log(`[Speech Recognition] Starting bilingual mode: en-IN (Auto-detects Hindi/English mix)`);
    
    recognition.onstart = () => {
      setIsTranscribing(true);
      console.log(`[Speech Recognition] Started successfully - Bilingual recognition active`);
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Log interim results for debugging
      if (interimTranscript) {
        console.log(`[Speech Recognition] Interim:`, interimTranscript);
      }
      
      // Send final transcript to backend
      if (finalTranscript) {
        console.log(`[Speech Recognition] Final:`, finalTranscript.trim());
        
        // Send to backend via socket (don't add to local state yet)
        // The backend will broadcast it back to all participants including us
        const socket = socketRef.current;
        if (socket) {
          console.log(`[Transcription] Sending as speaker: ${userType}`);
          socket.emit("transcription_chunk", {
            session_id: sessionId,
            text: finalTranscript.trim(),
            speaker: userType
          });
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error(`[Speech Recognition] Error (${recognition.lang}):`, event.error, event);
      
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        console.log("[Speech Recognition] No speech detected, restarting...");
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 1000);
      } else if (event.error === 'not-allowed') {
        console.error("[Speech Recognition] Microphone permission denied");
        setIsTranscribing(false);
      } else if (event.error === 'language-not-supported') {
        console.error(`[Speech Recognition] Language ${recognition.lang} not supported by browser`);
        toast({
          title: "Language Not Supported",
          description: "Your browser may not support bilingual speech recognition. Try using Google Chrome.",
          variant: "destructive",
        });
      }
    };
    
    recognition.onend = () => {
      // Auto-restart recognition
      if (isConnected && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart failed:", e);
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
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
      // Stop speech recognition first
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      // Prepare transcription data
      const transcriptionData = transcript.map(segment => ({
        start: Math.floor((new Date(segment.timestamp).getTime() - new Date(transcript[0]?.timestamp || segment.timestamp).getTime()) / 1000),
        text: segment.text,
        speaker: segment.speaker
      }));
      
      // End session and send transcription for auto-note generation
      const response = await fetch(
        `http://localhost:5000/api/sessions/${sessionId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            transcription_data: transcriptionData,
            language: 'en'  // Always generate AI summary in English
          })
        }
      );
      
      const data = await response.json();
      
      if (data.note_auto_generated) {
        toast({
          title: "Session Ended",
          description: `Session notes generated automatically (Note ID: ${data.note_id})`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Session Ended",
          description: "Video session has been terminated",
        });
      }
      
      if (onSessionEnd) {
        onSessionEnd(data);
      }
      
      cleanup();
      
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session properly",
        variant: "destructive",
      });
      cleanup();
    }
  };
  
  const cleanup = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition already stopped");
      }
      recognitionRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
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
      socket.emit("leave_session", { session_id: sessionId });
      socket.disconnect();
    }
    
    setIsConnected(false);
    setIsTranscribing(false);
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
          {isTranscribing && (
            <Badge className="bg-blue-500 text-white animate-pulse">
              <MessageSquare className="h-3 w-3 mr-1" />
              Transcribing
            </Badge>
          )}
          {userType === "therapist" && (
            <button
              onClick={() => setUseMockData(!useMockData)}
              className={`text-xs px-2 py-1 rounded ${
                useMockData 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {useMockData ? '🎭 Mock Data' : '📡 Live Data'}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpandedLayout(!isExpandedLayout)}
            className="text-white"
            title={isExpandedLayout ? "Compact View" : "Expanded View"}
          >
            {isExpandedLayout ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
            {isExpandedLayout ? "Compact" : "Expand"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showTranscript ? "Hide" : "Show"} Transcript
          </Button>
          
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
            title="End session and generate notes"
          >
            <PhoneOff />
          </Button>
        </div>
      </div>
      
      {/* Main Content - Conditional Layout */}
      {!isExpandedLayout ? (
        // Compact 3-Column Layout
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left Column - Therapist Video & Transcript */}
          <div className={showTranscript ? "w-80 flex flex-col gap-4" : "flex-1 flex flex-col gap-4"}>
            <Card className="relative bg-black overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded">
                <span className="text-white text-xs">Therapist ({userName})</span>
              </div>
            </Card>
            
            {/* Live Transcript */}
            {showTranscript && (
              <Card className="flex-1 p-4 bg-slate-800 text-white overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Live Transcript</h3>
                  </div>
                  {isTranscribing && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-400">Recording</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {transcript.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Transcript will appear here</p>
                    </div>
                  ) : (
                    transcript.map((segment, idx) => (
                      <div key={idx} className="text-xs border-l-2 border-slate-600 pl-2">
                        <div className="text-slate-400 text-xs flex items-center gap-1">
                          <span>{new Date(segment.timestamp).toLocaleTimeString()}</span>
                          <span className="capitalize font-semibold text-blue-400">
                            {segment.speaker === 'therapist' ? '🩺' : '👤'}
                          </span>
                        </div>
                        <div className="mt-1">{segment.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Center Column - Client Video */}
          <div className={showTranscript ? "flex-1" : "flex-1"}>
            <Card className="relative bg-black overflow-hidden h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg">
                <span className="text-white text-sm font-semibold">Client</span>
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
          
          {/* Right Column - Emotion Monitor & Features */}
          {showTranscript && userType === "therapist" && (
            <div className="w-96 overflow-y-auto">
              <EmotionMonitor sessionId={sessionId} isActive={isConnected} useMockData={useMockData} />
            </div>
          )}
        </div>
      ) : (
        // Expanded Layout - Features Above, Videos Below
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
          {/* Top Row - Emotion Features */}
          {userType === "therapist" && (
            <div className="h-48 overflow-x-auto overflow-y-hidden">
              <EmotionMonitor sessionId={sessionId} isActive={isConnected} layout="horizontal" useMockData={useMockData} />
            </div>
          )}
          
          {/* Bottom Row - Videos and Transcript */}
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* Videos Section - Left/Center */}
            <div className={showTranscript ? "flex-1 flex gap-4 min-h-0" : "flex-1 flex gap-4 min-h-0"}>
              {/* Therapist Video */}
              <div className="flex-1 min-h-0">
                <Card className="relative bg-black overflow-hidden h-full">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-semibold">Therapist ({userName})</span>
                  </div>
                </Card>
              </div>
              
              {/* Client Video */}
              <div className="flex-1 min-h-0">
                <Card className="relative bg-black overflow-hidden h-full">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-semibold">Client</span>
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
            </div>
            
            {/* Right - Transcript */}
            {showTranscript && (
              <div className="w-96">
                <Card className="h-full p-4 bg-slate-800 text-white overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">Live Transcript</h3>
                    </div>
                    {isTranscribing && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-400">Recording</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {transcript.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Transcript will appear here</p>
                      </div>
                    ) : (
                      transcript.map((segment, idx) => (
                        <div key={idx} className="text-sm border-l-2 border-slate-600 pl-3">
                          <div className="text-slate-400 text-xs flex items-center gap-2 mb-1">
                            <span>{new Date(segment.timestamp).toLocaleTimeString()}</span>
                            <span className="capitalize font-semibold text-blue-400">
                              {segment.speaker === 'therapist' ? '🩺 Therapist' : '👤 Client'}
                            </span>
                          </div>
                          <div>{segment.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConference;
