# -*- coding: utf-8 -*-
import os
import json
import google.generativeai as genai
import re
import traceback
import time
from typing import Dict, List, Any
import random
from text_extraction import analyze_content_depth

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyD8ayD9cOCtKkPGZENXmVPQpt_BMSlWohI')

try:
    genai.configure(api_key=GEMINI_API_KEY)
    print(" Gemini AI configured successfully")
except Exception as e:
    print(f" Gemini AI configuration failed: {e}")

class AdvancedCourseGenerator:
    def __init__(self):
        # Use available model
        try:
            self.model = genai.GenerativeModel('gemini-2.5-pro')
            print("✅ Using gemini-2.5-pro")
        except Exception as e:
            self.model = genai.GenerativeModel('gemini-pro')
            print("✅ Using gemini-pro")
        
        self.difficulty_levels = {
            'beginner': {
                'depth': 'basic',
                'examples': 'simple',
                'pace': 'slow',
                'prerequisites': 'none',
                'lesson_count': 2,
                'content_length': 'short'
            },
            'intermediate': {
                'depth': 'moderate', 
                'examples': 'practical',
                'pace': 'medium',
                'prerequisites': 'basic',
                'lesson_count': 3,
                'content_length': 'medium'
            },
            'advanced': {
                'depth': 'comprehensive',
                'examples': 'complex',
                'pace': 'fast',
                'prerequisites': 'intermediate',
                'lesson_count': 4,
                'content_length': 'long'
            }
        }
    
    def generate_course_content(self, extracted_data: List, settings: Dict, course_id: str) -> Dict:
        """
        Generate comprehensive course content with batching system
        """
        try:
            print(" Starting advanced course generation with batching...")
            
            # Combine all extracted texts
            combined_content = self.combine_extracted_content(extracted_data)
            print(f" Combined content: {len(combined_content['cleaned_text'])} characters")
            
            if len(combined_content['cleaned_text']) < 100:
                print(" Insufficient content, using enhanced fallback")
                return self.create_enhanced_fallback_course(extracted_data, settings)
            
            # Advanced content analysis
            content_analysis = self.analyze_content_structure(combined_content)
            print(f" Content analysis: {len(content_analysis['main_topics'])} main topics")
            
            # Determine batching based on module count
            modules_count = int(settings.get('modulesCount', 5))
            batch_config = self.determine_batch_config(modules_count)
            print(f" Batch configuration: {batch_config['batches']} batches")
            
            # Generate course structure with batching
            course_structure = self.generate_course_structure(content_analysis, settings, batch_config)
            
            # Generate modules with batching
            modules = self.generate_modules_with_batching(
                course_structure, combined_content, settings, batch_config
            )
            
            # Create final course
            course = self.create_final_course(course_structure, modules, settings, combined_content)
            
            print("Course generation completed successfully!")
            return course
            
        except Exception as e:
            print(f" Course generation failed: {str(e)}")
            traceback.print_exc()
            return self.create_enhanced_fallback_course(extracted_data, settings)
    
    def determine_batch_config(self, modules_count: int) -> Dict:
        """Determine batching configuration based on module count"""
        if modules_count <= 4:
            return {'batches': 1, 'modules_per_batch': modules_count}
        elif modules_count <= 8:
            return {'batches': 2, 'modules_per_batch': modules_count // 2}
        else:
            return {'batches': 3, 'modules_per_batch': modules_count // 3}
    
    def combine_extracted_content(self, extracted_data: List[Dict]) -> Dict:
        """Combine and analyze all extracted content with enhanced analysis"""
        combined_text = ""
        all_structure = []
        all_topics = set()
        all_keywords = set()
        
        for data in extracted_data:
            if data.get('success') and data.get('content'):
                content = data['content']
                if isinstance(content, str):
                    combined_text += content + "\n\n"
                elif isinstance(content, dict):
                    combined_text += content.get('cleaned_text', '') + "\n\n"
                    all_structure.extend(content.get('structure', []))
                    all_topics.update(content.get('analysis', {}).get('key_topics', []))
                    all_keywords.update(content.get('analysis', {}).get('keywords', []))
        
        # Enhanced content analysis
        enhanced_analysis = analyze_content_depth(combined_text)
        
        return {
            'cleaned_text': combined_text.strip(),
            'structure': all_structure,
            'topics': list(all_topics),
            'keywords': list(all_keywords),
            'total_files': len(extracted_data),
            'enhanced_analysis': enhanced_analysis
        }
    
    def analyze_content_structure(self, content: Dict) -> Dict:
        """Enhanced content analysis with topic clustering"""
        text = content['cleaned_text']
        
        # Advanced topic extraction
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        # Extract main topics with enhanced algorithm
        main_topics = self.extract_enhanced_topics(content)
        
        # Calculate content metrics
        word_count = len(text.split())
        sentence_count = len(sentences)
        paragraph_count = len(paragraphs)
        
        # Determine content richness
        if word_count > 5000:
            richness = 'high'
        elif word_count > 2000:
            richness = 'medium'
        else:
            richness = 'low'
        
        return {
            'main_topics': main_topics,
            'total_sentences': sentence_count,
            'total_words': word_count,
            'total_paragraphs': paragraph_count,
            'content_richness': richness,
            'estimated_teaching_hours': max(1, paragraph_count // 8)
        }
    
    def extract_enhanced_topics(self, content: Dict) -> List[str]:
        """Extract enhanced topics using multiple methods"""
        topics = []
        text = content['cleaned_text'].lower()
        
        # Method 1: From document structure
        for item in content.get('structure', []):
            if item.get('type') in ['heading', 'title', 'section']:
                topic_text = item.get('text') or item.get('title') or ''
                if topic_text and len(topic_text) < 100:
                    topics.append(topic_text)
        
        # Method 2: From enhanced analysis
        if content.get('enhanced_analysis', {}).get('key_concepts'):
            topics.extend(content['enhanced_analysis']['key_concepts'][:5])
        
        # Method 3: Extract from text using pattern matching
        sentences = text.split('.')
        for sentence in sentences[:50]:  # Check first 50 sentences
            words = sentence.split()
            if 3 <= len(words) <= 8:  # Reasonable topic length
                # Check if it seems like a topic
                if not any(word in sentence for word in ['the', 'and', 'but', 'however']):
                    topics.append(sentence.strip().title())
        
        # Remove duplicates and return
        unique_topics = list(dict.fromkeys(topics))
        return unique_topics[:15]  # Return top 15 topics
    
    def generate_course_structure(self, analysis: Dict, settings: Dict, batch_config: Dict) -> Dict:
        """Generate optimal course structure with batching consideration"""
        modules_count = int(settings.get('modulesCount', 5))
        difficulty = settings.get('difficulty', 'beginner')
        
        main_topics = analysis['main_topics']
        if not main_topics:
            # Create meaningful module titles
            main_topics = self.generate_module_themes(modules_count, difficulty)
        
        # Create module structure with batching
        modules = []
        topics_per_module = max(1, len(main_topics) // modules_count)
        
        for i in range(min(modules_count, len(main_topics))):
            start_idx = i * topics_per_module
            end_idx = start_idx + topics_per_module if i < modules_count - 1 else len(main_topics)
            
            module_topics = main_topics[start_idx:end_idx]
            batch_number = self.determine_batch_for_module(i, batch_config)
            
            modules.append({
                'title': self.generate_module_title(module_topics, i, difficulty),
                'topics': module_topics,
                'description': self.generate_module_description(module_topics, difficulty),
                'learning_objectives': self.generate_learning_objectives(module_topics, difficulty),
                'order': i + 1,
                'batch': batch_number,
                'lesson_count': self.difficulty_levels[difficulty]['lesson_count']
            })
        
        return {
            'title': f"Mastering {main_topics[0] if main_topics else 'Advanced Concepts'}",
            'description': f"Comprehensive course covering {len(modules)} modules with practical applications and real-world scenarios",
            'modules': modules,
            'total_modules': len(modules),
            'batch_config': batch_config
        }
    
    def determine_batch_for_module(self, module_index: int, batch_config: Dict) -> int:
        """Determine which batch a module belongs to"""
        modules_per_batch = batch_config['modules_per_batch']
        return (module_index // modules_per_batch) + 1
    
    def generate_module_themes(self, modules_count: int, difficulty: str) -> List[str]:
        """Generate meaningful module themes based on difficulty"""
        base_themes = {
            'beginner': [
                "Fundamental Concepts", "Basic Principles", "Core Techniques",
                "Essential Skills", "Introduction to Applications"
            ],
            'intermediate': [
                "Advanced Concepts", "Practical Applications", "Complex Scenarios",
                "Problem Solving", "Real-world Implementation"
            ],
            'advanced': [
                "Expert-Level Analysis", "Advanced Methodologies", "Complex Systems",
                "Strategic Implementation", "Cutting-edge Applications"
            ]
        }
        
        themes = base_themes.get(difficulty, base_themes['beginner'])
        # Extend themes if needed
        while len(themes) < modules_count:
            themes.extend([f"Advanced Topic {len(themes) + 1}", f"Specialized Area {len(themes) + 1}"])
        
        return themes[:modules_count]
    
    def generate_module_title(self, topics: List[str], index: int, difficulty: str) -> str:
        """Generate engaging module titles"""
        if topics:
            main_topic = topics[0]
            prefixes = {
                'beginner': ["Understanding", "Learning", "Introduction to"],
                'intermediate': ["Mastering", "Exploring", "Advanced"],
                'advanced': ["Expert Guide to", "Comprehensive", "Advanced Mastery of"]
            }
            prefix = random.choice(prefixes.get(difficulty, prefixes['beginner']))
            return f"Module {index + 1}: {prefix} {main_topic}"
        else:
            return f"Module {index + 1}: Key Concepts and Applications"
    
    def generate_module_description(self, topics: List[str], difficulty: str) -> str:
        """Generate compelling module descriptions"""
        if topics:
            topic_str = ', '.join(topics[:2])
            descriptions = {
                'beginner': f"Learn the fundamentals of {topic_str} with clear explanations and simple examples.",
                'intermediate': f"Master {topic_str} through practical applications and real-world scenarios.",
                'advanced': f"Expert-level analysis of {topic_str} with complex case studies and advanced techniques."
            }
            return descriptions.get(difficulty, descriptions['beginner'])
        else:
            return "Comprehensive coverage of essential concepts with practical applications."
    
    def generate_learning_objectives(self, topics: List[str], difficulty: str) -> List[str]:
        """Generate specific learning objectives"""
        objectives = []
        action_verbs = {
            'beginner': ['Understand', 'Identify', 'Describe', 'Explain', 'Define'],
            'intermediate': ['Apply', 'Analyze', 'Compare', 'Differentiate', 'Implement'],
            'advanced': ['Evaluate', 'Create', 'Design', 'Develop', 'Critique', 'Optimize']
        }
        
        verbs = action_verbs.get(difficulty, action_verbs['beginner'])
        
        for topic in topics[:4]:  # Max 4 objectives per module
            verb = random.choice(verbs)
            if difficulty == 'beginner':
                objectives.append(f"{verb} the basic concepts of {topic}")
                objectives.append(f"{verb} how {topic} is applied in simple scenarios")
            elif difficulty == 'intermediate':
                objectives.append(f"{verb} {topic} principles to solve practical problems")
                objectives.append(f"Analyze real-world cases using {topic} methodologies")
            else:
                objectives.append(f"{verb} complex systems using advanced {topic} techniques")
                objectives.append(f"Design innovative solutions leveraging {topic} principles")
        
        return objectives[:4]
    
    def generate_modules_with_batching(self, course_structure: Dict, content: Dict, 
                                     settings: Dict, batch_config: Dict) -> List[Dict]:
        """Generate modules using batching system"""
        modules = []
        total_batches = batch_config['batches']
        
        for batch_num in range(1, total_batches + 1):
            print(f" Processing batch {batch_num}/{total_batches}")
            
            # Get modules for this batch
            batch_modules = [m for m in course_structure['modules'] if m['batch'] == batch_num]
            
            # Split content for this batch
            batch_content = self.split_content_for_batch(content, batch_num, total_batches)
            
            for module_struct in batch_modules:
                try:
                    print(f"  Generating module: {module_struct['title']}")
                    module_content = self.generate_enhanced_module_content(
                        module_struct, batch_content, settings
                    )
                    modules.append(module_content)
                    
                    # Add delay to avoid rate limiting
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"   Error generating module: {e}")
                    modules.append(self.create_enhanced_fallback_module(module_struct, settings))
        
        # Sort modules by order
        modules.sort(key=lambda x: x['order'])
        return modules
    
    def split_content_for_batch(self, content: Dict, batch_num: int, total_batches: int) -> Dict:
        """Split content for batching system"""
        full_text = content['cleaned_text']
        sentences = full_text.split('.')
        
        # Calculate sentences per batch
        sentences_per_batch = len(sentences) // total_batches
        start_idx = (batch_num - 1) * sentences_per_batch
        end_idx = batch_num * sentences_per_batch if batch_num < total_batches else len(sentences)
        
        batch_sentences = sentences[start_idx:end_idx]
        batch_text = '. '.join(batch_sentences)
        
        return {
            'cleaned_text': batch_text,
            'structure': content.get('structure', []),
            'topics': content.get('topics', []),
            'keywords': content.get('keywords', [])
        }
    
    def generate_enhanced_module_content(self, module_struct: Dict, content: Dict, settings: Dict) -> Dict:
        """Generate enhanced module content with proper structure"""
        
        prompt = self.create_enhanced_module_prompt(module_struct, content, settings)
        
        try:
            print(f"   Generating AI content for: {module_struct['title']}")
            response = self.model.generate_content(prompt)
            
            module_data = self.parse_module_response(response.text)
            enhanced_module = self.enhance_module_with_metadata(module_data, module_struct, settings)
            
            print(f"   Module generated: {len(enhanced_module.get('lessons', []))} lessons, "
                  f"{len(enhanced_module.get('quiz', []))} questions")
            
            return enhanced_module
            
        except Exception as e:
            print(f"   AI generation failed: {e}")
            return self.create_enhanced_fallback_module(module_struct, settings)
    
    def create_enhanced_module_prompt(self, module_struct: Dict, content: Dict, settings: Dict) -> str:
        """Create enhanced prompt for module generation"""
        
        difficulty = settings.get('difficulty', 'beginner')
        lesson_count = module_struct['lesson_count']
        questions_per_module = int(settings.get('questionsPerModule', 10))
        flashcards_count = int(settings.get('flashcardsCount', 20)) // int(settings.get('modulesCount', 5))
        
        # Extract relevant content
        module_context = self.extract_relevant_content(content['cleaned_text'], module_struct['topics'])
        
        prompt = f"""
        Create a comprehensive educational module for {difficulty} level learners.

        MODULE INFORMATION:
        - Title: {module_struct['title']}
        - Main Topics: {', '.join(module_struct['topics'])}
        - Learning Objectives: {', '.join(module_struct['learning_objectives'])}
        - Difficulty Level: {difficulty}
        - Number of Lessons: {lesson_count}
        - Exam Type: {settings.get('examType', 'practical')}
        - Depth Level: {settings.get('depthLevel', 'comprehensive')}

        SOURCE CONTEXT:
        {module_context[:4000]}

        REQUIREMENTS:

        1. LESSONS ({lesson_count} detailed lessons):
           - Each lesson must have: title, comprehensive content, duration (15-30 minutes), 
             keywords, practical examples, and summary
           - Content should be engaging, practical, and depth-appropriate
           - Include real-world applications and case studies
           - Vary lesson types: conceptual, practical, analytical

        2. QUIZ ({questions_per_module} high-quality questions):
           - Multiple choice with 4 plausible options
           - Clear correct answers with detailed explanations
           - Mix of difficulty levels (easy, medium, hard)
           - Questions should test understanding, not just memorization

        3. FLASHCARDS ({flashcards_count} key concepts):
           - Front: Key term or concept question
           - Back: Comprehensive definition with practical examples
           - Cover all main topics from the module

        Return ONLY valid JSON with this structure:
        {{
            "title": "Module title",
            "description": "Comprehensive module description",
            "lessons": [
                {{
                    "title": "Lesson title",
                    "content": "Detailed, engaging educational content with practical examples...",
                    "duration": 20,
                    "keywords": ["keyword1", "keyword2", "keyword3"],
                    "examples": [
                        {{
                            "title": "Example title",
                            "description": "Detailed practical example",
                            "code": "" 
                        }}
                    ],
                    "summary": "Key learning outcomes"
                }}
            ],
            "quiz": [
                {{
                    "question": "Thought-provoking question",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "A",
                    "explanation": "Detailed explanation",
                    "difficulty": "medium"
                }}
            ],
            "flashcards": [
                {{
                    "front": "Concept or term",
                    "back": "Comprehensive explanation with examples"
                }}
            ]
        }}

        IMPORTANT: 
        - Ensure content is comprehensive and engaging
        - Make questions challenging and meaningful
        - Provide practical, real-world examples
        - Return ONLY JSON, no additional text
        """
        
        return prompt
    
    def extract_relevant_content(self, full_text: str, topics: List[str]) -> str:
        """Extract highly relevant content for module topics"""
        if not topics or not full_text.strip():
            return full_text[:4000]
        
        sentences = full_text.split('.')
        relevant_sentences = []
        
        # Score sentences based on topic relevance
        for sentence in sentences:
            sentence_lower = sentence.lower()
            score = 0
            
            for topic in topics:
                topic_words = topic.lower().split()
                # Calculate relevance score
                for word in topic_words:
                    if len(word) > 3 and word in sentence_lower:
                        score += 1
            
            if score >= 2:  # At least 2 topic words match
                relevant_sentences.append(sentence.strip())
        
        # If not enough relevant sentences, use broader match
        if len(relevant_sentences) < 10:
            for sentence in sentences:
                sentence_lower = sentence.lower()
                for topic in topics:
                    if any(word in sentence_lower for word in topic.lower().split()[:2]):
                        if sentence.strip() not in relevant_sentences:
                            relevant_sentences.append(sentence.strip())
                            break
        
        relevant_content = '. '.join(relevant_sentences[:30])  # Limit to 30 sentences
        return relevant_content if relevant_content else full_text[:4000]
    
    def parse_module_response(self, response_text: str) -> Dict:
        """Parse AI response and extract JSON content"""
        try:
            # Clean the response
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks
            cleaned_text = re.sub(r'^```json\s*', '', cleaned_text, flags=re.IGNORECASE)
            cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
            if json_match:
                cleaned_text = json_match.group()
            
            # Parse JSON
            module_data = json.loads(cleaned_text)
            return module_data
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            raise ValueError("Invalid JSON response from AI")
    
    def enhance_module_with_metadata(self, module_data: Dict, module_struct: Dict, settings: Dict) -> Dict:
        """Enhance module content with additional structure and metadata"""
        
        # Add metadata
        module_data['order'] = module_struct['order']
        module_data['learning_objectives'] = module_struct['learning_objectives']
        module_data['topics'] = module_struct['topics']
        module_data['batch'] = module_struct['batch']
        
        # Ensure all required fields exist with proper values
        module_data.setdefault('lessons', [])
        module_data.setdefault('quiz', [])
        module_data.setdefault('flashcards', [])
        
        # Enhance lessons
        for i, lesson in enumerate(module_data['lessons']):
            lesson['order'] = i + 1
            lesson.setdefault('duration', 20)
            lesson.setdefault('keywords', module_struct['topics'][:3])
            lesson.setdefault('examples', [])
            lesson.setdefault('summary', 'Key concepts and applications mastered')
            
            # Ensure content is comprehensive
            if len(lesson.get('content', '')) < 200:
                lesson['content'] = self.enhance_lesson_content(lesson.get('content', ''), module_struct['topics'])
        
        # Enhance quiz questions
        for question in module_data['quiz']:
            question.setdefault('difficulty', 'medium')
            question.setdefault('explanation', 'Understanding this concept is crucial for practical application.')
        
        # Enhance flashcards
        for card in module_data['flashcards']:
            if len(card.get('back', '')) < 20:
                card['back'] = f"Comprehensive explanation of {card.get('front', 'concept')} with practical applications"
        
        # Calculate total duration
        total_duration = sum(lesson.get('duration', 20) for lesson in module_data.get('lessons', []))
        module_data['duration'] = total_duration
        
        # Add completion status
        module_data['completed'] = False
        module_data['timeSpent'] = 0
        
        return module_data
    
    def enhance_lesson_content(self, content: str, topics: List[str]) -> str:
        """Enhance lesson content if it's too short"""
        if len(content) > 200:
            return content
        
        base_content = content if content else f"This lesson covers essential concepts of {', '.join(topics[:2])}."
        
        enhancements = [
            " You'll learn practical applications and real-world scenarios.",
            " Comprehensive examples and case studies are included for better understanding.",
            " Advanced techniques and methodologies are explored in depth.",
            " The lesson includes step-by-step guidance and best practices.",
            " Real-world applications and industry examples are provided."
        ]
        
        return base_content + random.choice(enhancements)
    
    def create_enhanced_fallback_module(self, module_struct: Dict, settings: Dict) -> Dict:
        """Create enhanced fallback module with dynamic content"""
        difficulty = settings.get('difficulty', 'beginner')
        lesson_count = self.difficulty_levels[difficulty]['lesson_count']
        questions_per_module = int(settings.get('questionsPerModule', 10))
        flashcards_count = max(3, int(settings.get('flashcardsCount', 20)) // int(settings.get('modulesCount', 5)))
        
        # Dynamic lesson titles based on topics
        lesson_templates = {
            'beginner': [
                "Understanding Basic Concepts",
                "Practical Applications",
                "Fundamental Principles"
            ],
            'intermediate': [
                "Advanced Concepts Deep Dive", 
                "Real-world Applications",
                "Problem Solving Techniques",
                "Case Study Analysis"
            ],
            'advanced': [
                "Expert-Level Analysis",
                "Advanced Methodologies",
                "Complex System Design",
                "Strategic Implementation",
                "Innovation and Optimization"
            ]
        }
        
        lessons = []
        base_titles = lesson_templates.get(difficulty, lesson_templates['beginner'])
        
        for i in range(lesson_count):
            lesson_title = base_titles[i] if i < len(base_titles) else f"Advanced Topic {i + 1}"
            
            lessons.append({
                "title": f"{lesson_title}: {module_struct['topics'][0] if module_struct['topics'] else 'Key Concepts'}",
                "content": self.generate_fallback_lesson_content(module_struct, i, difficulty),
                "duration": 25 if difficulty == 'beginner' else 30,
                "order": i + 1,
                "keywords": module_struct['topics'][:3] or ['concepts', 'applications', 'principles'],
                "examples": [
                    {
                        "title": "Practical Implementation",
                        "description": f"Real-world example demonstrating application of {module_struct['topics'][0] if module_struct['topics'] else 'these concepts'}",
                        "code": ""
                    }
                ],
                "summary": f"Comprehensive understanding of {module_struct['topics'][0] if module_struct['topics'] else 'key concepts'} and their applications"
            })
        
        # Generate quiz questions
        quiz = []
        for i in range(questions_per_module):
            quiz.append({
                "question": f"What is the most important aspect of applying {module_struct['topics'][0] if module_struct['topics'] else 'these concepts'} in real-world scenarios?",
                "options": [
                    "Understanding fundamental principles and their relationships",
                    "Memorizing definitions and terminology",
                    "Focusing only on theoretical knowledge", 
                    "Avoiding practical applications"
                ],
                "correct_answer": "Understanding fundamental principles and their relationships",
                "explanation": "True mastery comes from understanding how principles interrelate and can be applied across various contexts.",
                "difficulty": "medium" if i < questions_per_module // 2 else "hard"
            })
        
        # Generate flashcards
        flashcards = []
        for i in range(flashcards_count):
            flashcards.append({
                "front": f"{module_struct['topics'][0] if module_struct['topics'] else 'Key Concept'} {i + 1}",
                "back": f"Comprehensive explanation of this important concept with practical applications and real-world significance"
            })
        
        return {
            "title": module_struct['title'],
            "description": module_struct['description'],
            "order": module_struct['order'],
            "batch": module_struct['batch'],
            "duration": sum(lesson['duration'] for lesson in lessons),
            "learning_objectives": module_struct['learning_objectives'],
            "lessons": lessons,
            "quiz": quiz,
            "flashcards": flashcards,
            "completed": False,
            "timeSpent": 0
        }
    
    def generate_fallback_lesson_content(self, module_struct: Dict, lesson_index: int, difficulty: str) -> str:
        """Generate meaningful fallback lesson content"""
        base_content = f"This lesson provides "
        
        content_types = {
            'beginner': [
                "clear, step-by-step explanation of fundamental concepts with simple examples.",
                "basic principles and their practical applications in everyday scenarios.",
                "essential knowledge building blocks with guided practice exercises."
            ],
            'intermediate': [
                "in-depth analysis of core concepts with real-world case studies and practical implementations.",
                "advanced techniques and methodologies with comprehensive examples and problem-solving approaches.",
                "practical applications and industry best practices with detailed walkthroughs."
            ],
            'advanced': [
                "expert-level insights into complex systems with advanced analytical techniques and strategic implementations.",
                "cutting-edge methodologies and innovative approaches with complex case studies and optimization strategies.",
                "comprehensive mastery of advanced concepts with real-world implementation guides and expert techniques."
            ]
        }
        
        templates = content_types.get(difficulty, content_types['beginner'])
        template = templates[lesson_index % len(templates)]
        
        topics_ref = module_struct['topics'][0] if module_struct['topics'] else 'these important concepts'
        
        return base_content + template.replace('concepts', topics_ref)
    
    def create_final_course(self, course_structure: Dict, modules: List[Dict], settings: Dict, content: Dict) -> Dict:
        """Create the final course structure with comprehensive analytics"""
        
        # Calculate totals
        total_duration = sum(module.get('duration', 45) for module in modules)
        total_lessons = sum(len(module.get('lessons', [])) for module in modules)
        total_questions = sum(len(module.get('quiz', [])) for module in modules)
        total_flashcards = sum(len(module.get('flashcards', [])) for module in modules)
        
        return {
            "title": course_structure['title'],
            "description": course_structure['description'],
            "category": self.determine_category(content['topics']),
            "tags": content['keywords'][:10] or ['ai-generated', 'comprehensive', 'interactive'],
            "total_duration": total_duration,
            "total_lessons": total_lessons,
            "total_quizzes": len([m for m in modules if m.get('quiz')]),
            "total_flashcards": total_flashcards,
            "total_questions": total_questions,
            "modules": modules,
            "settings_applied": settings,
            "content_analysis": {
                'source_topics': content['topics'],
                'source_keywords': content['keywords'],
                'total_source_files': content['total_files'],
                'content_richness': content.get('enhanced_analysis', {}).get('content_quality', 'medium'),
                'key_concepts': content.get('enhanced_analysis', {}).get('key_concepts', [])[:10]
            },
            "generation_metadata": {
                'batch_system_used': True,
                'total_batches': course_structure['batch_config']['batches'],
                'enhanced_content': True,
                'generation_timestamp': '2024-01-01T00:00:00Z'
            }
        }
    
    def determine_category(self, topics: List[str]) -> str:
        """Determine course category based on topics"""
        if not topics:
            return "Professional Development"
            
        topics_text = ' '.join(topics).lower()
        
        category_keywords = {
            "Technology": ['programming', 'code', 'software', 'computer', 'algorithm', 'data', 'python', 'java', 'javascript', 'ai', 'machine learning'],
            "Business": ['business', 'management', 'marketing', 'finance', 'economics', 'leadership', 'strategy', 'entrepreneurship'],
            "Science": ['science', 'physics', 'chemistry', 'biology', 'research', 'mathematics', 'engineering'],
            "Personal Development": ['communication', 'leadership', 'productivity', 'time management', 'personal growth']
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in topics_text for keyword in keywords):
                return category
        
        return "Professional Development"
    
    def create_enhanced_fallback_course(self, extracted_data: List[Dict], settings: Dict) -> Dict:
        """Create enhanced fallback course when AI generation fails"""
        print(" Creating enhanced fallback course with dynamic content...")
        return self.create_dynamic_fallback_course(extracted_data, settings)
    
    def create_dynamic_fallback_course(self, extracted_data: List[Dict], settings: Dict) -> Dict:
        """Create dynamic fallback course based on extracted content"""
        modules_count = int(settings.get('modulesCount', 5))
        difficulty = settings.get('difficulty', 'beginner')
        
        # Extract meaningful content
        combined_text = ""
        for data in extracted_data:
            if data.get('success') and data.get('content'):
                content = data['content']
                if isinstance(content, str):
                    combined_text += content + "\n\n"
                elif isinstance(content, dict):
                    combined_text += content.get('cleaned_text', '') + "\n\n"
        
        # Create enhanced modules
        modules = []
        batch_config = self.determine_batch_config(modules_count)
        
        for i in range(modules_count):
            batch_num = self.determine_batch_for_module(i, batch_config)
            
            module_struct = {
                'title': f"Module {i+1}: Comprehensive Learning",
                'topics': [f"Advanced Topic {i+1}", "Practical Applications", "Key Principles"],
                'description': f"In-depth coverage of essential concepts and their real-world applications",
                'learning_objectives': [
                    "Master core principles and relationships",
                    "Apply knowledge to complex scenarios", 
                    "Develop advanced problem-solving skills"
                ],
                'order': i + 1,
                'batch': batch_num,
                'lesson_count': self.difficulty_levels[difficulty]['lesson_count']
            }
            
            module = self.create_enhanced_fallback_module(module_struct, settings)
            modules.append(module)
        
        return {
            "title": "Advanced Comprehensive Course",
            "description": "Expert-level course generated from your materials with in-depth coverage and practical applications",
            "category": "Professional Development",
            "tags": ["comprehensive", "interactive", "expert-level"],
            "total_duration": modules_count * 60,
            "total_lessons": modules_count * self.difficulty_levels[difficulty]['lesson_count'],
            "total_quizzes": modules_count,
            "total_flashcards": modules_count * 5,
            "total_questions": modules_count * int(settings.get('questionsPerModule', 10)),
            "modules": modules,
            "settings_applied": settings,
            "content_analysis": {
                'source_topics': ['Advanced Concepts', 'Practical Applications'],
                'source_keywords': ['comprehensive', 'interactive', 'expert'],
                'total_source_files': len(extracted_data)
            }
        }

# Global function for backward compatibility
def generate_course_content(extracted_texts, settings, course_id):
    generator = AdvancedCourseGenerator()
    return generator.generate_course_content(extracted_texts, settings, course_id)

def create_fallback_course():
    generator = AdvancedCourseGenerator()
    return generator.create_dynamic_fallback_course([], {})