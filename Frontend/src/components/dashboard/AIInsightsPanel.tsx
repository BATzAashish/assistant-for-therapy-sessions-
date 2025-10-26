import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Lightbulb, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { aiAPI } from "@/lib/api";

interface AIInsightsPanelProps {
  sessionActive: boolean;
}

const AIInsightsPanel = ({ sessionActive }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionActive) {
      const fetchInsights = async () => {
        setLoading(true);
        try {
          const data = await aiAPI.mockAnalysis("current session data");
          setInsights(data.insights);
          setError(null);
        } catch (err: any) {
          console.error("Error fetching insights:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      // Fetch insights immediately
      fetchInsights();

      // Fetch insights every 30 seconds during active session
      const interval = setInterval(fetchInsights, 30000);
      return () => clearInterval(interval);
    } else {
      setInsights(null);
    }
  }, [sessionActive]);

  const insightsArray = insights
    ? [
        {
          type: "emotion",
          label: insights.emotion?.label || "Emotional State",
          value: insights.emotion?.value || "Unknown",
          confidence: insights.emotion?.confidence || 0,
          color: insights.emotion?.color || "text-success",
        },
        {
          type: "stress",
          label: insights.stress?.label || "Stress Level",
          value: insights.stress?.value || "Unknown",
          confidence: insights.stress?.confidence || 0,
          color: insights.stress?.color || "text-primary",
        },
        {
          type: "engagement",
          label: insights.engagement?.label || "Engagement",
          value: insights.engagement?.value || "Unknown",
          confidence: insights.engagement?.confidence || 0,
          color: insights.engagement?.color || "text-accent",
        },
      ]
    : [];

  const suggestions = [
    "Consider exploring recent work-related stressors",
    "Client showing openness to discussing coping strategies",
    "Good moment to introduce mindfulness techniques",
  ];

  return (
    <Card className="w-96 p-4 bg-accent/5 border-accent/20 flex flex-col overflow-hidden">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
        {sessionActive && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Live
          </Badge>
        )}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Emotion Detection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">
              Real-time Analysis
            </h3>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
            )}
          </div>

          {sessionActive ? (
            error ? (
              <div className="p-6 bg-destructive/10 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : insights ? (
              <div className="space-y-3">
                {insightsArray.map((insight) => (
                  <div
                    key={insight.type}
                    className="p-3 bg-card rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {insight.label}
                      </span>
                      <span className={`text-sm font-semibold ${insight.color}`}>
                        {insight.value}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{insight.confidence}%</span>
                      </div>
                      <Progress value={insight.confidence} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-muted rounded-lg text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading insights...
                </p>
              </div>
            )
          ) : (
            <div className="p-6 bg-muted rounded-lg text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Start a session to see live insights
              </p>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {sessionActive && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Suggested Prompts
              </h3>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-accent/10 rounded-lg border border-accent/20 text-sm text-foreground hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mood Trends */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Session Trends</h3>
          <div className="p-3 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-success font-medium">+12%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AIInsightsPanel;
