"""
Summary Service
Handles automatic summarization of therapy session transcripts
Supports both Google Gemini and OpenAI APIs
"""
import os
from typing import Dict, Optional

class SummaryService:
    """Service for generating summaries from transcripts"""
    
    def __init__(self):
        """Initialize summary service with available AI provider"""
        self.provider = os.environ.get('AI_PROVIDER', 'gemini').lower()
        self.gemini_key = os.environ.get('GEMINI_API_KEY')
        self.openai_key = os.environ.get('OPENAI_API_KEY')
        self.client = None
        
        # Initialize based on provider preference
        if self.provider == 'gemini' and self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                # Use Gemini 2.0 Flash - fast and efficient
                self.client = genai.GenerativeModel('gemini-2.0-flash')
                self.provider = 'gemini'
            except ImportError:
                print("Warning: google-generativeai not installed. Install with: pip install google-generativeai")
                self.client = None
        elif self.provider == 'openai' and self.openai_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.openai_key)
                self.provider = 'openai'
            except ImportError:
                print("Warning: openai not installed. Install with: pip install openai")
                self.client = None
        else:
            # Try fallback
            if self.gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=self.gemini_key)
                    self.client = genai.GenerativeModel('gemini-2.0-flash')
                    self.provider = 'gemini'
                except:
                    pass
            elif self.openai_key:
                try:
                    from openai import OpenAI
                    self.client = OpenAI(api_key=self.openai_key)
                    self.provider = 'openai'
                except:
                    pass
    
    def is_available(self) -> bool:
        """Check if summary service is available"""
        return self.client is not None
    
    def get_client_context(self, db, client_id: str, limit: int = 3) -> tuple:
        """
        Fetch recent session notes for RAG context
        
        Args:
            db: Database connection
            client_id: Client's ID
            limit: Number of recent notes to fetch
            
        Returns:
            Tuple of (context_string, session_count)
            - context_string: Formatted context with past session summaries
            - session_count: Number of previous sessions found
        """
        try:
            from bson import ObjectId
            
            # Fetch recent notes for this client
            notes = list(db.notes.find({
                'client_id': ObjectId(client_id)
            }).sort('created_at', -1).limit(limit))
            
            session_count = len(notes)
            
            if session_count == 0:
                return "", 0
            
            context = "\n### PAST SESSION CONTEXT ###\n"
            context += f"This client has {session_count} previous session(s) recorded:\n\n"
            
            for i, note in enumerate(reversed(notes), 1):
                session_date = note.get('session_date', 'Unknown date')
                ai_summary = note.get('ai_summary', note.get('content', ''))
                
                # Extract key points from summary
                context += f"Previous Session {i} ({session_date}):\n"
                # Take first 400 chars of summary for better context
                summary_excerpt = ai_summary[:400] + "..." if len(ai_summary) > 400 else ai_summary
                context += f"{summary_excerpt}\n\n"
            
            context += "### END PAST SESSION CONTEXT ###\n\n"
            return context, session_count
            
        except Exception as e:
            print(f"Error fetching client context: {e}")
            return "", 0
    
    def generate_session_summary(
        self, 
        transcript: str, 
        session_type: str = "individual",
        client_name: Optional[str] = None,
        language: str = "en",
        client_id: Optional[str] = None,
        db = None
    ) -> Dict:
        """
        Generate a comprehensive summary of a therapy session with RAG context
        
        Args:
            transcript: Full transcript of the session
            session_type: Type of session (individual, group, etc.)
            client_name: Name of the client (optional, for personalization)
            language: Language for the summary ('en' or 'hi')
            client_id: Client's ID for fetching past context
            db: Database connection for RAG
            
        Returns:
            Dictionary with summary results
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Summary service not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.'
            }
        
        try:
            # Fetch client context for RAG
            client_context = ""
            session_count = 0
            if client_id is not None and db is not None:
                client_context, session_count = self.get_client_context(db, client_id, limit=3)
                if session_count > 0:
                    print(f"[RAG] Added context from {session_count} previous session(s)")
                else:
                    print(f"[RAG] First session for this client - establishing baseline")
            
            # Note: Transcripts may contain mixed Hindi/English (Hinglish)
            # Always generate summaries in English for consistency
            print(f"[SUMMARY] Generating summary in English (transcript may contain Hindi/English mix)")
            
            # Always use English prompts - AI will understand bilingual transcripts
            # Adjust based on session count
            if session_count == 0:
                # First session - establish baseline
                system_prompt = """You are an experienced clinical psychologist writing notes for an INITIAL session.
This is the FIRST session with this client - establish a comprehensive baseline assessment.

IMPORTANT: The transcript may contain mixed Hindi and English (Hinglish). Understand both languages and write your notes ENTIRELY IN ENGLISH.

