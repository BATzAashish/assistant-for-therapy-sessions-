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
    
    def generate_session_summary(
        self, 
        transcript: str, 
        session_type: str = "individual",
        client_name: Optional[str] = None
    ) -> Dict:
        """
        Generate a comprehensive summary of a therapy session
        
        Args:
            transcript: Full transcript of the session
            session_type: Type of session (individual, group, etc.)
            client_name: Name of the client (optional, for personalization)
            
        Returns:
            Dictionary with summary results
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Summary service not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.'
            }
        
        try:
            # Create a therapy-focused prompt - concise and problem-focused
            system_prompt = """You are an experienced clinical psychologist writing session notes. 
Create CONCISE but COMPLETE clinical notes following this structure:

**Problems & Concerns Presented:**
- List the specific issues, complaints, or concerns the client discussed
- Note any new problems or recurring themes

**Clinical Observations:**
- Client's mood, affect, and emotional state during session
- Notable behaviors, body language, or verbal patterns
- Level of engagement and participation

**Interventions & Discussion:**
- Therapeutic approaches or techniques used
- Key insights or breakthroughs
- Client's response to interventions

**Progress & Changes:**
- Improvements noted since last session
- Setbacks or challenges encountered
- Overall trajectory of treatment

**Homework & Action Items:**
- Specific tasks assigned to client
- Skills to practice
- Goals for next session

Keep notes factual and professional. Base everything ONLY on what's in the transcript - do not invent details. 
Use clear, direct language suitable for clinical records. Total length: 300-500 words."""

            user_prompt = f"""Create clinical session notes from this transcript:

Session Type: {session_type}
Client: {client_name if client_name else '[Name]'}

TRANSCRIPT:
{transcript}

Generate concise clinical notes based only on what was discussed."""

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
