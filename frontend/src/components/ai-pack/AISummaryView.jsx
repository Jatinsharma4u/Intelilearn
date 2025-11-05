import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const AISummaryView = ({ summary, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">AI Summary</h3>
          <div className="w-6 h-6 border-2 border-[#7C5FFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-[#2A2A3D] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D] text-center">
        <h3 className="text-white text-lg font-semibold mb-2">AI Summary</h3>
        <p className="text-[#A0A0B8]">Upload notes to generate AI summary</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold">AI Summary</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center text-[#A0A0B8] hover:text-white transition-colors p-2"
          title="Copy summary"
        >
          {copied ? <FiCheck className="text-[#00FFA3]" /> : <FiCopy />}
        </button>
      </div>
      
      <div className="bg-[#2A2A3D] rounded-lg p-4">
        <p className="text-white leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>
      
      <div className="flex items-center mt-4 text-[#A0A0B8] text-sm">
        <div className="w-2 h-2 bg-[#00FFA3] rounded-full mr-2"></div>
        AI-generated • 1-minute read
      </div>
    </div>
  );
};

export default AISummaryView;