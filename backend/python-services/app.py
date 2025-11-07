# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import traceback
import sys
from text_extraction import extract_text_from_file
from course_generator import generate_course_content, create_fallback_course
import google.generativeai as genai

# Force UTF-8 encoding (fix for Windows charmap crash)
sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(app)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyD8ayD9cOCtKkPGZENXmVPQpt_BMSlWohI')
try:
    genai.configure(api_key=GEMINI_API_KEY)
    print(" Gemini AI configured successfully")
except Exception as e:
    print(f" Gemini AI configuration failed: {e}")

@app.route('/python/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Python AI Service",
        "gemini_configured": bool(GEMINI_API_KEY),
        "timestamp": "2024-01-01T00:00:00Z"
    })

@app.route('/python/extract-text', methods=['POST'])
def extract_text():
    """Extract text from uploaded files"""
    try:
        print(" Text extraction request received")
        
        data = request.get_json()
        files = data.get('files', [])
        extracted_content = []
        
        print(f" Processing {len(files)} files")
        
        for file_info in files:
            file_path = file_info.get('path')
            file_type = file_info.get('type')
            filename = file_info.get('filename', 'unknown')
            
            print(f"🔍 Extracting text from: {filename}")
            
            if not os.path.exists(file_path):
                print(f" File not found: {file_path}")
                extracted_content.append({
                    'filename': filename,
                    'success': False,
                    'error': 'File not found',
                    'content': ''
                })
                continue
            
            try:
                text_content = extract_text_from_file(file_path, file_type)
                
                # Ensure proper content structure
                if isinstance(text_content, str):
                    # Convert string to structured format
                    content_obj = {
                        'cleaned_text': text_content,
                        'structure': [],
                        'analysis': {
                            'key_topics': [],
                            'keywords': []
                        }
                    }
                else:
                    content_obj = text_content
                
                extracted_content.append({
                    'filename': filename,
                    'success': True,
                    'content': content_obj,
                    'file_type': file_type
                })
                
                print(f" Successfully extracted: {filename} - {len(content_obj.get('cleaned_text', ''))} chars")
                
            except Exception as e:
                print(f" Extraction failed for {filename}: {str(e)}")
                extracted_content.append({
                    'filename': filename,
                    'success': False,
                    'error': str(e),
                    'content': ''
                })
        
        success_count = len([x for x in extracted_content if x['success']])
        print(f"🎉 Text extraction completed: {success_count}/{len(files)} successful")
        
        return jsonify({
            'success': True,
            'extracted_content': extracted_content
        })
        
    except Exception as e:
        print(f" Text extraction error: {str(e)}")
        print(f" Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Extraction failed: {str(e)}'
        }), 500

@app.route('/python/generate-course', methods=['POST'])
def generate_course():
    """Generate course content from extracted text"""
    try:
        print(" Course generation request received")
        
        data = request.get_json()
        
        # Extract parameters
        extracted_texts = data.get('extracted_texts', [])
        settings = data.get('settings', {})
        course_id = data.get('course_id')
        
        print(f"📊 Processing {len(extracted_texts)} extracted texts")
        print(f"⚙️ Settings: {settings}")
        
        if not extracted_texts:
            print(" No extracted texts provided")
            return jsonify({
                'success': False,
                'error': 'No text content provided'
            }), 400
        
        # Validate and prepare extracted texts for course generator
        valid_extracted_data = []
        total_chars = 0
        
        for text_data in extracted_texts:
            if text_data.get('success') and text_data.get('content'):
                content = text_data['content']
                
                # Handle both string and structured content
                if isinstance(content, str):
                    # Convert to structured format
                    structured_content = {
                        'cleaned_text': content,
                        'structure': [],
                        'analysis': {
                            'key_topics': [],
                            'keywords': []
                        }
                    }
                    valid_extracted_data.append({
                        'success': True,
                        'content': structured_content
                    })
                    total_chars += len(content)
                    
                elif isinstance(content, dict):
                    valid_extracted_data.append({
                        'success': True,
                        'content': content
                    })
                    total_chars += len(content.get('cleaned_text', ''))
        
        if not valid_extracted_data:
            print(" No valid content found in extracted texts")
            return jsonify({
                'success': False,
                'error': 'No valid text content found in files'
            }), 400
        
        print(f" Found {len(valid_extracted_data)} valid text contents ({total_chars} chars)")
        
        # Generate course content with proper data structure
        try:
            course_content = generate_course_content(valid_extracted_data, settings, course_id)
            print("Course content generated successfully")
            print(f" Generated: {course_content.get('title', 'Unknown')}")
            print(f" Modules: {len(course_content.get('modules', []))}")
            print(f" Lessons: {course_content.get('total_lessons', 0)}")
            
            return jsonify({
                'success': True,
                'course': course_content
            })
            
        except Exception as gen_error:
            print(f" Course generation error: {str(gen_error)}")
            print(f" Generation traceback: {traceback.format_exc()}")
            
            # Return fallback course
            fallback_course = create_fallback_course()
            print(" Using fallback course")
            
            return jsonify({
                'success': True,
                'course': fallback_course,
                'note': 'Used fallback course due to generation error'
            })
        
    except Exception as e:
        print(f" Course generation endpoint error: {str(e)}")
        print(f" Traceback: {traceback.format_exc()}")
        
        # Return fallback course instead of error
        fallback_course = create_fallback_course()
        return jsonify({
            'success': True,
            'course': fallback_course,
            'note': 'Used fallback course due to endpoint error'
        })

