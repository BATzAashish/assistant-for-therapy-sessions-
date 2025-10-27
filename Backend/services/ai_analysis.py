"""
AI Analysis Service for Emotion Detection and MOM Generation
"""
import cv2
import numpy as np
from fer import FER
import librosa
import logging
from datetime import datetime
from typing import Dict, List, Optional
import os

logger = logging.getLogger(__name__)

class EmotionAnalyzer:
    """Analyzes emotions from facial expressions and voice"""
    
    def __init__(self):
        try:
            self.face_detector = FER(mtcnn=True)
            logger.info("✓ Facial emotion detector initialized")
        except Exception as e:
            logger.error(f"✗ Failed to initialize facial emotion detector: {e}")
            self.face_detector = None
    
    def analyze_face(self, image_data: np.ndarray) -> Dict:
        """
        Analyze facial emotions from an image frame
        
        Args:
            image_data: numpy array of image (BGR format)
            
        Returns:
            dict with emotions and confidence scores
        """
        if self.face_detector is None:
            return {'error': 'Face detector not initialized'}
        
        try:
            # Detect emotions
            emotions = self.face_detector.detect_emotions(image_data)
            
            if not emotions:
                return {'status': 'no_face_detected'}
            
            # Get the first detected face
            face = emotions[0]
            emotion_scores = face['emotions']
            
            # Find dominant emotion
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            confidence = emotion_scores[dominant_emotion]
            
            return {
                'status': 'success',
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'all_emotions': emotion_scores,
                'face_box': face['box']
            }
            
        except Exception as e:
            logger.error(f"Error analyzing face: {e}")
            return {'error': str(e)}
    
    def analyze_voice_sentiment(self, audio_data: np.ndarray, sr: int = 22050) -> Dict:
        """
        Analyze voice sentiment from audio data
        
        Args:
            audio_data: numpy array of audio samples
            sr: sample rate
            
        Returns:
            dict with voice features and estimated sentiment
        """
        try:
            # Extract features
            # Pitch (fundamental frequency)
            pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sr)
            pitch_mean = np.mean(pitches[pitches > 0]) if pitches[pitches > 0].size > 0 else 0
            
            # Energy
            energy = np.mean(librosa.feature.rms(y=audio_data))
            
            # Zero crossing rate (speech rate indicator)
            zcr = np.mean(librosa.feature.zero_crossing_rate(audio_data))
            
            # Spectral centroid (brightness)
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio_data, sr=sr))
            
            # MFCCs (voice quality)
            mfccs = librosa.feature.mfcc(y=audio_data, sr=sr, n_mfcc=13)
            mfcc_mean = np.mean(mfccs, axis=1)
            
            # Simple sentiment estimation based on voice features
            # High energy + high pitch = excited/anxious
            # Low energy + low pitch = sad/calm
            # Medium energy + varied pitch = neutral/conversational
            
            sentiment = 'neutral'
            if energy > 0.02 and pitch_mean > 200:
                sentiment = 'anxious' if energy > 0.04 else 'excited'
            elif energy < 0.01 and pitch_mean < 150:
                sentiment = 'sad' if pitch_mean < 100 else 'calm'
            elif zcr > 0.1:
                sentiment = 'stressed'
            
            return {
                'status': 'success',
                'sentiment': sentiment,
                'features': {
                    'pitch_mean': float(pitch_mean),
                    'energy': float(energy),
                    'zero_crossing_rate': float(zcr),
                    'spectral_centroid': float(spectral_centroid),
                    'mfcc_mean': mfcc_mean.tolist()
                },
                'confidence': 0.7  # Placeholder - would be from trained model
            }
            
        except Exception as e:
            logger.error(f"Error analyzing voice: {e}")
            return {'error': str(e)}


