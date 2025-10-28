"""
Test script for automatic note generation from session transcripts
"""
from services.transcription_service import MockTranscriptionService
from services.summary_service import MockSummaryService

def test_auto_note_generation():
    """Test the automatic note generation process"""
    
    print("=" * 80)
    print("TESTING AUTOMATIC NOTE GENERATION")
    print("=" * 80)
    print()
    
    # Simulate transcription data from a therapy session
    mock_transcription_data = [
        {'start': 0, 'text': 'Hello, how are you feeling today?'},
        {'start': 5, 'text': 'I have been feeling quite anxious lately, especially about work.'},
        {'start': 15, 'text': 'Can you tell me more about what specifically is making you anxious?'},
        {'start': 22, 'text': 'Well, I have a big presentation coming up and I am worried I will mess it up.'},
        {'start': 30, 'text': 'That sounds stressful. Have you had similar experiences before?'},
        {'start': 37, 'text': 'Yes, last year I had a panic attack before a presentation.'},
        {'start': 45, 'text': 'I understand. Let us talk about some coping strategies we can use.'},
        {'start': 52, 'text': 'I have been trying the breathing exercises you taught me.'},
        {'start': 58, 'text': 'That is great! How have they been working for you?'},
        {'start': 63, 'text': 'They help a little, but I still feel overwhelmed sometimes.'},
        {'start': 70, 'text': 'That is completely normal. Let us work on building more tools for your toolkit.'},
        {'start': 78, 'text': 'I would like that. I want to feel more confident.'},
        {'start': 85, 'text': 'We will get there together. For this week, I want you to practice the breathing exercises daily.'},
        {'start': 95, 'text': 'Okay, I can do that. Thank you for your help.'}
    ]
    
    print("1. INITIALIZING SERVICES")
    print("-" * 80)
    transcription_service = MockTranscriptionService()
    summary_service = MockSummaryService()
    print("✓ Transcription service initialized")
    print("✓ Summary service initialized")
    print()
    
    print("2. FORMATTING TRANSCRIPT")
    print("-" * 80)
    transcript_text = transcription_service.format_transcript(mock_transcription_data)
    print(transcript_text)
    print()
    
    print("3. GENERATING AI SUMMARY")
    print("-" * 80)
    summary_result = summary_service.generate_session_summary(
        transcript=transcript_text,
        session_type='individual',
        client_name='John Doe'
    )
    
    if summary_result['success']:
        print("✓ Summary generated successfully")
        print()
        print(summary_result['summary'])
        print()
        print(f"Model used: {summary_result['model']}")
        print(f"Tokens used: {summary_result['tokens_used']}")
    else:
        print(f"✗ Summary generation failed: {summary_result['error']}")
    print()
    
    print("4. EXTRACTING KEY POINTS")
    print("-" * 80)
    key_points_result = summary_service.extract_key_points(transcript_text)
    
    if key_points_result['success']:
        print("✓ Key points extracted successfully")
        print()
        key_points = key_points_result['key_points']
        
        print("Main Topics:")
        for topic in key_points.get('main_topics', []):
            print(f"  • {topic}")
        print()
        
        print("Emotions Identified:")
        for emotion in key_points.get('emotions_identified', []):
            print(f"  • {emotion}")
        print()
        
        print("Action Items:")
        for item in key_points.get('action_items', []):
            print(f"  • {item}")
        print()
        
        print(f"Progress Notes: {key_points.get('progress_notes')}")
        print()
        print(f"Next Session Focus: {key_points.get('next_session_focus')}")
    else:
        print(f"✗ Key point extraction failed: {key_points_result['error']}")
    print()
    
    print("5. CREATING FINAL NOTE CONTENT")
    print("-" * 80)
    
    note_content = f"""# Session Notes - October 28, 2025

## AI-Generated Summary
{summary_result['summary']}

---

## Full Transcript
{transcript_text}

---

## Key Points

**Main Topics:**
{chr(10).join([f'- {topic}' for topic in key_points.get('main_topics', [])])}

**Emotions Identified:**
{chr(10).join([f'- {emotion}' for emotion in key_points.get('emotions_identified', [])])}

**Action Items:**
{chr(10).join([f'- {item}' for item in key_points.get('action_items', [])])}

**Next Session Focus:**
{key_points.get('next_session_focus', 'To be determined')}
"""
    
    print("✓ Final note content created")
    print()
    print(note_content)
    print()
    
    print("=" * 80)
    print("TEST COMPLETED SUCCESSFULLY")
    print("=" * 80)
    print()
    print("Summary:")
    print("• Transcription data was formatted successfully")
    print("• AI summary was generated from the transcript")
    print("• Key points were extracted (topics, emotions, action items)")
    print("• Complete note was assembled with all components")
    print()
    print("This note would be automatically saved to the database when a session ends.")
    print()

if __name__ == '__main__':
    test_auto_note_generation()