@app.route('/python/test-gemini', methods=['GET'])
def test_gemini():
    """Test Gemini AI connection"""
    try:
        # Try multiple model options
        models_to_try = [
            'gemini-2.5-pro-preview-03-25',
            'gemini-2.0-flash-exp', 
            'gemini-pro'
        ]
        
        working_model = None
        response_text = None
        
        for model_name in models_to_try:
            try:
                print(f" Testing model: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Hello, respond with 'Gemini is working!' if you can read this.")
                working_model = model_name
                response_text = response.text
                print(f" Model {model_name} is working")
                break
            except Exception as model_error:
                print(f" Model {model_name} failed: {model_error}")
                continue
        
        if working_model:
            return jsonify({
                'success': True,
                'message': f'Gemini AI is working correctly with {working_model}',
                'model': working_model,
                'response': response_text
            })
        else:
            return jsonify({
                'success': False,
                'error': 'All Gemini models failed'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Gemini test failed: {str(e)}'
        }), 500

@app.route('/python/test-course-generation', methods=['POST'])
def test_course_generation():
    """Test endpoint for course generation with sample data"""
    try:
        print("🧪 Testing course generation with sample data")
        
        # Sample test data
        test_content = [{
            'success': True,
            'content': {
                'cleaned_text': '''
                Artificial Intelligence is transforming modern technology and various industries. 
                Machine learning algorithms enable computers to learn from data and make predictions. 
                Deep learning uses neural networks for complex pattern recognition in images, text, and audio.
                Natural Language Processing (NLP) allows computers to understand and generate human language.
                Computer Vision enables machines to interpret and analyze visual information from the world.
                
                Key applications include:
                - Automated customer service chatbots
                - Image recognition systems
                - Predictive analytics in healthcare
                - Autonomous vehicles
                - Personalized recommendations
                
                The field continues to evolve with new architectures like Transformers and GANs.
                ''',
                'structure': [
                    {'type': 'heading', 'text': 'Artificial Intelligence Overview'},
                    {'type': 'section', 'text': 'Machine Learning'},
                    {'type': 'section', 'text': 'Deep Learning'},
                    {'type': 'section', 'text': 'Natural Language Processing'},
                    {'type': 'section', 'text': 'Computer Vision'}
                ],
                'analysis': {
                    'key_topics': ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision'],
                    'keywords': ['algorithms', 'neural networks', 'pattern recognition', 'data analysis', 'automation']
                }
            }
        }]
        
        test_settings = {
            'modulesCount': 3,
            'difficulty': 'intermediate',
            'examType': 'practical',
            'depthLevel': 'comprehensive',
            'flashcardsCount': 15,
            'questionsPerModule': 5
        }
        
        course_content = generate_course_content(test_content, test_settings, "test-course-123")
        
        return jsonify({
            'success': True,
            'message': 'Course generation test successful',
            'course': course_content
        })
        
    except Exception as e:
        print(f" Test course generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Test failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = 5001
    print(" Starting Python AI Service on port", port)
    print(" Gemini API Key:", "Configured" if GEMINI_API_KEY else "Missing")
    print("Service will run on: http://localhost:5001")
    
    # Test Gemini connection on startup
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Test connection")
        print(" Gemini AI connection test passed")
    except Exception as e:
        print(f" Gemini AI connection test failed: {e}")
    
    app.run(host='0.0.0.0', port=port, debug=False)