Create CONCISE but COMPLETE clinical notes following this structure:

**Initial Assessment (First Session):**
- Primary presenting problems and concerns expressed by client
- History and duration of issues
- Client's current life context and circumstances
- Goals and expectations for therapy

**Clinical Observations:**
- Initial presentation: mood, affect, emotional state
- Communication style and level of engagement
- Strengths and areas of challenge noted

**Initial Impressions & Plan:**
- Potential diagnoses or areas of concern
- Recommended therapeutic approach
- Initial treatment goals
- Next steps and recommendations

**Initial Action Items:**
- Preliminary homework for client
- Areas to observe or track until next session

Keep notes factual and professional. Base everything ONLY on what's in the transcript.
Use clear, direct English language suitable for clinical records. Total length: 350-550 words."""
            else:
                # Subsequent sessions - compare and track progress
                system_prompt = f"""You are an experienced clinical psychologist writing notes for a FOLLOW-UP session.
This is session #{session_count + 1} with this client - track progress, changes, and patterns from previous sessions.

IMPORTANT: The transcript may contain mixed Hindi and English (Hinglish). Understand both languages and write your notes ENTIRELY IN ENGLISH.

Create CONCISE but COMPLETE clinical notes following this structure:

**Problems & Concerns Presented Today:**
- Issues discussed in current session
- Any new problems or recurring themes
- Updates from last session

**Progress & Changes Since Last Session:**
⭐ CRITICAL: Compare against previous sessions and highlight:
- Improvements and positive changes observed
- Lack of progress or new challenges
- Patterns noticed in behavior or outlook
- Homework/action item completion and outcomes
- Evolution of client's insight over time

**Clinical Observations:**
- Mood, affect, and emotional state during session
- Changes or consistency in behavior patterns
- Level of engagement and motivation

**Today's Interventions:**
- Therapeutic approaches or techniques used
- Key insights or breakthroughs achieved
- Client's response to interventions

**Homework & Next Steps:**
- New assignments and skills to practice
- Specific goals for next session

Keep notes factual with CLEAR comparisons to previous sessions.
Base everything on transcript and context provided. Write ENTIRELY IN ENGLISH. Total length: 350-550 words."""

            if session_count == 0:
                user_prompt = f"""This is the FIRST session with {client_name if client_name else '[Name]'}.
Create a comprehensive baseline assessment that will form the foundation for future sessions.

Session Type: {session_type}

TRANSCRIPT (may contain Hindi/English mix):
{transcript}

Generate detailed initial assessment notes based only on what was discussed.
Establish clear baseline for future progress tracking.
WRITE YOUR ENTIRE RESPONSE IN ENGLISH."""
            else:
                user_prompt = f"""{client_context}This is SESSION #{session_count + 1} with {client_name if client_name else '[Name]'}.

Session Type: {session_type}

TODAY'S TRANSCRIPT (may contain Hindi/English mix):
{transcript}

Generate clinical notes using past session context provided above.
Specifically highlight:
- What has IMPROVED? (progress, positive changes)
- What has WORSENED or stayed STAGNANT? (setbacks, challenges)
- What PATTERNS are emerging? (recurring themes, behaviors)
- How is the client's UNDERSTANDING evolving? (insight development)

WRITE YOUR ENTIRE RESPONSE IN ENGLISH."""
            
            if self.provider == 'gemini':
                # Use Gemini API
                full_prompt = f"{system_prompt}\n\n{user_prompt}"
                response = self.client.generate_content(full_prompt)
                summary = response.text
                
                return {
                    'success': True,
                    'summary': summary,
                    'model': 'gemini-2.0-flash',
                    'provider': 'gemini',
                    'session_count': session_count,
                    'is_first_session': session_count == 0,
                    'tokens_used': None  # Gemini doesn't provide token count in same way
                }
                
            else:  # OpenAI
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                
                summary = response.choices[0].message.content
                
                return {
                    'success': True,
                    'summary': summary,
                    'model': response.model,
                    'provider': 'openai',
                    'session_count': session_count,
                    'is_first_session': session_count == 0,
                    'tokens_used': response.usage.total_tokens if hasattr(response, 'usage') else None
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Summary generation failed: {str(e)}'
            }
    
    def generate_quick_summary(self, transcript: str, max_length: int = 200) -> Dict:
        """
        Generate a quick, brief summary of the session
        
        Args:
            transcript: Full transcript of the session
            max_length: Maximum words in summary
            
        Returns:
            Dictionary with summary results
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Summary service not configured'
            }
        
        try:
            prompt = f"Summarize the following therapy session in {max_length} words or less. Focus on key points.\n\n{transcript}"
            
            if self.provider == 'gemini':
                response = self.client.generate_content(prompt)
                summary = response.text
            else:  # OpenAI
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system", 
                            "content": f"Summarize the following therapy session in {max_length} words or less. Focus on key points."
                        },
                        {"role": "user", "content": transcript}
                    ],
                    temperature=0.5,
                    max_tokens=300
                )
                summary = response.choices[0].message.content
            
            return {
                'success': True,
                'summary': summary
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Quick summary failed: {str(e)}'
            }
    
    def extract_key_points(self, transcript: str) -> Dict:
        """
        Extract key points and action items from transcript
        
        Args:
            transcript: Full transcript of the session
            
        Returns:
            Dictionary with extracted key points
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Summary service not configured'
            }
        
        try:
            json_format = """{
    "main_topics": ["topic1", "topic2", ...],
    "emotions_identified": ["emotion1", "emotion2", ...],
    "action_items": ["action1", "action2", ...],
    "progress_notes": "brief progress note",
    "next_session_focus": "suggested focus areas"
}"""
            
            if self.provider == 'gemini':
                prompt = f"""Extract key information from this therapy session in JSON format:
{json_format}

