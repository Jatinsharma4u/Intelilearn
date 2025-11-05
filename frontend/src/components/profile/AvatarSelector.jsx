// src/components/profile/AvatarSelector.jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Image } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatar }) => {
  const [selectedTab, setSelectedTab] = useState('default');
  const fileInputRef = useRef(null);
  const avatarOptions = Array.from({ length: 10 }, (_, i) => `/assets/avatars/avatar-${i + 1}.png`);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onSelect(e.target.result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex-1 flex flex-col">
        {/* Header - Single Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A3D]">
          <h2 className="text-xl font-semibold text-white">Choose Your Avatar</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#2A2A3D] transition-colors"
          >
            <X className="h-5 w-5 text-[#A0A0B8]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A3D]">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'default'
                ? 'text-[#7C5FFF] border-b-2 border-[#7C5FFF]'
                : 'text-[#A0A0B8] hover:text-white'
            }`}
            onClick={() => setSelectedTab('default')}
          >
            Default Avatars
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'upload'
                ? 'text-[#7C5FFF] border-b-2 border-[#7C5FFF]'
                : 'text-[#A0A0B8] hover:text-white'
            }`}
            onClick={() => setSelectedTab('upload')}
          >
            Upload Image
          </button>
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedTab === 'default' ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {avatarOptions.map((avatar, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    currentAvatar === avatar
                      ? 'border-[#7C5FFF] ring-2 ring-[#7C5FFF]/30 shadow-lg'
                      : 'border-[#2A2A3D] hover:border-[#7C5FFF]/60'
                  }`}
                  onClick={() => {
                    onSelect(avatar);
                    onClose();
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-auto aspect-square object-cover"
                  />
                  {currentAvatar === avatar && (
                    <div className="absolute inset-0 bg-[#7C5FFF]/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#7C5FFF] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#2A2A3D] rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-10 w-10 text-[#7C5FFF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Your Image</h3>
              <p className="text-[#A0A0B8] mb-6">Select an image file from your device</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                onClick={triggerFileInput}
                className="flex items-center gap-2 bg-[#7C5FFF] hover:bg-[#6A4EE6] mx-auto"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>

              <p className="text-xs text-[#A0A0B8] mt-3">Supported formats: JPG, PNG, GIF</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AvatarSelector;