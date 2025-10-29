"""
PDF Export Service
Generates professional PDF reports from session notes
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from datetime import datetime
import io

class PDFExportService:
    """Service for exporting session notes to PDF"""
    
    def __init__(self):
        """Initialize PDF export service"""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#3b82f6'),
            spaceBefore=20,
            spaceAfter=12,
            fontName='Helvetica-Bold',
            borderWidth=2,
            borderColor=HexColor('#3b82f6'),
            borderPadding=5,
            backColor=HexColor('#eff6ff')
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='BodyJustify',
            parent=self.styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
            leading=16
        ))
        
        # Timestamp style
        self.styles.add(ParagraphStyle(
            name='Timestamp',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=HexColor('#6b7280'),
            fontName='Courier'
        ))
    
    def generate_session_pdf(self, note_data: dict) -> bytes:
        """
        Generate PDF from session note data
        
        Args:
            note_data: Dictionary containing note information
            
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        story = []
        
        # Title
        title = note_data.get('title', 'Session Notes')
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        
        # Metadata table
        session_date = note_data.get('session_date', 'Unknown')
        if isinstance(session_date, str):
            try:
                session_date = datetime.fromisoformat(session_date.replace('Z', '+00:00'))
                session_date = session_date.strftime('%B %d, %Y at %I:%M %p')
            except:
                pass
        
        client_name = note_data.get('client_id', {}).get('name', 'Unknown') if isinstance(note_data.get('client_id'), dict) else 'Unknown'
        
        metadata = [
            ['Session Date:', str(session_date)],
            ['Client:', client_name],
            ['Note Type:', note_data.get('note_type', 'clinical').title()],
            ['Created:', datetime.fromisoformat(note_data['created_at'].replace('Z', '+00:00')).strftime('%B %d, %Y')]
        ]
        
        t = Table(metadata, colWidths=[2*inch, 4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#374151')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3 * inch))
        
        # AI Summary Section
        if note_data.get('ai_summary'):
            story.append(Paragraph('AI-Generated Clinical Summary', self.styles['SectionHeader']))
            story.append(Spacer(1, 0.1 * inch))
            
            # Format summary with markdown-like parsing
            summary_text = self._format_summary(note_data['ai_summary'])
            for para in summary_text:
                story.append(para)
                story.append(Spacer(1, 0.1 * inch))
        
        # Action Items Section
        if note_data.get('action_items'):
            story.append(Spacer(1, 0.2 * inch))
            story.append(Paragraph('Action Items & Recommendations', self.styles['SectionHeader']))
            story.append(Spacer(1, 0.1 * inch))
            
            action_items = note_data['action_items']
            if isinstance(action_items, list):
                for item in action_items:
                    bullet = Paragraph(f'• {item}', self.styles['BodyJustify'])
                    story.append(bullet)
            else:
                story.append(Paragraph(action_items, self.styles['BodyJustify']))
        
        # Full Transcript Section
        if note_data.get('transcript'):
            story.append(PageBreak())
            story.append(Paragraph('Complete Session Transcript', self.styles['SectionHeader']))
            story.append(Spacer(1, 0.1 * inch))
            
            transcript = note_data['transcript']
            if isinstance(transcript, list):
                for segment in transcript:
                    timestamp = segment.get('start', 0)
                    speaker = segment.get('speaker', 'Speaker')
                    text = segment.get('text', '')
                    
                    # Format timestamp
                    minutes = int(timestamp // 60)
                    seconds = int(timestamp % 60)
                    time_str = f"[{minutes:02d}:{seconds:02d}]"
                    
                    # Add timestamp and speaker
                    story.append(Paragraph(
                        f'<b>{time_str} {speaker}:</b>',
                        self.styles['Timestamp']
                    ))
                    story.append(Paragraph(text, self.styles['BodyJustify']))
                    story.append(Spacer(1, 0.05 * inch))
            else:
                # Text transcript
                story.append(Paragraph(transcript, self.styles['BodyJustify']))
        
        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | TherapyHub Session Notes"
        story.append(Paragraph(
            footer_text,
            ParagraphStyle(
                'Footer',
                parent=self.styles['Normal'],
                fontSize=8,
                textColor=HexColor('#9ca3af'),
                alignment=TA_CENTER
            )
        ))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF bytes
        buffer.seek(0)
        return buffer.getvalue()
    
    def _format_summary(self, summary_text: str) -> list:
        """Format summary text into styled paragraphs with full markdown support"""
        paragraphs = []
        lines = summary_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for headers (lines with ** markers or ##)
            if line.startswith('**') and line.endswith('**') and line.count('**') == 2:
                # Bold header (entire line is wrapped in **)
                text = line.strip('*')
                paragraphs.append(Paragraph(
                    f'<b>{self._escape_html(text)}</b>',
                    ParagraphStyle(
                        'BoldHeader',
                        parent=self.styles['BodyText'],
                        fontSize=12,
                        textColor=HexColor('#1f2937'),
                        spaceBefore=10,
                        spaceAfter=5,
                        fontName='Helvetica-Bold'
                    )
                ))
            elif line.startswith('##'):
                # Markdown header
                text = line.lstrip('#').strip()
                paragraphs.append(Paragraph(
                    f'<b>{self._escape_html(text)}</b>',
                    ParagraphStyle(
                        'BoldHeader',
                        parent=self.styles['BodyText'],
                        fontSize=12,
                        textColor=HexColor('#1f2937'),
                        spaceBefore=10,
                        spaceAfter=5,
                        fontName='Helvetica-Bold'
                    )
                ))
            elif line.startswith('* '):
                # Bullet point (with space after asterisk)
                text = line[2:].strip()  # Remove '* '
                formatted_text = self._convert_markdown_to_html(text)
                paragraphs.append(Paragraph(f'• {formatted_text}', self.styles['BodyJustify']))
            elif line.startswith('-') or line.startswith('•'):
                # Bullet point (with dash or bullet)
                text = line.lstrip('-•').strip()
                formatted_text = self._convert_markdown_to_html(text)
                paragraphs.append(Paragraph(f'• {formatted_text}', self.styles['BodyJustify']))
            else:
                # Regular paragraph - convert inline markdown
                formatted_text = self._convert_markdown_to_html(line)
                paragraphs.append(Paragraph(formatted_text, self.styles['BodyJustify']))
        
        return paragraphs
    
    def _convert_markdown_to_html(self, text: str) -> str:
        """Convert markdown formatting to HTML for ReportLab"""
        import re
        
        # First escape existing HTML special characters in the text content
        # But we need to be careful - escape them, then add our HTML tags
        
        # Convert ⭐ emoji to star symbol
        text = text.replace('⭐', '★')
        
        # Convert **bold** to <b>bold</b> - using temp placeholders
        text = re.sub(r'\*\*(.+?)\*\*', r'<<<BOLD_START>>>\1<<<BOLD_END>>>', text)
        
        # Convert remaining *italic* to <i>italic</i>
        text = re.sub(r'\*(.+?)\*', r'<<<ITALIC_START>>>\1<<<ITALIC_END>>>', text)
        
        # Now escape HTML special characters in the actual text
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        
        # Now replace our placeholders with actual HTML tags
        text = text.replace('<<<BOLD_START>>>', '<b>')
        text = text.replace('<<<BOLD_END>>>', '</b>')
        text = text.replace('<<<ITALIC_START>>>', '<i>')
        text = text.replace('<<<ITALIC_END>>>', '</i>')
        
        return text
    
    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters"""
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        return text
