import React from 'react';

const Loading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        {/* Modern Spinner */}
        <div className="relative mx-auto mb-8 w-16 h-16">
          <div className="absolute inset-0">
            <div className="w-full h-full border-4 border-purple-500/30 rounded-full"></div>
          </div>
          <div className="absolute inset-0">
            <div className="w-full h-full border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-2">
            <div className="w-full h-full border-4 border-transparent border-b-blue-400 rounded-full animate-spin animation-reverse"></div>
          </div>
        </div>

        {/* Brand with Typing Effect */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
            QuickGPT
          </h1>
          <div className="flex items-center justify-center space-x-1">
            <p className="text-purple-200 font-light">Loading</p>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-purple-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;