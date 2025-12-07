"""
AI Question Assistant Service
Generates contextual therapeutic questions based on:
- Current emotion state
- Recent transcript
- Previous session notes (RAG)
"""
import os
from groq import Groq

class QuestionAssistant:
    def __init__(self):
        self.groq_key = os.getenv('GROQ_API_KEY')
        self.client = None
        if self.groq_key:
            try:
                self.client = Groq(api_key=self.groq_key)
                print("[QUESTION-ASSISTANT] ✓ Initialized with Groq")
            except Exception as e:
                print(f"[QUESTION-ASSISTANT] Failed to initialize: {e}")
    
    def is_available(self):
        return self.client is not None
    
    def generate_question(self, emotion_data, recent_transcript, previous_notes=None):
        """
        Generate a therapeutic question based on current context
        
        Args:
            emotion_data: Current emotion analysis (dict with dominant_emotion, stress_score, etc.)
            recent_transcript: Last few lines of conversation
            previous_notes: Summary of previous sessions (optional)
        
        Returns:
            Dict with suggested question and reasoning
        """
        if not self.is_available():
            return self._fallback_question(emotion_data)
        
        try:
            # Build context
            dominant_emotion = emotion_data.get('dominant_emotion', 'neutral')
            stress_score = emotion_data.get('composite_scores', {}).get('stress_score', 0)
            anxiety_score = emotion_data.get('composite_scores', {}).get('anxiety_score', 0)
            primary_state = emotion_data.get('clinical_insights', {}).get('primary_state', 'calm')
            
            context = f"""You are an AI assistant helping a therapist during a live therapy session.

CURRENT EMOTION STATE:
- Dominant emotion: {dominant_emotion}
- Stress level: {int(stress_score * 100)}%
- Anxiety level: {int(anxiety_score * 100)}%
- Primary state: {primary_state}

RECENT CONVERSATION:
{recent_transcript}
"""
            
            if previous_notes:
                context += f"\n\nPREVIOUS SESSION CONTEXT:\n{previous_notes[:500]}"
            
            prompt = """Based on the client's current emotional state and recent conversation, suggest ONE thoughtful, open-ended therapeutic question that the therapist could ask.

GUIDELINES:
- Be empathetic and non-judgmental
- Ask open-ended questions (avoid yes/no)
- Focus on feelings and underlying thoughts
- Use reflective listening techniques
- Keep it concise (1-2 sentences max)

QUESTION:"""
            
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            question = response.choices[0].message.content.strip()
            
            return {
                'success': True,
                'question': question,
                'trigger': f"{dominant_emotion} emotion, {int(stress_score * 100)}% stress",
                'confidence': 0.85
            }
            
        except Exception as e:
            print(f"[QUESTION-ASSISTANT] Error: {e}")
            return self._fallback_question(emotion_data)
    
    def _fallback_question(self, emotion_data):
        """Rule-based fallback questions when AI is unavailable"""
        dominant_emotion = emotion_data.get('dominant_emotion', 'neutral')
        stress_score = emotion_data.get('composite_scores', {}).get('stress_score', 0)
        anxiety_score = emotion_data.get('composite_scores', {}).get('anxiety_score', 0)
        
        # Rule-based question selection
        if stress_score > 0.7:
            question = "I notice you seem quite tense right now. Can you tell me more about what's making this situation difficult for you?"
        elif anxiety_score > 0.6:
            question = "You seem anxious. What thoughts are going through your mind at this moment?"
        elif dominant_emotion == 'sad':
            question = "I can see this is affecting you deeply. Would you like to talk about what's been weighing on you?"
        elif dominant_emotion == 'angry':
            question = "It seems like you're feeling frustrated. What specifically triggered these feelings?"
        elif dominant_emotion == 'fear':
            question = "What is it about this situation that feels frightening or overwhelming to you?"
        elif emotion_data.get('composite_scores', {}).get('engagement_score', 0.5) < 0.3:
            question = "I notice you've become quieter. Is there something specific you'd rather not discuss, or would it help to take a different approach?"
        else:
            question = "How does that make you feel? Can you describe the emotions you're experiencing right now?"
        
        return {
            'success': True,
            'question': question,
            'trigger': f"{dominant_emotion} emotion",
            'confidence': 0.6,
            'method': 'rule-based'
        }
