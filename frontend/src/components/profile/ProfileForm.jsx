import React, { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  BookOpen,
  Save,
  ArrowLeft,
  Check,
  X,
  Shield,
  Users,
  Crown
} from 'lucide-react';

const ProfileForm = ({ onCancel, onSave, isCreating = false }) => {
  const { profile, updateProfile, createProfile, loading, checkUsername } = useProfile();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: 'student',
    bio: '',
    college: '',
    course: '',
    year: '',
    interests: [],
    subjects: []
  });
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });

  const interestsOptions = [
    'Programming', 'Mathematics', 'Science', 'History', 'Literature', 'Art', 
    'Music', 'Sports', 'Technology', 'Business', 'Psychology', 'Languages', 
    'Design', 'Engineering', 'Medicine', 'Research', 'Writing'
  ];

  const subjectsOptions = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'History', 'English', 'Economics', 'Psychology', 'Engineering', 
    'Medicine', 'Law', 'Art & Design', 'Business Studies', 'Geography', 
    'Political Science'
  ];

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year', 'Postgraduate'];
  const roleOptions = [
    { value: 'student', label: '🎓 Student', icon: GraduationCap },
    { value: 'teacher', label: '👨‍🏫 Teacher', icon: Users }
  ];

  useEffect(() => {
    if (profile && !isCreating) {
      setFormData({
        username: profile.username || '',
        fullName: profile.fullName || '',
        role: profile.role || 'student',
        bio: profile.bio || '',
        college: profile.college || '',
        course: profile.course || '',
        year: profile.year || '',
        interests: profile.interests || [],
        subjects: profile.subjects || []
      });
    }
  }, [profile, isCreating]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check username availability in real-time
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username') {
      setUsernameStatus({ checking: false, available: null, message: '' });
    }
  };

  const checkUsernameAvailability = async (username) => {
    setUsernameStatus({ checking: true, available: null, message: '' });
    try {
      const result = await checkUsername(username);
      setUsernameStatus({ 
        checking: false, 
        available: result.available,
        message: result.message || (result.available ? 'Username available!' : 'Username already taken')
      });
    } catch (error) {
      setUsernameStatus({ 
        checking: false, 
        available: false,
        message: 'Error checking username'
      });
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate username for new profiles
    if (isCreating && (!formData.username || formData.username.length < 3)) {
      setUsernameStatus({ checking: false, available: false, message: 'Username must be at least 3 characters' });
      return;
    }

    // Validate required fields
    if (!formData.fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    try {
      if (isCreating) {
        await createProfile(formData);
      } else {
        await updateProfile(formData);
      }
      onSave?.();
    } catch (error) {
      console.error('Profile operation failed:', error);
    }
  };

  const getUsernameStatusIcon = () => {
    if (usernameStatus.checking) return <div className="w-4 h-4 border-2 border-[#FF9F5B] border-t-transparent rounded-full animate-spin" />;
    if (usernameStatus.available === true) return <Check className="h-4 w-4 text-[#00FFA3]" />;
    if (usernameStatus.available === false) return <X className="h-4 w-4 text-[#FF4D6D]" />;
    return null;
  };

  const getRoleIcon = (roleValue) => {
    const role = roleOptions.find(r => r.value === roleValue);
    return role ? role.icon : Users;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-[#1B1B28] border-[#2A2A3D] rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#7C5FFF]/10 to-[#A084FF]/10 p-6 border-b border-[#2A2A3D]">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-[#2A2A3D] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#A0A0B8]" />
            </button>
            <h2 className="text-2xl font-bold text-white">
              {isCreating ? 'Create Your Profile' : 'Edit Profile'}
            </h2>
          </div>
          <p className="text-[#A0A0B8] ml-11">
            {isCreating ? 'Complete your profile to get started' : 'Update your information'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-[#7C5FFF]" />
              Basic Information
            </h3>
            
            {isCreating && (
              <div>
                <label className="block text-sm font-medium text-[#A0A0B8] mb-2">
                  Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a unique username"
                    className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-lg px-4 py-3 text-white placeholder-[#A0A0B8] focus:border-[#7C5FFF] focus:ring-1 focus:ring-[#7C5FFF] outline-none transition-colors pr-10"
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]+"
                    title="Username can only contain letters, numbers, and underscores"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getUsernameStatusIcon()}
                  </div>
                </div>
                {usernameStatus.message && (
                  <p className={`text-xs mt-1 ${
                    usernameStatus.available ? 'text-[#00FFA3]' : 
                    usernameStatus.available === false ? 'text-[#FF4D6D]' : 'text-[#FF9F5B]'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                <p className="text-xs text-[#A0A0B8] mt-1">
                  Username can contain letters, numbers, and underscores (3-20 characters)
                </p>
              </div>
            )}

            {!isCreating && (
              <div>
                <label className="block text-sm font-medium text-[#A0A0B8] mb-2">
                  Username
                </label>
                <div className="flex items-center gap-2 p-3 bg-[#2A2A3D] rounded-lg">
                  <span className="text-white">@{formData.username}</span>
                  <span className="text-xs text-[#00FFA3] bg-[#00FFA3]/10 px-2 py-1 rounded">
                    Cannot be changed
                  </span>
                </div>
              </div>
            )}
            
            <Input
              label="Full Name *"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-[#A0A0B8] mb-3">
                Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleChange(role.value)}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        formData.role === role.value
                          ? 'border-[#7C5FFF] bg-[#7C5FFF]/10 text-white'
                          : 'border-[#2A2A3D] bg-[#2A2A3D] text-[#A0A0B8] hover:border-[#7C5FFF]/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#A0A0B8] mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-lg px-4 py-3 text-white placeholder-[#A0A0B8] focus:border-[#7C5FFF] focus:ring-1 focus:ring-[#7C5FFF] outline-none transition-colors resize-none"
                placeholder="Tell us about yourself and your learning goals..."
                maxLength={200}
              />
              <p className="text-xs text-[#A0A0B8] mt-1 text-right">
                {formData.bio.length}/200 characters
              </p>
            </div>
          </div>

          {/* Education Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#00FFA3]" />
              Education
            </h3>
            
            <Input
              label="College/University"
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              placeholder="Enter your college name"
            />
            
            <Input
              label="Course/Program"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              placeholder="e.g., Computer Science Engineering"
            />
            
            <div>
              <label className="block text-sm font-medium text-[#A0A0B8] mb-2">
                Current Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full bg-[#2A2A3D] border border-[#2A2A3D] rounded-lg px-4 py-3 text-white focus:border-[#7C5FFF] focus:ring-1 focus:ring-[#7C5FFF] outline-none transition-colors"
              >
                <option value="">Select your year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interests & Subjects Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#FF9F5B]" />
              Interests & Subjects
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-[#A0A0B8] mb-3">
                Select your interests ({formData.interests.length}/5)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interestsOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleArrayChange('interests', interest)}
                    disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                    className={`p-3 rounded-lg text-sm transition-all flex items-center justify-center ${
                      formData.interests.includes(interest)
                        ? 'bg-[#7C5FFF] text-white shadow-lg'
                        : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#7C5FFF]/20 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0B8] mb-3">
                Select your subjects ({formData.subjects.length}/5)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subjectsOptions.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleArrayChange('subjects', subject)}
                    disabled={formData.subjects.length >= 5 && !formData.subjects.includes(subject)}
                    className={`p-3 rounded-lg text-sm transition-all flex items-center justify-center ${
                      formData.subjects.includes(subject)
                        ? 'bg-[#00FFA3] text-[#0D0D14] shadow-lg'
                        : 'bg-[#2A2A3D] text-[#A0A0B8] hover:bg-[#00FFA3]/20 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#2A2A3D]">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={isCreating && (!usernameStatus.available || usernameStatus.checking)}
              className="flex-1 bg-[#00FFA3] hover:bg-[#00E693] text-[#0D0D14] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isCreating ? 'Create Profile' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default ProfileForm;