Transcript:
{transcript}

Return only valid JSON."""
                
                response = self.client.generate_content(prompt)
                import json
                # Clean response text to get JSON
                response_text = response.text.strip()
                # Remove markdown code blocks if present
                if response_text.startswith('```'):
                    response_text = response_text.split('```')[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                    response_text = response_text.strip()
                
                key_points = json.loads(response_text)
                
            else:  # OpenAI
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": f"Extract key information from this therapy session in JSON format:\n{json_format}"
                        },
                        {"role": "user", "content": transcript}
                    ],
                    temperature=0.3,
                    max_tokens=500,
                    response_format={"type": "json_object"}
                )
                
                import json
                key_points = json.loads(response.choices[0].message.content)
            
            return {
                'success': True,
                'key_points': key_points
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Key point extraction failed: {str(e)}'
            }


class MockSummaryService(SummaryService):
    """Mock summary service for testing without API key"""
    
    def __init__(self):
        """Initialize mock service"""
        super().__init__()
        self.client = True  # Mock client
    
    def generate_session_summary(
        self, 
        transcript: str, 
        session_type: str = "individual",
        client_name: Optional[str] = None
    ) -> Dict:
        """Mock summary generation"""
        return {
            'success': True,
            'summary': f"""**Session Overview**
This was a {session_type} therapy session{f' with {client_name}' if client_name else ''}. 
The session lasted approximately 50 minutes and covered several important topics.

**Key Topics Discussed**
- Current life stressors and anxiety management
- Coping strategies for work-related challenges
- Building healthy communication patterns
- Self-care and emotional regulation

**Client's Emotional State**
The client exhibited mixed emotions throughout the session, showing moments of both anxiety 
and hope. Overall mood appeared to be improving compared to previous sessions.

**Progress Notes**
Client has been actively practicing the mindfulness techniques introduced in the last session. 
Notable improvement in stress management and self-awareness.

**Action Items**
1. Continue daily mindfulness practice (10 minutes)
2. Journal about emotional triggers this week
3. Practice the communication techniques discussed
4. Complete the mood tracking worksheet

**Therapist Observations**
Client is showing good engagement and willingness to implement therapeutic strategies. 
Building stronger therapeutic alliance. Client appears more open to discussing difficult emotions.

**Recommendations**
Future sessions should continue to focus on anxiety management techniques and explore 
underlying patterns contributing to stress. Consider introducing cognitive restructuring 
exercises in the next session.

[This is a mock summary. In production, this would be generated from the actual transcript using AI.]""",
            'model': 'mock-gpt-4',
            'tokens_used': 500
        }
    
    def generate_quick_summary(self, transcript: str, max_length: int = 200) -> Dict:
        """Mock quick summary"""
        return {
            'success': True,
            'summary': "Client discussed work-related anxiety and coping strategies. "
                      "Progress noted in mindfulness practice. Action items include daily "
                      "meditation, journaling, and communication practice. Overall positive session "
                      "with client showing good engagement and willingness to implement changes."
        }
    
    def extract_key_points(self, transcript: str) -> Dict:
        """Mock key point extraction"""
        return {
            'success': True,
            'key_points': {
                'main_topics': ['Work anxiety', 'Stress management', 'Communication skills', 'Self-care'],
                'emotions_identified': ['Anxiety', 'Stress', 'Hope', 'Determination'],
                'action_items': [
                    'Daily mindfulness practice (10 minutes)',
                    'Journal about emotional triggers',
                    'Practice communication techniques',
                    'Complete mood tracking worksheet'
                ],
                'progress_notes': 'Client actively practicing mindfulness, showing improved stress management and self-awareness',
                'next_session_focus': 'Continue anxiety management, explore underlying stress patterns, introduce cognitive restructuring'
            }
        }
