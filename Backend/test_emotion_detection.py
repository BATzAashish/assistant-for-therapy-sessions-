"""
Test Emotion Detection Pipeline
Run this to test the emotion detection system locally
"""
import cv2
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.emotion_detection import TherapyEmotionPipeline
import time


def test_webcam_emotion_detection():
    """Test emotion detection with webcam"""
    print("=" * 60)
    print("🎥 Therapy Emotion Detection Test")
    print("=" * 60)
    print()
    print("Testing dependencies...")
    
    # Check dependencies
    try:
        import mediapipe as mp
        print("✓ MediaPipe: installed")
    except ImportError:
        print("✗ MediaPipe: NOT installed")
        print("  Install: pip install mediapipe")
        return
    
    try:
        from fer import FER
        print("✓ FER: installed")
    except ImportError:
        print("✗ FER: NOT installed")
        print("  Install: pip install fer")
        return
    
    try:
        import tensorflow as tf
        print("✓ TensorFlow: installed")
    except ImportError:
        print("✗ TensorFlow: NOT installed")
        print("  Install: pip install tensorflow")
        return
    
    print()
    print("All dependencies installed! ✅")
    print()
    print("=" * 60)
    print("Starting webcam emotion detection...")
    print("Press 'q' to quit")
    print("=" * 60)
    print()
    
    # Initialize pipeline
    pipeline = TherapyEmotionPipeline(fps=7)
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Could not open webcam")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    print("📹 Webcam opened successfully")
    print()
    
    frame_count = 0
    start_time = time.time()
    fps_target = 7
    frame_interval = 1.0 / fps_target
    
    try:
        while True:
            loop_start = time.time()
            
            # Capture frame
            ret, frame = cap.read()
            if not ret:
                print("❌ Error reading frame")
                break
            
            # Calculate timestamp
            timestamp = time.time() - start_time
            
            # Process frame
            result = pipeline.process_frame(frame, timestamp)
            
            # Display results
            if result and result.get('face_detected'):
                emotion = result['emotion_analysis']['dominant_emotion']
                confidence = result['emotion_analysis']['confidence']
                stress = result['composite_scores']['stress_score']
                anxiety = result['composite_scores']['anxiety_score']
                engagement = result['composite_scores']['engagement_score']
                
                print(f"\r⏱️  {timestamp:6.1f}s | "
                      f"😊 {emotion.upper():8s} ({confidence:.2f}) | "
                      f"😰 Stress: {stress:.2f} | "
                      f"😟 Anxiety: {anxiety:.2f} | "
                      f"💡 Engage: {engagement:.2f} | "
                      f"🎯 Frame: {frame_count:4d}", 
                      end='', flush=True)
                
                # Draw on frame
                h, w = frame.shape[:2]
                
                # Emotion text
                cv2.putText(frame, f"Emotion: {emotion.upper()}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (0, 255, 0), 2)
                
                cv2.putText(frame, f"Confidence: {confidence:.2f}", 
                           (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (0, 255, 0), 1)
                
                # Stress bar
                cv2.rectangle(frame, (10, 80), (10 + int(stress * 200), 100), 
                             (0, 0, 255), -1)
                cv2.putText(frame, f"Stress: {stress:.2f}", 
                           (220, 95), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (255, 255, 255), 1)
                
                # Anxiety bar
                cv2.rectangle(frame, (10, 110), (10 + int(anxiety * 200), 130), 
                             (0, 165, 255), -1)
                cv2.putText(frame, f"Anxiety: {anxiety:.2f}", 
                           (220, 125), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (255, 255, 255), 1)
                
                # Engagement bar
                cv2.rectangle(frame, (10, 140), (10 + int(engagement * 200), 160), 
                             (0, 255, 0), -1)
                cv2.putText(frame, f"Engagement: {engagement:.2f}", 
                           (220, 155), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (255, 255, 255), 1)
                
                # Micro-expressions
                y_pos = 180
                for name, data in result['micro_expressions'].items():
                    if data.get('detected'):
                        intensity = data.get('intensity', 0)
                        cv2.putText(frame, f"{name}: {intensity:.2f}", 
                                   (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 
                                   0.4, (255, 255, 0), 1)
                        y_pos += 20
                
                frame_count += 1
            else:
                print(f"\r⏱️  {timestamp:6.1f}s | ❌ No face detected", 
                      end='', flush=True)
                
                cv2.putText(frame, "No face detected", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (0, 0, 255), 2)
            
            # Show frame
            cv2.imshow('Emotion Detection Test', frame)
            
            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\n\n🛑 Stopping...")
                break
            
            # Maintain FPS
            elapsed = time.time() - loop_start
            if elapsed < frame_interval:
                time.sleep(frame_interval - elapsed)
    
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        # Generate summary
        print("\n")
        print("=" * 60)
        print("📊 Session Summary")
        print("=" * 60)
        
        summary = pipeline.generate_session_summary()
        
        if summary:
            print(f"Duration: {summary['duration_seconds']:.1f} seconds")
            print(f"Frames analyzed: {summary['total_frames_analyzed']}")
            print(f"Average FPS: {summary['total_frames_analyzed'] / summary['duration_seconds']:.1f}")
            print()
            print("Emotion Distribution:")
            for emotion, percentage in summary['emotion_distribution'].items():
                bar = '█' * int(percentage * 50)
                print(f"  {emotion:10s}: {bar} {percentage*100:.1f}%")
            print()
            print(f"Average Stress: {summary['avg_stress_score']:.2f}")
            print(f"Average Anxiety: {summary['avg_anxiety_score']:.2f}")
            print(f"Average Engagement: {summary['avg_engagement_score']:.2f}")
            print(f"Predominant Emotion: {summary['predominant_emotion']}")
        else:
            print("No data collected")
        
        print()
        print("✅ Test completed!")


if __name__ == "__main__":
    test_webcam_emotion_detection()
