"""
Test script to verify note generation with Gemini
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.summary_service import SummaryService
from dotenv import load_dotenv

load_dotenv()

# Sample transcript
sample_transcript = """[00:00] Therapist: Hello, welcome. How have you been feeling this week?
[00:15] Client: Not great, honestly. I've been having a lot of anxiety about work.
[00:30] Therapist: Tell me more about that. What specifically is causing the anxiety?
[00:45] Client: My boss keeps adding more tasks and the deadlines are impossible. I can't sleep.
[01:05] Therapist: That sounds very stressful. How is this affecting your sleep patterns?
[01:20] Client: I'm only getting like 3-4 hours a night. I keep waking up thinking about work.
[01:40] Therapist: Have you tried any of the relaxation techniques we discussed last time?
[01:55] Client: I tried the breathing exercises a couple times, but I forget when I'm stressed.
[02:15] Therapist: That's understandable. Let's practice setting up a routine for those exercises.
[02:35] Client: Okay, that might help. I just feel so overwhelmed all the time.
[02:50] Therapist: We'll work on developing better coping strategies together."""

print("Testing Gemini-based Note Generation")
print("=" * 60)

# Check if API key is configured
gemini_key = os.environ.get('GEMINI_API_KEY')
if not gemini_key or gemini_key == 'your-gemini-api-key-here':
    print("❌ GEMINI_API_KEY not configured properly!")
    print("Please add your real Gemini API key to .env file")
    exit(1)

print(f"✓ Gemini API Key found: {gemini_key[:20]}...")

# Initialize service
print("\nInitializing Summary Service...")
service = SummaryService()

if not service.is_available():
    print("❌ Summary service not available!")
    exit(1)

print(f"✓ Using provider: {service.provider}")

# Generate summary
print("\nGenerating clinical notes from sample transcript...")
print(f"Transcript length: {len(sample_transcript)} characters\n")

result = service.generate_session_summary(
    transcript=sample_transcript,
    session_type="individual",
    client_name="John Doe"
)

print("-" * 60)
if result['success']:
    print("✅ SUCCESS! Generated notes:\n")
    print(result['summary'])
    print("\n" + "-" * 60)
    print(f"Model: {result.get('model', 'N/A')}")
    print(f"Provider: {result.get('provider', 'N/A')}")
else:
    print("❌ FAILED!")
    print(f"Error: {result.get('error', 'Unknown error')}")

print("=" * 60)
