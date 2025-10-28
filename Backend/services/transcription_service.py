"""
Transcription Service
Handles voice-to-text transcription for therapy sessions
"""
import os
from datetime import datetime
from typing import List, Dict, Optional
import openai
from openai import OpenAI

class TranscriptionService:
    """Service for transcribing audio to text"""
    
    def __init__(self):
        """Initialize transcription service"""
        self.api_key = os.environ.get('OPENAI_API_KEY')
        self.client = None
        
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
    
    def is_available(self) -> bool:
        """Check if transcription service is available"""
        return self.client is not None
    
    def transcribe_audio(self, audio_file_path: str, language: str = "en") -> Dict:
        """
        Transcribe audio file to text using OpenAI Whisper
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code (e.g., 'en' for English)
            
        Returns:
            Dictionary with transcription results
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Transcription service not configured. Please set OPENAI_API_KEY.'
            }
        
        try:
            with open(audio_file_path, 'rb') as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            
            return {
                'success': True,
                'text': transcription.text,
                'segments': transcription.segments if hasattr(transcription, 'segments') else [],
                'language': transcription.language if hasattr(transcription, 'language') else language,
                'duration': transcription.duration if hasattr(transcription, 'duration') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Transcription failed: {str(e)}'
            }
    
    def transcribe_audio_chunk(self, audio_data: bytes, format: str = "webm") -> Dict:
        """
        Transcribe audio chunk (for real-time transcription)
        
        Args:
            audio_data: Raw audio bytes
            format: Audio format (webm, mp3, wav, etc.)
            
        Returns:
            Dictionary with transcription results
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Transcription service not configured'
            }
        
        try:
            # Create a temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name
            
            # Transcribe
            result = self.transcribe_audio(temp_path)
            
            # Clean up
            os.unlink(temp_path)
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Chunk transcription failed: {str(e)}'
            }
    
    def format_transcript(self, segments: List[Dict]) -> str:
        """
        Format transcript segments into readable text with timestamps
        
        Args:
            segments: List of transcript segments with timestamps
            
        Returns:
            Formatted transcript string
        """
        formatted = []
        
        for segment in segments:
            if isinstance(segment, dict):
                timestamp = segment.get('start', 0)
                text = segment.get('text', '').strip()
                
                minutes = int(timestamp // 60)
                seconds = int(timestamp % 60)
                formatted.append(f"[{minutes:02d}:{seconds:02d}] {text}")
            else:
                # Handle different segment formats
                formatted.append(str(segment))
        
        return '\n'.join(formatted)
    
    def combine_transcripts(self, transcripts: List[str]) -> str:
        """
        Combine multiple transcript chunks into one
        
        Args:
            transcripts: List of transcript strings
            
        Returns:
            Combined transcript
        """
        return '\n\n'.join(transcripts)


class MockTranscriptionService(TranscriptionService):
    """Mock transcription service for testing without API key"""
    
    def __init__(self):
        """Initialize mock service"""
        super().__init__()
        self.client = True  # Mock client
    
    def transcribe_audio(self, audio_file_path: str, language: str = "en") -> Dict:
        """Mock transcription"""
        return {
            'success': True,
            'text': f"[Mock Transcription] This is a simulated transcription of the audio file: {audio_file_path}. "
                   f"In a real implementation, this would contain the actual speech-to-text conversion of the therapy session.",
            'segments': [
                {'start': 0, 'text': 'Hello, how are you feeling today?'},
                {'start': 5, 'text': 'I have been feeling anxious lately.'},
                {'start': 12, 'text': 'Can you tell me more about that?'},
                {'start': 18, 'text': 'It started when I began my new job...'}
            ],
            'language': language,
            'duration': 30.0
        }
    
    def transcribe_audio_chunk(self, audio_data: bytes, format: str = "webm") -> Dict:
        """Mock chunk transcription"""
        return {
            'success': True,
            'text': '[Mock] Transcribed audio chunk content...',
            'segments': [],
            'language': 'en',
            'duration': None
        }
