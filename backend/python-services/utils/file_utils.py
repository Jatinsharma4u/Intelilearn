import os
import shutil

def ensure_directory(directory_path):
    """Ensure directory exists, create if not"""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)

def cleanup_file(file_path):
    """Safely remove a file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"Warning: Could not remove file {file_path}: {e}")
    return False

def get_file_size(file_path):
    """Get file size in MB"""
    try:
        return os.path.getsize(file_path) / (1024 * 1024)
    except:
        return 0