class TranscriptionService:
    """Handles speech-to-text transcription"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.use_openai = bool(self.api_key)
        
        if self.use_openai:
            try:
                import openai
                self.openai = openai
                logger.info("✓ OpenAI Whisper initialized")
            except ImportError:
                logger.warning("OpenAI not installed, using fallback")
                self.use_openai = False
    
    async def transcribe_audio(self, audio_file_path: str, language: str = 'en') -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: path to audio file
            language: language code
            
        Returns:
            dict with transcription and metadata
        """
        try:
            if self.use_openai:
                # Use OpenAI Whisper API
                with open(audio_file_path, 'rb') as audio_file:
                    transcript = self.openai.Audio.transcribe(
                        "whisper-1",
                        audio_file,
                        language=language
                    )
                
                return {
                    'status': 'success',
                    'text': transcript['text'],
                    'service': 'openai_whisper'
                }
            else:
                # Fallback to basic speech recognition
                import speech_recognition as sr
                recognizer = sr.Recognizer()
                
                with sr.AudioFile(audio_file_path) as source:
                    audio = recognizer.record(source)
                    text = recognizer.recognize_google(audio, language=language)
                
                return {
                    'status': 'success',
                    'text': text,
                    'service': 'google_speech'
                }
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return {'error': str(e)}


class MOMGenerator:
    """Generates Minutes of Meeting (therapy session notes)"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        
        if self.api_key:
            try:
                import openai
                self.openai = openai
                self.openai.api_key = self.api_key
                logger.info("✓ OpenAI initialized for MOM generation")
            except ImportError:
                logger.warning("OpenAI not installed")
                self.openai = None
    
    async def generate_session_notes(self, 
                                     transcription: List[Dict],
                                     emotions: List[Dict],
                                     session_metadata: Dict) -> Dict:
        """
        Generate comprehensive session notes
        
        Args:
            transcription: list of transcription segments
            emotions: list of emotion data points
            session_metadata: session info (duration, participants, etc.)
            
        Returns:
            dict with structured session notes
        """
        try:
            # Compile transcription
            full_transcript = "\n".join([
                f"[{t['timestamp']}] {t['speaker']}: {t['text']}"
                for t in transcription
            ])
            
            # Analyze emotion patterns
            emotion_summary = self._analyze_emotion_patterns(emotions)
            
            if self.openai:
                # Use GPT-4 to generate structured notes
                prompt = f"""
You are a professional therapy session note-taker. Generate comprehensive Minutes of Meeting (MOM) for this therapy session.

Session Information:
- Duration: {session_metadata.get('duration', 'N/A')}
- Date: {session_metadata.get('date', 'N/A')}

Transcription:
{full_transcript}

Emotional Analysis:
{emotion_summary}

Please provide:
1. Session Summary (2-3 sentences)
2. Key Topics Discussed (bullet points)
3. Client's Emotional State (throughout session)
4. Significant Moments or Breakthroughs
5. Therapist's Observations
6. Recommendations for Next Session
7. Action Items (if any)

Format the output as structured JSON.
"""
                
                response = self.openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an expert therapy session note-taker."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1500
                )
                
                notes_text = response.choices[0].message.content
                
                return {
                    'status': 'success',
                    'notes': notes_text,
                    'emotion_summary': emotion_summary,
                    'transcript_length': len(transcription),
                    'generated_at': datetime.utcnow().isoformat()
                }
            else:
                # Fallback: basic summary
                return {
                    'status': 'success',
                    'notes': self._generate_basic_summary(transcription, emotion_summary),
                    'emotion_summary': emotion_summary,
                    'transcript_length': len(transcription),
                    'generated_at': datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error generating MOM: {e}")
            return {'error': str(e)}
    
    def _analyze_emotion_patterns(self, emotions: List[Dict]) -> str:
        """Analyze emotion data to identify patterns"""
        if not emotions:
            return "No emotion data available"
        
        # Count emotion occurrences
        emotion_counts = {}
        for e in emotions:
            emotion = e.get('data', {}).get('dominant_emotion', 'unknown')
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Find dominant emotions
        total = len(emotions)
        summary = "Emotion Distribution:\n"
        for emotion, count in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total) * 100
            summary += f"- {emotion.capitalize()}: {percentage:.1f}%\n"
        
        return summary
    
    def _generate_basic_summary(self, transcription: List[Dict], emotion_summary: str) -> str:
        """Generate basic summary without AI"""
        return f"""
SESSION SUMMARY

Total Exchanges: {len(transcription)}

{emotion_summary}

Key Points:
- Session contained {len(transcription)} conversation turns
- Emotional state tracked throughout session
- Full transcription available for detailed review

Note: Advanced AI analysis requires OpenAI API key configuration.
"""


# Initialize global instances
emotion_analyzer = EmotionAnalyzer()
transcription_service = TranscriptionService()
mom_generator = MOMGenerator()
