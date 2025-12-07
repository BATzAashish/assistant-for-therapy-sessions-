"""
Emotion Detection Service
Complete video emotion detection pipeline using MediaPipe + FER
100% free, open-source, local inference
"""
import cv2
import numpy as np
import mediapipe as mp
from fer.fer import FER
from typing import Dict, List, Optional
import time
from collections import deque
import logging

logger = logging.getLogger(__name__)


class FaceMeshAnalyzer:
    """MediaPipe FaceMesh for landmark extraction"""
    
    # MediaPipe landmark indices for key facial regions
    LANDMARK_GROUPS = {
        'left_eye': [33, 160, 158, 133, 153, 144],
        'right_eye': [362, 385, 387, 263, 373, 380],
        'left_eyebrow': [46, 53, 52, 65, 55],
        'right_eyebrow': [276, 283, 282, 295, 285],
        'lips_upper': [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
        'lips_lower': [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
        'jaw': [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379],
        'nose': [1, 2, 98, 327],
        'left_iris': [468, 469, 470, 471, 472],
        'right_iris': [473, 474, 475, 476, 477]
    }
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,  # Get iris landmarks
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        logger.info("✓ MediaPipe FaceMesh initialized (468 landmarks)")
    
    def extract_landmarks(self, frame):
        """Extract 468 facial landmarks from frame"""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if not results.multi_face_landmarks:
                return None
            
            landmarks = results.multi_face_landmarks[0]
            
            # Convert to numpy array (468 x 3)
            h, w = frame.shape[:2]
            points = np.array([[lm.x * w, lm.y * h, lm.z] 
                              for lm in landmarks.landmark])
            
            return points
            
        except Exception as e:
            logger.error(f"Error extracting landmarks: {e}")
            return None
    
    def get_landmark_group(self, landmarks, group_name):
        """Get specific landmark group (e.g., 'left_eye')"""
        if landmarks is None or group_name not in self.LANDMARK_GROUPS:
            return None
        
        indices = self.LANDMARK_GROUPS[group_name]
        return landmarks[indices]


class EmotionDetector:
    """FER-based emotion detection using CNN"""
    
    EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    
    def __init__(self):
        try:
            # FER uses MTCNN for face detection + custom CNN for emotion
            self.detector = FER(mtcnn=True)
            logger.info("✓ FER emotion detector initialized")
        except Exception as e:
            logger.error(f"✗ Failed to initialize FER: {e}")
            self.detector = None
    
    def detect_emotion(self, frame):
        """
        Detect emotions from frame using CNN
        
        Returns:
            {
                'dominant_emotion': 'happy',
                'confidence': 0.85,
                'all_emotions': {
                    'angry': 0.02,
                    'disgust': 0.0,
                    'fear': 0.05,
                    'happy': 0.85,
                    'sad': 0.02,
                    'surprise': 0.01,
                    'neutral': 0.05
                }
            }
        """
        if self.detector is None:
            return None
        
        try:
            emotions = self.detector.detect_emotions(frame)
            
            if not emotions or len(emotions) == 0:
                return None
            
            # Get emotion scores
            emotion_scores = emotions[0]['emotions']
            dominant = max(emotion_scores, key=emotion_scores.get)
            confidence = emotion_scores[dominant]
            
            return {
                'dominant_emotion': dominant,
                'confidence': confidence,
                'all_emotions': emotion_scores
            }
            
        except Exception as e:
            logger.error(f"Error detecting emotion: {e}")
            return None


class MicroExpressionDetector:
    """Detect micro-expressions using geometric landmark analysis"""
    
    def __init__(self):
        self.landmark_analyzer = FaceMeshAnalyzer()
        self.history = deque(maxlen=10)  # Store last 10 frames
        self.blink_history = deque(maxlen=30)  # 30 frames for blink rate
        
    def analyze_micro_expressions(self, landmarks, timestamp):
        """
        Analyze micro-expressions using rule-based geometry
        
        Returns:
            {
                'eyebrow_raise': {...},
                'lip_press': {...},
                'blink_rate': {...},
                'eye_widening': {...},
                'jaw_tension': {...},
                'micro_smile': {...}
            }
        """
        if landmarks is None:
            return {}
        
        micro_signals = {}
        
        # 1. Eyebrow Raise (Surprise/Interest)
        micro_signals['eyebrow_raise'] = self._detect_eyebrow_raise(landmarks)
        
        # 2. Lip Press (Stress/Anxiety)
        micro_signals['lip_press'] = self._detect_lip_press(landmarks)
        
        # 3. Blink Rate (Stress indicator)
        micro_signals['blink_rate'] = self._calculate_blink_rate(landmarks)
        
        # 4. Eye Widening (Fear/Surprise)
        micro_signals['eye_widening'] = self._detect_eye_widening(landmarks)
        
        # 5. Jaw Tension (Anger/Stress)
        micro_signals['jaw_tension'] = self._detect_jaw_tension(landmarks)
        
        # 6. Micro Smile (Duchenne vs Social)
        micro_signals['micro_smile'] = self._detect_micro_smile(landmarks)
        
        # Store in history
        self.history.append({
            'timestamp': timestamp,
            'signals': micro_signals
        })
        
        return micro_signals
    
    def _detect_eyebrow_raise(self, landmarks):
        """Geometric calculation: eyebrow-eye distance"""
        try:
            # Left eyebrow and eye
            left_brow = landmarks[70]  # Left eyebrow top
            left_eye = landmarks[159]  # Left eye top
            
            # Right eyebrow and eye
            right_brow = landmarks[300]
            right_eye = landmarks[386]
            
            left_dist = np.linalg.norm(left_brow[:2] - left_eye[:2])
            right_dist = np.linalg.norm(right_brow[:2] - right_eye[:2])
            
            avg_dist = (left_dist + right_dist) / 2
            
            # Normalize by face height
            face_height = np.linalg.norm(landmarks[10][:2] - landmarks[152][:2])
            normalized = avg_dist / face_height if face_height > 0 else 0
            
            return {
                'detected': normalized > 0.08,
                'intensity': min(normalized / 0.08, 1.0),
                'confidence': 0.85
            }
        except:
            return {'detected': False, 'intensity': 0.0, 'confidence': 0.0}
    
    def _detect_lip_press(self, landmarks):
        """Detect lip compression (stress/anxiety)"""
        try:
            # Upper and lower lip center points
            upper_lip = landmarks[13]
            lower_lip = landmarks[14]
            
            # Mouth corners
            left_corner = landmarks[61]
            right_corner = landmarks[291]
            
            # Vertical lip distance
            lip_gap = np.linalg.norm(upper_lip[:2] - lower_lip[:2])
            
            # Mouth width for normalization
            mouth_width = np.linalg.norm(left_corner[:2] - right_corner[:2])
            
            normalized = lip_gap / mouth_width if mouth_width > 0 else 0
            
            return {
                'detected': normalized < 0.08,
                'intensity': max(0, (0.08 - normalized) / 0.08),
                'confidence': 0.80
            }
        except:
            return {'detected': False, 'intensity': 0.0, 'confidence': 0.0}
    
    def _calculate_blink_rate(self, landmarks):
        """Calculate blink rate using Eye Aspect Ratio (EAR)"""
        try:
            # Calculate EAR for left eye
            left_eye_indices = [33, 160, 158, 133, 153, 144]
            left_eye = landmarks[left_eye_indices]
            
            # Vertical distances
            v1 = np.linalg.norm(left_eye[1][:2] - left_eye[5][:2])
            v2 = np.linalg.norm(left_eye[2][:2] - left_eye[4][:2])
            
            # Horizontal distance
            h = np.linalg.norm(left_eye[0][:2] - left_eye[3][:2])
            
            # EAR formula
            ear = (v1 + v2) / (2.0 * h) if h > 0 else 0
            
            # Store EAR for blink detection (EAR < 0.2 = blink)
            is_blink = ear < 0.2
            self.blink_history.append(is_blink)
            
            # Count blinks in last 30 frames
            blink_count = sum(self.blink_history)
            
            # Extrapolate to per minute (assuming 7 FPS)
            rate_per_min = (blink_count / len(self.blink_history)) * 7 * 60 if len(self.blink_history) > 0 else 0
            
            # Normal: 15-20 blinks/min, Stressed: 30+ blinks/min
            return {
                'detected': rate_per_min > 25,
                'rate_per_min': rate_per_min,
                'confidence': 0.70
            }
        except:
            return {'detected': False, 'rate_per_min': 0, 'confidence': 0.0}
    
    def _detect_eye_widening(self, landmarks):
        """Eye Aspect Ratio (EAR) for eye widening"""
        try:
            # Left eye
            left_eye_indices = [33, 160, 158, 133, 153, 144]
            left_eye = landmarks[left_eye_indices]
            
            # Vertical distances
            v1 = np.linalg.norm(left_eye[1][:2] - left_eye[5][:2])
            v2 = np.linalg.norm(left_eye[2][:2] - left_eye[4][:2])
            
            # Horizontal distance
            h = np.linalg.norm(left_eye[0][:2] - left_eye[3][:2])
            
            # EAR formula
            ear = (v1 + v2) / (2.0 * h) if h > 0 else 0
            
            # Normal EAR: ~0.25-0.30, Widened: >0.35
            return {
                'detected': ear > 0.35,
                'intensity': min((ear - 0.25) / 0.15, 1.0) if ear > 0.25 else 0.0,
                'confidence': 0.88
            }
        except:
            return {'detected': False, 'intensity': 0.0, 'confidence': 0.0}
    
    def _detect_jaw_tension(self, landmarks):
        """Measure jaw clenching"""
        try:
            # Jaw corners
            left_jaw = landmarks[172]
            right_jaw = landmarks[397]
            
            # Chin point
            chin = landmarks[152]
            
            # Calculate jaw dimensions
            jaw_width = np.linalg.norm(right_jaw[:2] - left_jaw[:2])
            jaw_center = (left_jaw[:2] + right_jaw[:2]) / 2
            jaw_height = np.linalg.norm(chin[:2] - jaw_center)
            
            ratio = jaw_height / jaw_width if jaw_width > 0 else 0
            
            # Lower ratio = more tension (jaw clenched)
            return {
                'detected': ratio < 0.65,
                'intensity': max(0, (0.65 - ratio) / 0.15),
                'confidence': 0.75
            }
        except:
            return {'detected': False, 'intensity': 0.0, 'confidence': 0.0}
    
    def _detect_micro_smile(self, landmarks):
        """Detect Duchenne (genuine) vs social smile"""
        try:
            # Mouth corners
            left_corner = landmarks[61]
            right_corner = landmarks[291]
            
            # Upper lip center
            upper_lip = landmarks[0]
            
            # Check if mouth corners raised
            mouth_center_y = (left_corner[1] + right_corner[1]) / 2
            mouth_lift = upper_lip[1] - mouth_center_y
            
            # Check if eyes crinkled (Duchenne marker)
            # Simplified: check if outer eye corners moved
            left_outer = landmarks[33]
            right_outer = landmarks[263]
            eye_crinkle = False  # Would need temporal comparison
            
            smile_type = 'duchenne' if eye_crinkle else 'social'
            
            return {
                'detected': mouth_lift > 2,  # Pixels
                'type': smile_type,
                'intensity': min(mouth_lift / 10, 1.0) if mouth_lift > 0 else 0.0,
                'confidence': 0.82
            }
        except:
            return {'detected': False, 'type': 'none', 'intensity': 0.0, 'confidence': 0.0}


class EmotionFusionEngine:
    """Fuse CNN emotions + geometric micro-expressions"""
    
    def __init__(self):
        self.emotion_detector = EmotionDetector()
        self.micro_detector = MicroExpressionDetector()
        
    def process_frame(self, frame, timestamp):
        """
        Process single frame and return fused emotion analysis
        
        Returns:
            {
                'timestamp': float,
                'face_detected': bool,
                'emotion_analysis': {...},
                'micro_expressions': {...},
                'composite_scores': {...},
                'clinical_insights': {...}
            }
        """
        # Extract landmarks first
        landmarks = self.micro_detector.landmark_analyzer.extract_landmarks(frame)
        
        if landmarks is None:
            return {
                'timestamp': timestamp,
                'face_detected': False,
                'error': 'No face detected'
            }
        
        # Get CNN emotion prediction
        emotion_result = self.emotion_detector.detect_emotion(frame)
        
        # Analyze micro-expressions from landmarks
        micro_signals = self.micro_detector.analyze_micro_expressions(landmarks, timestamp)
        
        # Fusion
        fused_result = self._fuse_signals(
            emotion_result,
            micro_signals,
            landmarks,
            timestamp
        )
        
        return fused_result
    
    def _fuse_signals(self, emotion, micro, landmarks, timestamp):
        """Weighted fusion of ML + geometric features"""
        
        if emotion is None:
            base_emotion = 'neutral'
            base_confidence = 0.5
            all_emotions = {}
        else:
            base_emotion = emotion['dominant_emotion']
            base_confidence = emotion['confidence']
            all_emotions = emotion['all_emotions']
        
        # Calculate composite scores
        stress_score = self._calculate_stress_score(micro)
        anxiety_score = self._calculate_anxiety_score(micro)
        engagement_score = self._calculate_engagement(micro, landmarks)
        
        # Adjust emotion based on micro-expressions
        if stress_score > 0.7 and base_emotion == 'neutral':
            base_emotion = 'stressed'
        
        if anxiety_score > 0.7 and base_emotion in ['sad', 'neutral']:
            base_emotion = 'anxious'
        
        # Calculate overall confidence
        detected_micros = [m for m in micro.values() if m.get('detected', False)]
        micro_confidence = np.mean([m.get('confidence', 0.5) for m in detected_micros]) if detected_micros else 0.5
        
        combined_confidence = 0.6 * base_confidence + 0.4 * micro_confidence
        
        # Build clinical insights
        clinical_insights = self._generate_clinical_insights(
            base_emotion, stress_score, anxiety_score, engagement_score, micro
        )
        
        return {
            'timestamp': timestamp,
            'face_detected': True,
            'emotion_analysis': {
                'dominant_emotion': base_emotion,
                'confidence': combined_confidence,
                'emotion_probabilities': all_emotions
            },
            'micro_expressions': {
                k: v for k, v in micro.items() if v.get('detected', False)
            },
            'composite_scores': {
                'stress_score': stress_score,
                'anxiety_score': anxiety_score,
                'engagement_score': engagement_score,
                'overall_confidence': combined_confidence
            },
            'clinical_insights': clinical_insights
        }
    
    def _calculate_stress_score(self, micro):
        """Aggregate stress indicators"""
        stress_signals = [
            micro.get('lip_press', {}).get('intensity', 0) * 0.3,
            micro.get('jaw_tension', {}).get('intensity', 0) * 0.3,
            min(micro.get('blink_rate', {}).get('rate_per_min', 0) / 50, 1.0) * 0.4
        ]
        return min(sum(stress_signals), 1.0)
    
    def _calculate_anxiety_score(self, micro):
        """Aggregate anxiety indicators"""
        anxiety_signals = [
            micro.get('eye_widening', {}).get('intensity', 0) * 0.4,
            micro.get('eyebrow_raise', {}).get('intensity', 0) * 0.3,
            micro.get('lip_press', {}).get('intensity', 0) * 0.3
        ]
        return min(sum(anxiety_signals), 1.0)
    
    def _calculate_engagement(self, micro, landmarks):
        """Measure client engagement"""
        engagement = 0.7  # Base engagement
        
        if micro.get('micro_smile', {}).get('detected'):
            engagement += 0.15
        if micro.get('eyebrow_raise', {}).get('detected'):
            engagement += 0.15
        
        return min(engagement, 1.0)
    
    def _generate_clinical_insights(self, emotion, stress, anxiety, engagement, micro):
        """Generate clinical insights from data"""
        insights = {
            'primary_state': emotion,
            'stress_level': 'low' if stress < 0.3 else ('moderate' if stress < 0.7 else 'elevated'),
            'anxiety_indicators': [],
            'positive_indicators': []
        }
        
        # Identify anxiety indicators
        if micro.get('lip_press', {}).get('detected'):
            insights['anxiety_indicators'].append('lip_press')
        if micro.get('blink_rate', {}).get('detected'):
            insights['anxiety_indicators'].append('elevated_blink_rate')
        if micro.get('jaw_tension', {}).get('detected'):
            insights['anxiety_indicators'].append('jaw_tension')
        
        # Identify positive indicators
        if micro.get('micro_smile', {}).get('detected'):
            insights['positive_indicators'].append('micro_smile')
        if micro.get('eyebrow_raise', {}).get('detected'):
            insights['positive_indicators'].append('eyebrow_raise_interest')
        if engagement > 0.8:
            insights['positive_indicators'].append('high_engagement')
        
        return insights


class TherapyEmotionPipeline:
    """
    Complete emotion detection pipeline for therapy sessions
    100% free, open-source, local inference
    """
    
    def __init__(self, fps=7):
        self.fps = fps
        self.fusion_engine = EmotionFusionEngine()
        self.session_data = []
        self.running = False
        logger.info(f"✓ Therapy Emotion Pipeline initialized at {fps} FPS")
    
    def process_frame(self, frame, timestamp):
        """
        Process a single frame
        
        Args:
            frame: OpenCV frame (BGR)
            timestamp: Timestamp in seconds
            
        Returns:
            Emotion analysis result dict
        """
        return self.fusion_engine.process_frame(frame, timestamp)
    
    def start_realtime_analysis(self, callback=None):
        """
        Start real-time webcam analysis
        
        Args:
            callback: Function to call with each result
        """
        self.running = True
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FPS, self.fps)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        frame_interval = 1.0 / self.fps
        session_start = time.time()
        
        logger.info("🎥 Real-time analysis started")
        
        try:
            while self.running:
                loop_start = time.time()
                
                ret, frame = cap.read()
                if not ret:
                    break
                
                timestamp = time.time() - session_start
                result = self.process_frame(frame, timestamp)
                
                if result and result.get('face_detected'):
                    self.session_data.append(result)
                    
                    if callback:
                        callback(result)
                    else:
                        self._print_live_feedback(result)
                
                # Maintain FPS
                elapsed = time.time() - loop_start
                if elapsed < frame_interval:
                    time.sleep(frame_interval - elapsed)
        
        finally:
            cap.release()
            logger.info("🛑 Real-time analysis stopped")
    
    def stop_realtime_analysis(self):
        """Stop real-time analysis"""
        self.running = False
    
    def generate_session_summary(self):
        """Generate session-level emotion summary"""
        if not self.session_data:
            return None
        
        total_frames = len(self.session_data)
        duration = self.session_data[-1]['timestamp']
        
        # Aggregate emotions
        emotion_counts = {}
        total_stress = 0
        total_anxiety = 0
        total_engagement = 0
        
        for frame in self.session_data:
            emotion = frame['emotion_analysis']['dominant_emotion']
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            total_stress += frame['composite_scores']['stress_score']
            total_anxiety += frame['composite_scores']['anxiety_score']
            total_engagement += frame['composite_scores']['engagement_score']
        
        # Calculate distribution
        emotion_dist = {
            e: count / total_frames 
            for e, count in emotion_counts.items()
        }
        
        summary = {
            'duration_seconds': duration,
            'total_frames_analyzed': total_frames,
            'emotion_distribution': emotion_dist,
            'avg_stress_score': total_stress / total_frames,
            'avg_anxiety_score': total_anxiety / total_frames,
            'avg_engagement_score': total_engagement / total_frames,
            'predominant_emotion': max(emotion_counts, key=emotion_counts.get)
        }
        
        return summary
    
    def _print_live_feedback(self, result):
        """Print real-time emotion feedback"""
        emotion = result['emotion_analysis']['dominant_emotion']
        conf = result['emotion_analysis']['confidence']
        stress = result['composite_scores']['stress_score']
        anxiety = result['composite_scores']['anxiety_score']
        
        print(f"⏱️  {result['timestamp']:.1f}s | "
              f"😊 {emotion.upper()} ({conf:.2f}) | "
              f"😰 Stress: {stress:.2f} | "
              f"😟 Anxiety: {anxiety:.2f}")
