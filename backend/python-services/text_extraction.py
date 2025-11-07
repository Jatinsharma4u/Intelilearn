# -*- coding: utf-8 -*-
import os
import fitz  # PyMuPDF
from docx import Document
from pptx import Presentation
import PyPDF2
import chardet
import re
from collections import defaultdict, Counter
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import spacy

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

# Try to load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

def extract_text_from_file(file_path, file_type):
    """
    Enhanced text extraction with structure detection
    """
    try:
        print(f"🔍 Extracting text from: {file_path}")
        
        if file_type == 'application/pdf':
            return extract_from_pdf_enhanced(file_path)
        elif file_type in ['application/vnd.ms-powerpoint', 
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
            return extract_from_ppt_enhanced(file_path)
        elif file_type in ['application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return extract_from_docx_enhanced(file_path)
        elif file_type == 'text/plain':
            return extract_from_txt_enhanced(file_path)
        else:
            # Try to determine file type from extension
            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.pdf':
                return extract_from_pdf_enhanced(file_path)
            elif ext in ['.ppt', '.pptx']:
                return extract_from_ppt_enhanced(file_path)
            elif ext in ['.doc', '.docx']:
                return extract_from_docx_enhanced(file_path)
            elif ext == '.txt':
                return extract_from_txt_enhanced(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        print(f"❌ Extraction error: {str(e)}")
        raise Exception(f"Error extracting text from {file_path}: {str(e)}")

def extract_from_pdf_enhanced(file_path):
    """Enhanced PDF extraction with structure detection"""
    try:
        text = ""
        headings = []
        content_blocks = []
        
        # Method 1: PyMuPDF for better structure
        try:
            doc = fitz.open(file_path)
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # Extract text with formatting info
                blocks = page.get_text("dict")["blocks"]
                
                for block in blocks:
                    if "lines" in block:
                        for line in block["lines"]:
                            for span in line["spans"]:
                                text_content = span["text"].strip()
                                if text_content:
                                    font_size = span["size"]
                                    is_bold = "bold" in span["font"].lower()
                                    
                                    # Detect headings based on font size and style
                                    if font_size > 12 or is_bold:
                                        if len(text_content) < 200:  # Reasonable heading length
                                            headings.append({
                                                'text': text_content,
                                                'page': page_num + 1,
                                                'type': 'heading',
                                                'level': determine_heading_level(font_size, is_bold)
                                            })
                                    
                                    text += text_content + " "
                
                text += "\n\n"  # Page separator
            
            doc.close()
            
        except Exception as e:
            print(f"PyMuPDF structure extraction failed: {e}")
            # Fallback to simple text extraction
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text() + "\n\n"
            doc.close()
        
        # Process extracted text
        processed_data = process_extracted_text(text, headings, 'pdf')
        return processed_data
        
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")

def extract_from_ppt_enhanced(file_path):
    """Enhanced PPT extraction with slide structure"""
    try:
        presentation = Presentation(file_path)
        text = ""
        slides_data = []
        
        for slide_num, slide in enumerate(presentation.slides):
            slide_content = {
                'number': slide_num + 1,
                'title': '',
                'content': [],
                'type': 'slide'
            }
            
            # Extract title
            if slide.shapes.title:
                title_text = slide.shapes.title.text.strip()
                slide_content['title'] = title_text
                text += f"# {title_text}\n\n"
            
            # Extract content from shapes
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    shape_text = shape.text.strip()
                    if shape != slide.shapes.title and shape_text:
                        # Determine content type based on text characteristics
                        content_type = determine_content_type(shape_text)
                        slide_content['content'].append({
                            'text': shape_text,
                            'type': content_type
                        })
                        text += f"{shape_text}\n"
            
            slides_data.append(slide_content)
            text += "\n---\n\n"
        
        processed_data = process_extracted_text(text, slides_data, 'presentation')
        return processed_data
        
    except Exception as e:
        raise Exception(f"PPT extraction failed: {str(e)}")

def extract_from_docx_enhanced(file_path):
    """Enhanced DOCX extraction with document structure"""
    try:
        doc = Document(file_path)
        text = ""
        structure = []
        
        for paragraph in doc.paragraphs:
            para_text = paragraph.text.strip()
            if para_text:
                # Detect heading styles
                if paragraph.style.name.startswith('Heading'):
                    level = int(paragraph.style.name.split()[-1]) if paragraph.style.name.split()[-1].isdigit() else 1
                    structure.append({
                        'text': para_text,
                        'type': 'heading',
                        'level': level
                    })
                    text += f"\n{'#' * level} {para_text}\n\n"
                else:
                    structure.append({
                        'text': para_text,
                        'type': 'paragraph'
                    })
                    text += para_text + "\n"
        
        # Extract tables
        for table in doc.tables:
            table_data = []
            for row in table.rows:
                row_data = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_data.append(cell_text)
                if row_data:
                    table_data.append(row_data)
                    text += " | ".join(row_data) + "\n"
            
            if table_data:
                structure.append({
                    'type': 'table',
                    'data': table_data
                })
            text += "\n"
        
        processed_data = process_extracted_text(text, structure, 'document')
        return processed_data
        
    except Exception as e:
        raise Exception(f"DOCX extraction failed: {str(e)}")

def extract_from_txt_enhanced(file_path):
    """Enhanced text file extraction with structure detection"""
    try:
        # Detect encoding
        with open(file_path, 'rb') as file:
            raw_data = file.read()
            encoding = chardet.detect(raw_data)['encoding'] or 'utf-8'
        
        # Read with detected encoding
        with open(file_path, 'r', encoding=encoding, errors='replace') as file:
            content = file.read()
        
        # Detect structure in text file
        lines = content.split('\n')
        structure = []
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line:
                # Detect headings (lines in uppercase, with colons, or numbered)
                if (line.isupper() and len(line) < 100) or \
                   (':' in line and len(line) < 150) or \
                   re.match(r'^(#+|\d+\.)\s', line):
                    
                    if current_section:
                        structure.append(current_section)
                    
                    current_section = {
                        'heading': line,
                        'content': [],
                        'type': 'section'
                    }
                elif current_section:
                    current_section['content'].append(line)
                else:
                    # Content without heading
                    structure.append({
                        'type': 'paragraph',
                        'text': line
                    })
        
        if current_section:
            structure.append(current_section)
        
        processed_data = process_extracted_text(content, structure, 'text')
        return processed_data
        
    except Exception as e:
        raise Exception(f"Text file extraction failed: {str(e)}")

def process_extracted_text(raw_text, structure, file_type):
    """Process and analyze extracted text"""
    
    # Clean and normalize text
    cleaned_text = clean_text(raw_text)
    
    # Extract key information
    key_topics = extract_key_topics(cleaned_text)
    keywords = extract_keywords(cleaned_text)
    sentences = sent_tokenize(cleaned_text)
    
    # Enhanced content analysis
    content_analysis = analyze_content_depth(cleaned_text)
    
    return {
        'raw_text': raw_text,
        'cleaned_text': cleaned_text,
        'structure': structure,
        'file_type': file_type,
        'analysis': {
            'key_topics': key_topics,
            'keywords': keywords[:50],  # Top 50 keywords
            'sentence_count': len(sentences),
            'word_count': len(word_tokenize(cleaned_text)),
            'estimated_reading_time': len(sentences) // 3,  # ~3 sentences per minute
            'content_quality': content_analysis['content_quality'],
            'key_concepts': content_analysis['key_concepts']
        },
        'metadata': {
            'extraction_time': '2024-01-01T00:00:00Z',
            'processing_level': 'enhanced'
        }
    }

def clean_text(text):
    """Clean and normalize text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\-\:\;\(\)]', '', text)
    return text.strip()

def extract_key_topics(text):
    """Extract main topics from text"""
    # Simple topic extraction based on frequency and position
    sentences = sent_tokenize(text)
    words = word_tokenize(text.lower())
    
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
    
    # Get word frequencies
    word_freq = defaultdict(int)
    for word in filtered_words:
        if len(word) > 3:  # Only consider words longer than 3 characters
            word_freq[word] += 1
    
    # Get top topics
    topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    return [topic[0] for topic in topics]

def extract_keywords(text):
    """Extract keywords using multiple methods"""
    words = word_tokenize(text.lower())
    stop_words = set(stopwords.words('english'))
    
    # Method 1: Frequency-based
    word_freq = defaultdict(int)
    for word in words:
        if word.isalnum() and word not in stop_words and len(word) > 2:
            word_freq[word] += 1
    
    # Method 2: Position-based (words in headings/titles)
    heading_words = set()
    for sentence in sent_tokenize(text):
        if any(indicator in sentence.lower() for indicator in ['introduction', 'chapter', 'section', 'topic']):
            heading_words.update([word for word in word_tokenize(sentence.lower()) if word.isalnum()])
    
    # Combine methods
    keywords = set()
    for word, freq in word_freq.items():
        if freq >= 2 or word in heading_words:  # Appears at least twice or in heading
            keywords.add(word)
    
    return list(keywords)[:20]

def determine_heading_level(font_size, is_bold):
    """Determine heading level based on font characteristics"""
    if font_size > 20:
        return 1
    elif font_size > 16:
        return 2
    elif font_size > 14:
        return 3
    elif font_size > 12:
        return 4
    else:
        return 5

def determine_content_type(text):
    """Determine the type of content"""
    text_lower = text.lower()
    
    if len(text.split()) <= 10:
        return 'bullet_point'
    elif any(keyword in text_lower for keyword in ['example:', 'for example', 'e.g.']):
        return 'example'
    elif any(keyword in text_lower for keyword in ['definition', 'defined as', 'means']):
        return 'definition'
    elif text_lower.endswith('?'):
        return 'question'
    else:
        return 'paragraph'

def analyze_content_depth(text):
    """
    Analyze content depth and quality for better course generation
    """
    try:
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        words = text.split()
        
        if len(words) == 0:
            return {
                'content_quality': 'low',
                'key_concepts': [],
                'word_count': 0,
                'sentence_count': 0,
                'avg_sentence_length': 0,
                'lexical_diversity': 0
            }
        
        # Calculate basic metrics
        avg_sentence_length = len(words) / len(sentences) if sentences else 0
        unique_words = len(set(words))
        lexical_diversity = unique_words / len(words) if words else 0
        
        # Extract potential key concepts
        key_concepts = extract_potential_concepts(text)
        
        # Determine content quality based on multiple factors
        quality_score = 0
        
        # Word count factor
        if len(words) > 2000:
            quality_score += 3
        elif len(words) > 1000:
            quality_score += 2
        elif len(words) > 500:
            quality_score += 1
        
        # Sentence complexity factor
        if avg_sentence_length > 15:
            quality_score += 2
        elif avg_sentence_length > 10:
            quality_score += 1
        
        # Lexical diversity factor
        if lexical_diversity > 0.6:
            quality_score += 2
        elif lexical_diversity > 0.4:
            quality_score += 1
        
        # Key concepts factor
        if len(key_concepts) > 10:
            quality_score += 2
        elif len(key_concepts) > 5:
            quality_score += 1
        
        # Determine final quality
        if quality_score >= 7:
            content_quality = 'high'
        elif quality_score >= 4:
            content_quality = 'medium'
        else:
            content_quality = 'low'
        
        return {
            'content_quality': content_quality,
            'key_concepts': key_concepts[:15],
            'word_count': len(words),
            'sentence_count': len(sentences),
            'avg_sentence_length': avg_sentence_length,
            'lexical_diversity': lexical_diversity,
            'quality_score': quality_score
        }
        
    except Exception as e:
        print(f"❌ Content analysis error: {e}")
        return {
            'content_quality': 'medium',
            'key_concepts': [],
            'word_count': 0,
            'sentence_count': 0,
            'avg_sentence_length': 0,
            'lexical_diversity': 0,
            'quality_score': 0
        }

def extract_potential_concepts(text):
    """
    Extract potential key concepts from text using multiple methods
    """
    try:
        concepts = []
        text_lower = text.lower()
        
        # Method 1: Extract capitalized phrases (potential proper nouns/concepts)
        sentences = sent_tokenize(text)
        for sentence in sentences:
            words = sentence.split()
            for i, word in enumerate(words):
                # Look for capitalized words that are not at sentence start
                if (word.istitle() and len(word) > 3 and 
                    i > 0 and not words[i-1].endswith(('.', '!', '?'))):
                    concepts.append(word.strip(' ,.!?;:'))
        
        # Method 2: Extract phrases in quotes or brackets
        quoted_concepts = re.findall(r'["\"]([^"\"]+)["\"]', text)
        bracketed_concepts = re.findall(r'[\(\[{]([^\)\]}]+)[\)\]}]', text)
        concepts.extend(quoted_concepts)
        concepts.extend(bracketed_concepts)
        
        # Method 3: Extract phrases following "term:", "concept:", etc.
        pattern_concepts = re.findall(r'(?:term|concept|topic|definition|principle)[:\s]+([^\.!?]+)', text_lower)
        concepts.extend([c.strip().title() for c in pattern_concepts])
        
        # Method 4: Extract noun phrases using simple pattern matching
        # Look for sequences of adjectives and nouns
        words = word_tokenize(text)
        pos_tags = nltk.pos_tag(words) if nltk else []
        
        noun_phrases = []
        current_phrase = []
        
        for word, pos in pos_tags:
            if pos.startswith('NN') or pos.startswith('JJ'):
                current_phrase.append(word)
            else:
                if len(current_phrase) >= 2:  # At least 2 words for a phrase
                    noun_phrases.append(' '.join(current_phrase))
                current_phrase = []
        
        if len(current_phrase) >= 2:
            noun_phrases.append(' '.join(current_phrase))
        
        concepts.extend(noun_phrases)
        
        # Clean and filter concepts
        cleaned_concepts = []
        for concept in concepts:
            if concept and len(concept) > 3 and len(concept) < 50:
                # Remove common stopwords from concepts
                concept_words = concept.split()
                filtered_words = [w for w in concept_words if w.lower() not in stopwords.words('english')]
                if filtered_words:
                    cleaned_concept = ' '.join(filtered_words)
                    cleaned_concepts.append(cleaned_concept.title())
        
        # Remove duplicates and get most common
        concept_counts = Counter(cleaned_concepts)
        most_common = [concept for concept, count in concept_counts.most_common(20)]
        
        return most_common
        
    except Exception as e:
        print(f"❌ Concept extraction error: {e}")
        # Fallback: extract words that appear frequently
        words = [word for word in text.split() if len(word) > 4 and word[0].isupper()]
        return list(set(words))[:10]

def extract_structured_headings(text):
    """
    Extract structured headings and sections from text
    """
    try:
        lines = text.split('\n')
        structure = []
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect headings based on patterns
            is_heading = False
            level = 1
            
            # Pattern 1: Lines with # markers (Markdown)
            if line.startswith('#'):
                is_heading = True
                level = line.count('#', 0, 6)  # Max level 6
                line = line.lstrip('#').strip()
            
            # Pattern 2: UPPERCASE lines (common in documents)
            elif line.isupper() and len(line) < 100:
                is_heading = True
                level = 1 if len(line) < 50 else 2
            
            # Pattern 3: Numbered headings (1., 1.1, etc.)
            elif re.match(r'^\d+\.', line):
                is_heading = True
                level = 2
            
            # Pattern 4: Lines ending with colon
            elif line.endswith(':') and len(line) < 80:
                is_heading = True
                level = 3
            
            if is_heading:
                if current_section:
                    structure.append(current_section)
                
                current_section = {
                    'heading': line,
                    'level': level,
                    'content': [],
                    'type': 'section'
                }
            elif current_section:
                current_section['content'].append(line)
            else:
                # Content without heading
                structure.append({
                    'type': 'paragraph',
                    'text': line
                })
        
        if current_section:
            structure.append(current_section)
        
        return structure
        
    except Exception as e:
        print(f"❌ Structure extraction error: {e}")
        return []

def calculate_content_metrics(text):
    """
    Calculate comprehensive content metrics for course planning
    """
    try:
        sentences = sent_tokenize(text)
        words = word_tokenize(text.lower())
        
        if not words:
            return {
                'total_words': 0,
                'total_sentences': 0,
                'total_paragraphs': 0,
                'avg_sentence_length': 0,
                'avg_word_length': 0,
                'reading_level': 'basic',
                'estimated_study_hours': 0
            }
        
        # Basic metrics
        total_words = len(words)
        total_sentences = len(sentences)
        total_paragraphs = len([p for p in text.split('\n\n') if p.strip()])
        avg_sentence_length = total_words / total_sentences
        avg_word_length = sum(len(word) for word in words) / total_words
        
        # Calculate reading level (simplified)
        complex_word_count = sum(1 for word in words if len(word) > 6)
        complex_word_ratio = complex_word_count / total_words
        
        if complex_word_ratio > 0.2:
            reading_level = 'advanced'
        elif complex_word_ratio > 0.1:
            reading_level = 'intermediate'
        else:
            reading_level = 'basic'
        
        # Estimate study hours (simplified)
        # Assuming 100 words per minute reading + comprehension time
        reading_time_minutes = total_words / 100
        study_time_multiplier = 3  # 3x reading time for full study
        estimated_study_hours = (reading_time_minutes * study_time_multiplier) / 60
        
        return {
            'total_words': total_words,
            'total_sentences': total_sentences,
            'total_paragraphs': total_paragraphs,
            'avg_sentence_length': avg_sentence_length,
            'avg_word_length': avg_word_length,
            'reading_level': reading_level,
            'complex_word_ratio': complex_word_ratio,
            'estimated_study_hours': round(estimated_study_hours, 1)
        }
        
    except Exception as e:
        print(f"❌ Content metrics error: {e}")
        return {
            'total_words': 0,
            'total_sentences': 0,
            'total_paragraphs': 0,
            'avg_sentence_length': 0,
            'avg_word_length': 0,
            'reading_level': 'basic',
            'estimated_study_hours': 0
        }

# Test function
if __name__ == "__main__":
    # Test with a sample file
    test_file = "sample.pdf"  # Replace with actual test file
    if os.path.exists(test_file):
        result = extract_text_from_file(test_file, "application/pdf")
        print("Extraction successful!")
        print(f"Key topics: {result['analysis']['key_topics']}")
        print(f"Keywords: {result['analysis']['keywords'][:10]}")
        print(f"Content quality: {result['analysis']['content_quality']}")
        print(f"Key concepts: {result['analysis']['key_concepts'][:5]}")
    else:
        # Test with sample text
        sample_text = """
        Artificial Intelligence and Machine Learning are transforming modern technology. 
        Deep Learning algorithms use neural networks for complex pattern recognition. 
        Natural Language Processing enables computers to understand human language.
        
        Key Concepts:
        - Neural Networks: Computational models inspired by human brain
        - Backpropagation: Algorithm for training neural networks
        - Convolutional Neural Networks (CNNs): Specialized for image processing
        - Recurrent Neural Networks (RNNs): Designed for sequential data
        
        Applications include computer vision, speech recognition, and autonomous vehicles.
        """
        
        analysis = analyze_content_depth(sample_text)
        print("Content Analysis Results:")
        print(f"Quality: {analysis['content_quality']}")
        print(f"Key Concepts: {analysis['key_concepts']}")
        print(f"Word Count: {analysis['word_count']}")
        print(f"Lexical Diversity: {analysis['lexical_diversity']:.2f}")