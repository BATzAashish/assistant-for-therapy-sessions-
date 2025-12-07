import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EmotionData {
  timestamp: number;
  dominant_emotion: string;
  confidence: number;
  emotion_probabilities: {
    happy: number;
    sad: number;
    angry: number;
    fear: number;
    surprise: number;
    disgust: number;
    neutral: number;
  };
  micro_expressions: {
    [key: string]: {
      detected: boolean;
      intensity: number;
      confidence: number;
    };
  };
  composite_scores: {
    stress_score: number;
    anxiety_score: number;
    engagement_score: number;
    overall_confidence: number;
  };
  clinical_insights: {
    primary_state: string;
    stress_level: string;
    anxiety_indicators: string[];
    positive_indicators: string[];
  };
}

interface EmotionMonitorProps {
  sessionId: string;
  isActive: boolean;
  layout?: 'vertical' | 'horizontal';
  useMockData?: boolean;
}

const EmotionMonitor: React.FC<EmotionMonitorProps> = ({ sessionId, isActive, layout = 'vertical', useMockData = false }) => {
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [suggestedQuestion, setSuggestedQuestion] = useState<string | null>(null);
  const maxHistoryPoints = 60; // Show last 60 data points (about 8-9 seconds at 7 FPS)

  // Generate mock emotion data for preview
  const generateMockData = (): EmotionData => {
    const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const timestamp = Date.now();
    
    return {
      timestamp,
      dominant_emotion: randomEmotion,
      confidence: 0.7 + Math.random() * 0.25,
      emotion_probabilities: {
        happy: Math.random() * 0.3,
        sad: Math.random() * 0.3,
        angry: Math.random() * 0.2,
        fear: Math.random() * 0.2,
        surprise: Math.random() * 0.2,
        disgust: Math.random() * 0.15,
        neutral: Math.random() * 0.4
      },
      micro_expressions: {
        eyebrow_raise: { detected: Math.random() > 0.7, intensity: Math.random(), confidence: Math.random() },
        lip_press: { detected: Math.random() > 0.6, intensity: Math.random(), confidence: Math.random() },
        blink_rate: { detected: Math.random() > 0.5, intensity: Math.random(), confidence: Math.random() },
        eye_widening: { detected: Math.random() > 0.8, intensity: Math.random(), confidence: Math.random() },
        jaw_tension: { detected: Math.random() > 0.7, intensity: Math.random(), confidence: Math.random() },
        micro_smile: { detected: Math.random() > 0.6, intensity: Math.random(), confidence: Math.random() }
      },
      composite_scores: {
        stress_score: 0.3 + Math.random() * 0.5,
        anxiety_score: 0.2 + Math.random() * 0.5,
        engagement_score: 0.4 + Math.random() * 0.5,
        overall_confidence: 0.7 + Math.random() * 0.2
      },
      clinical_insights: {
        primary_state: randomEmotion === 'sad' ? 'withdrawn' : randomEmotion === 'angry' ? 'agitated' : 'calm',
        stress_level: Math.random() > 0.6 ? 'elevated' : Math.random() > 0.3 ? 'moderate' : 'low',
        anxiety_indicators: Math.random() > 0.5 ? ['rapid_speech', 'fidgeting'] : [],
        positive_indicators: Math.random() > 0.5 ? ['eye_contact', 'relaxed_posture'] : []
      }
    };
  };

  // Debug logging
  console.log('[EmotionMonitor] Component rendered:', { sessionId, isActive, hasHistory: emotionHistory.length });

  const emotionColors: { [key: string]: string } = {
    happy: '#10b981',
    sad: '#3b82f6',
    angry: '#ef4444',
    fear: '#a855f7',
    surprise: '#f59e0b',
    disgust: '#84cc16',
    neutral: '#6b7280',
    anxious: '#ec4899',
    stressed: '#dc2626'
  };

  const microExpressionIcons: { [key: string]: string } = {
    eyebrow_raise: '🤨',
    lip_press: '😬',
    blink_rate: '👁️',
    eye_widening: '😳',
    jaw_tension: '😤',
    micro_smile: '😊'
  };

  // Add new emotion data
  const addEmotionData = (data: EmotionData) => {
    setCurrentEmotion(data);
    setEmotionHistory(prev => {
      const updated = [...prev, data];
      return updated.slice(-maxHistoryPoints);
    });
  };

  // Emotion timeline chart data
  const emotionTimelineData = {
    labels: emotionHistory.map((_, idx) => `${idx}`),
    datasets: [
      {
        label: 'Stress',
        data: emotionHistory.map(d => d.composite_scores.stress_score * 100),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Anxiety',
        data: emotionHistory.map(d => d.composite_scores.anxiety_score * 100),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Engagement',
        data: emotionHistory.map(d => d.composite_scores.engagement_score * 100),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const emotionTimelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: { size: 10 }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#9ca3af',
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  // Current emotion probabilities bar chart
  const emotionProbabilitiesData = currentEmotion ? {
    labels: Object.keys(currentEmotion.emotion_probabilities),
    datasets: [
      {
        label: 'Probability',
        data: Object.values(currentEmotion.emotion_probabilities).map(v => v * 100),
        backgroundColor: Object.keys(currentEmotion.emotion_probabilities).map(
          emotion => emotionColors[emotion] || '#6b7280'
        ),
        borderRadius: 4
      }
    ]
  } : null;

  const emotionProbabilitiesOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          color: '#9ca3af',
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#fff',
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  // Mock data generation for preview
  useEffect(() => {
    if (!useMockData || !isActive) return;

    // Generate initial mock data
    const initialData = generateMockData();
    addEmotionData(initialData);

    // Continue generating mock data every 2 seconds
    const mockInterval = setInterval(() => {
      const mockData = generateMockData();
      addEmotionData(mockData);
    }, 2000);

    return () => clearInterval(mockInterval);
  }, [useMockData, isActive]);

  // Fetch emotion data from backend API
  useEffect(() => {
    if (!isActive || !sessionId || useMockData) return;

    let isMounted = true;

    // Start emotion tracking when component mounts
    const startTracking = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[EmotionMonitor] No auth token found in localStorage');
          return;
        }

        console.log('[EmotionMonitor] Starting emotion tracking with token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`http://localhost:5000/api/emotion/session/${sessionId}/start-emotion-tracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[EmotionMonitor] Failed to start emotion tracking:', response.status, errorText);
        } else {
          console.log('[EmotionMonitor] ✓ Emotion tracking started for session:', sessionId);
        }
      } catch (error) {
        console.error('[EmotionMonitor] Error starting emotion tracking:', error);
      }
    };

    startTracking();

    // Poll for emotion data every 2 seconds
    const interval = setInterval(async () => {
      if (!isMounted) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[EmotionMonitor] No auth token found for polling');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/emotion/session/${sessionId}/emotion-summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.current_emotion && Object.keys(data.current_emotion).length > 0) {
            const emotionData: EmotionData = {
              timestamp: data.current_emotion.timestamp || Date.now() / 1000,
              dominant_emotion: data.current_emotion.dominant_emotion || 'neutral',
              confidence: data.current_emotion.confidence || 0.5,
              emotion_probabilities: data.current_emotion.emotion_probabilities || {
                happy: 0.14,
                sad: 0.14,
                angry: 0.14,
                fear: 0.14,
                surprise: 0.14,
                disgust: 0.14,
                neutral: 0.16
              },
              micro_expressions: data.current_emotion.micro_expressions || {},
              composite_scores: data.current_emotion.composite_scores || {
                stress_score: 0.3,
                anxiety_score: 0.3,
                engagement_score: 0.7,
                overall_confidence: 0.75
              },
              clinical_insights: data.current_emotion.clinical_insights || {
                primary_state: 'Neutral baseline',
                stress_level: 'Low',
                anxiety_indicators: [],
                positive_indicators: ['Engaged', 'Calm']
              }
            };
            
            addEmotionData(emotionData);
            console.log('[EmotionMonitor] Received emotion data:', emotionData);
          }
        }
      } catch (error) {
        console.error('[EmotionMonitor] Error fetching emotion data:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Fetch AI-suggested question every 10 seconds
    const questionInterval = setInterval(async () => {
      if (!isMounted || !currentEmotion) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:5000/api/emotion/session/${sessionId}/suggested-question`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.question) {
            setSuggestedQuestion(data.question);
            console.log('[EmotionMonitor] AI suggested question:', data.question);
          }
        }
      } catch (error) {
        console.error('[EmotionMonitor] Error fetching suggested question:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(questionInterval);
      
      // Stop emotion tracking when component unmounts
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`http://localhost:5000/api/emotion/session/${sessionId}/stop-emotion-tracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(error => console.error('[EmotionMonitor] Error stopping emotion tracking:', error));
      }
    };
  }, [isActive, sessionId]);

  if (!isActive) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center text-gray-400">
          Emotion monitoring inactive
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={layout === 'horizontal' ? 'flex gap-4 h-full' : 'space-y-4'}>
      {/* Current Emotion Display */}
      <Card className={`bg-gray-900 border-gray-800 ${layout === 'horizontal' ? 'flex-1 flex flex-col min-w-0 overflow-hidden' : ''}`}>
        <CardHeader className={layout === 'horizontal' ? 'py-2 px-3' : ''}>
          <CardTitle className={`flex items-center justify-between ${layout === 'horizontal' ? 'text-sm' : 'text-lg'}`}>
            <span>Current Emotion</span>
            {currentEmotion ? (
              <Badge
                style={{ backgroundColor: emotionColors[currentEmotion.dominant_emotion] }}
                className={layout === 'horizontal' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
              >
                {currentEmotion.dominant_emotion.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="outline" className={layout === 'horizontal' ? 'text-xs px-2 py-0.5 text-gray-400' : 'text-sm px-3 py-1 text-gray-400'}>
                Waiting for client...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={layout === 'horizontal' ? 'flex-1 overflow-y-auto py-2 px-3' : ''}>
          {currentEmotion ? (
            <div className={layout === 'horizontal' ? 'space-y-2' : 'space-y-4'}>
              {/* Confidence */}
              <div>
                <div className={`flex justify-between ${layout === 'horizontal' ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-white">{(currentEmotion.confidence * 100).toFixed(0)}%</span>
                </div>
                <Progress value={currentEmotion.confidence * 100} className="h-1.5" />
              </div>

              {/* Stress Level */}
              <div>
                <div className={`flex justify-between ${layout === 'horizontal' ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                  <span className="text-gray-400">Stress</span>
                  <span className="text-red-400">
                    {(currentEmotion.composite_scores.stress_score * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={currentEmotion.composite_scores.stress_score * 100}
                  className="h-1.5"
                />
              </div>

              {/* Anxiety Level */}
              <div>
                <div className={`flex justify-between ${layout === 'horizontal' ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                  <span className="text-gray-400">Anxiety</span>
                  <span className="text-orange-400">
                    {(currentEmotion.composite_scores.anxiety_score * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={currentEmotion.composite_scores.anxiety_score * 100}
                  className="h-1.5"
                />
              </div>

              {/* Engagement Level */}
              <div>
                <div className={`flex justify-between ${layout === 'horizontal' ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                  <span className="text-slate-400">Engagement</span>
                  <span className="font-medium text-green-500">
                    {Math.round(currentEmotion.composite_scores.engagement_score * 100)}%
                  </span>
                </div>
                <Progress
                  value={currentEmotion.composite_scores.engagement_score * 100}
                  className="h-1.5"
                />
              </div>

              {/* Micro-expressions */}
              <div>
                <div className={layout === 'horizontal' ? 'text-xs text-gray-400 mb-1' : 'text-sm text-gray-400 mb-2'}>Micro-expressions</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(currentEmotion.micro_expressions).map(([key, value]) => {
                    if (value.detected) {
                      return (
                        <Badge key={key} variant="secondary" className={layout === 'horizontal' ? 'text-[10px] px-1.5 py-0' : 'text-xs'}>
                          {microExpressionIcons[key] || '•'} {layout === 'horizontal' ? key.split('_')[0] : key.replace('_', ' ')}
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">👤</div>
              <p className="text-sm">Waiting for client to join...</p>
              <p className="text-xs text-gray-500 mt-1">Emotion data will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Timeline */}
      <Card className={`bg-gray-900 border-gray-800 ${layout === 'horizontal' ? 'flex-1 flex flex-col min-w-0 overflow-hidden' : ''}`}>
        <CardHeader className={layout === 'horizontal' ? 'py-2 px-3' : ''}>
          <CardTitle className={`flex items-center justify-between ${layout === 'horizontal' ? 'text-sm' : 'text-lg'}`}>
            <span>Timeline</span>
            {emotionHistory.length === 0 && (
              <span className="text-[10px] text-gray-500">Ready</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={layout === 'horizontal' ? 'flex-1 flex flex-col min-h-0 py-2 px-3' : ''}>
          <div className={layout === 'horizontal' ? 'flex-1 min-h-0' : 'h-48'}>
            {emotionHistory.length > 0 ? (
              <Line data={emotionTimelineData} options={emotionTimelineOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm">Emotion timeline will appear here</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emotion Probabilities */}
      <Card className={`bg-gray-900 border-gray-800 ${layout === 'horizontal' ? 'flex-1 flex flex-col min-w-0 overflow-hidden' : ''}`}>
        <CardHeader className={layout === 'horizontal' ? 'py-2 px-3' : ''}>
          <CardTitle className={`flex items-center justify-between ${layout === 'horizontal' ? 'text-sm' : 'text-lg'}`}>
            <span>Breakdown</span>
            {!currentEmotion && (
              <span className="text-[10px] text-gray-500">Ready</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={layout === 'horizontal' ? 'flex-1 flex flex-col min-h-0 py-2 px-3' : ''}>
          <div className={layout === 'horizontal' ? 'flex-1 min-h-0' : 'h-56'}>
            {emotionProbabilitiesData ? (
              <Bar data={emotionProbabilitiesData} options={emotionProbabilitiesOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <p className="text-sm">Emotion breakdown will appear here</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Insights */}
      {currentEmotion && (
        <Card className={`bg-gray-900 border-gray-800 ${layout === 'horizontal' ? 'flex-1 flex flex-col min-w-0 overflow-auto' : ''}`}>
          <CardHeader className={layout === 'horizontal' ? 'py-2 px-3' : ''}>
            <CardTitle className={layout === 'horizontal' ? 'text-sm' : 'text-lg'}>Insights</CardTitle>
          </CardHeader>
          <CardContent className={layout === 'horizontal' ? 'space-y-2 py-2 px-3' : 'space-y-3'}>
            <div>
              <span className={`text-gray-400 ${layout === 'horizontal' ? 'text-xs' : 'text-sm'}`}>State: </span>
              <span className={`text-white ${layout === 'horizontal' ? 'text-xs' : 'text-sm'}`}>{currentEmotion.clinical_insights.primary_state}</span>
            </div>
            <div>
              <span className={`text-gray-400 ${layout === 'horizontal' ? 'text-xs' : 'text-sm'}`}>Stress: </span>
              <Badge variant={
                currentEmotion.clinical_insights.stress_level === 'elevated' ? 'destructive' :
                currentEmotion.clinical_insights.stress_level === 'moderate' ? 'default' : 'secondary'
              }>
                {currentEmotion.clinical_insights.stress_level}
              </Badge>
            </div>
            {currentEmotion.clinical_insights.anxiety_indicators.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Anxiety Indicators:</div>
                <div className="flex flex-wrap gap-1">
                  {currentEmotion.clinical_insights.anxiety_indicators.map((indicator, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      ⚠️ {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {currentEmotion.clinical_insights.positive_indicators.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Positive Indicators:</div>
                <div className="flex flex-wrap gap-1">
                  {currentEmotion.clinical_insights.positive_indicators.map((indicator, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs text-green-400">
                      ✓ {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Question Assistant - Show placeholder or real suggestions */}
      {isActive && (
        <Card className={`bg-gradient-to-br from-purple-900/50 to-indigo-900/50 text-white border-purple-500/30 ${layout === 'horizontal' ? 'flex-[2] flex flex-col min-w-0 overflow-auto' : ''}`}>
          <CardHeader className={layout === 'horizontal' ? 'py-2 px-3' : 'pb-3'}>
            <CardTitle className={`flex items-center gap-2 ${layout === 'horizontal' ? 'text-sm' : 'text-base'}`}>
              <span className={layout === 'horizontal' ? 'text-sm' : 'text-lg'}>💡</span>
              AI Questions
              <Badge className={`ml-auto bg-purple-500/30 text-purple-200 ${layout === 'horizontal' ? 'text-[9px] px-1.5 py-0' : 'text-xs'}`}>
                {suggestedQuestion ? 'AI' : 'Rule'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className={layout === 'horizontal' ? 'space-y-2 text-xs py-2 px-3' : 'space-y-3 text-sm'}>
            {currentEmotion ? (
              <>
                <div className={`bg-black/20 rounded-lg border border-purple-500/20 ${layout === 'horizontal' ? 'p-2' : 'p-3'}`}>
                  <div className={`text-purple-300 mb-1 flex items-center gap-1 ${layout === 'horizontal' ? 'text-[10px]' : 'text-xs'}`}>
                    <span>💬</span>
                    <span>Question:</span>
                  </div>
                  <div className={`text-white ${layout === 'horizontal' ? 'leading-tight text-xs' : 'leading-relaxed'}`}>
                    {suggestedQuestion || (
                      currentEmotion.composite_scores.stress_score > 0.6 
                        ? "I notice you seem a bit tense. Can you tell me more about what's making this situation difficult for you?"
                        : currentEmotion.composite_scores.anxiety_score > 0.5
                        ? "You mentioned feeling anxious. What thoughts are going through your mind right now?"
                        : currentEmotion.dominant_emotion === 'sad'
                        ? "I can see this is affecting you. Would you like to talk about what's been weighing on you?"
                        : currentEmotion.dominant_emotion === 'angry'
                        ? "It seems like you're frustrated. What specifically triggered these feelings?"
                        : currentEmotion.composite_scores.engagement_score < 0.3
                        ? "I notice you've become quieter. Is there something specific you'd rather not discuss?"
                        : "How does that make you feel? Can you describe the emotions you're experiencing?"
                    )}
                  </div>
                </div>
                
                <div className={`text-purple-300 space-y-0.5 bg-black/10 rounded ${layout === 'horizontal' ? 'text-[9px] p-1.5' : 'text-xs p-2'}`}>
              <div className="flex items-center gap-1">
                <span>💭</span>
                <span>{currentEmotion.dominant_emotion}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📊</span>
                <span>S:{Math.round(currentEmotion.composite_scores.stress_score * 100)}%</span>
                <span>A:{Math.round(currentEmotion.composite_scores.anxiety_score * 100)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>{currentEmotion.clinical_insights.primary_state}</span>
              </div>
            </div>
          </>
            ) : (
              <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20 text-center">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-purple-200">AI Question Assistant Ready</p>
                <p className="text-xs text-purple-400 mt-2">
                  Questions will be suggested based on client emotions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmotionMonitor;
