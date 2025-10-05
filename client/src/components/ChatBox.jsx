import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Message from './Message';
import { assets } from '../assets/assets';

const ChatBox = () => {
  const { selectedChat, user, setUser, refreshUserData } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Use environment variable for API URL
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${SERVER_URL}/api/chat/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  // Auto scroll to bottom with smooth animation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Update user credits in real-time - IMPROVED VERSION
  const updateUserCredits = async (newCredits) => {
    try {
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, credits: newCredits };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update context
      setUser(updatedUser);
      
      // Refresh user data from server to ensure consistency
      await refreshUserData();
      
      console.log('✅ Credits updated in real-time:', newCredits);
    } catch (error) {
      console.error('Error updating credits:', error);
    }
  };

  // Publish image to community
  const handlePublish = async (messageIndex) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Publishing message at index:', messageIndex);
      
      const res = await fetch(`${SERVER_URL}/api/chat/${selectedChat._id}/publish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIndex }),
      });

      const data = await res.json();
      console.log('📦 Publish response:', data);
      
      if (data.success) {
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, isPublished: true } : msg
        ));
        alert('✅ Image published to community!');
      } else {
        alert('❌ Failed to publish image: ' + data.message);
      }
    } catch (err) {
      console.error('❌ Error publishing image:', err);
      alert('❌ Error publishing image. Please try again.');
    }
  };

  // Send message to backend - UPDATED CREDIT HANDLING
  const handleSend = async () => {
    if (!input.trim() || !selectedChat || loading) return;
    
    const userMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: input,
      isImage: false,
      isPublished: false,
      timestamp: new Date()
    };

    setLoading(true);
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Sending to Gemini API...');
      console.log('🔵 Current user credits:', user?.credits);
      
      const res = await fetch(`${SERVER_URL}/api/message/text`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          chatId: selectedChat._id, 
          prompt: currentInput 
        }),
      });

      const data = await res.json();
      console.log('📦 Backend response:', data);
      
      if (data.success && data.reply) {
        console.log('✅ Gemini response received');
        const aiMessage = {
          ...data.reply,
          _id: Date.now().toString() + '-ai'
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // ✅ UPDATE CREDITS IN REAL-TIME WITH SERVER SYNC
        if (data.updatedCredits !== undefined) {
          await updateUserCredits(data.updatedCredits);
        }
      } else {
        console.error('❌ Backend error:', data.message);
        throw new Error(data.message || 'AI response failed');
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      const errorMessage = {
        _id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Gemini API is currently unavailable. Please try again later.',
        isImage: false,
        isPublished: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle message submission
  const handleSubmit = () => {
    const prompt = input.trim().toLowerCase();
    const isImageRequest = prompt.includes('generate') && prompt.includes('image') || 
                          prompt.includes('create') && prompt.includes('image') ||
                          prompt.includes('show me') && prompt.includes('image');
    
    if (isImageRequest) {
      handleGenerateImage(input);
    } else {
      handleSend();
    }
  };

  // Generate AI Image - UPDATED CREDIT HANDLING
  const handleGenerateImage = async (prompt) => {
    if (!selectedChat || loading) return;
    
    const userMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: prompt,
      isImage: false,
      isPublished: false,
      timestamp: new Date()
    };

    setLoading(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      const token = localStorage.getItem('token');
      console.log('🔵 Current user credits before image generation:', user?.credits);
      
      const res = await fetch(`${SERVER_URL}/api/message/image`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          chatId: selectedChat._id, 
          prompt: prompt,
          isPublished: false 
        }),
      });

      const data = await res.json();
      
      if (data.success && data.reply) {
        const aiMessage = {
          ...data.reply,
          _id: Date.now().toString() + '-ai-image'
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // ✅ UPDATE CREDITS IN REAL-TIME WITH SERVER SYNC
        if (data.updatedCredits !== undefined) {
          await updateUserCredits(data.updatedCredits);
        }
      } else {
        throw new Error(data.message || 'Image generation failed');
      }
    } catch (err) {
      console.error('❌ Error generating image:', err);
      const errorMessage = {
        _id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, image generation failed. Please try again.',
        isImage: false,
        isPublished: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-purple-900 p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center shadow-2xl animate-pulse">
            <img src={assets.logo} alt="AI" className="w-16 h-16 invert" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome to QuickGPT
          </h2>
          <p className="text-gray-600 dark:text-purple-300 text-lg mb-6">
            Your AI-powered conversation partner
          </p>
          <div className="space-y-3 text-sm text-gray-500 dark:text-purple-400">
            <p>✨ Ask anything - from creative writing to technical questions</p>
            <p>🎨 Generate images with simple prompts</p>
            <p>💬 Your conversations are automatically saved</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
      {/* Chat Header with Animation */}
      <div className="border-b border-gray-200 dark:border-purple-700 bg-white/80 dark:bg-purple-900/80 backdrop-blur-sm p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {selectedChat.name}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-purple-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Ready</span>
          </div>
        </div>
      </div>

      {/* Messages Area with Enhanced Styling */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center shadow-2xl animate-bounce">
              <img src={assets.logo} alt="AI" className="w-12 h-12 invert" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              Start a Conversation
            </h3>
            <p className="text-gray-600 dark:text-purple-300 text-lg mb-6 max-w-md">
              Ask me anything or try generating an image with your imagination!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {[
                "Explain quantum computing",
                "Write a poem about nature",
                "Generate an image of a sunset",
                "Help me plan a workout routine"
              ].map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="p-4 rounded-xl bg-white/70 dark:bg-purple-800/30 border border-gray-200 dark:border-purple-600 cursor-pointer hover:bg-white dark:hover:bg-purple-700/50 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <p className="text-sm text-gray-700 dark:text-purple-200">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <Message 
                key={msg._id || index} 
                message={msg} 
                onPublish={msg.role === 'assistant' && msg.isImage ? () => handlePublish(index) : undefined}
              />
            ))}
            {loading && (
              <div className="flex items-start justify-start my-4 gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center shadow-md">
                  <img src={assets.logo} alt="AI" className="w-6 h-6 invert" />
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className="inline-flex flex-col gap-3 p-4 bg-white/80 dark:bg-purple-800/30 border border-purple-200 dark:border-purple-600 rounded-2xl shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-purple-600 dark:text-purple-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t border-gray-200 dark:border-purple-700 bg-white/80 dark:bg-purple-900/80 backdrop-blur-sm p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message QuickGPT... (Try 'generate an image of a sunset')"
                className="w-full border border-gray-300 dark:border-purple-600 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-purple-800/50 backdrop-blur-sm transition-all duration-300 text-lg shadow-sm dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                disabled={loading}
              />
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gray-200 dark:bg-purple-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-purple-600 transition-colors"
                >
                  <span className="text-sm">×</span>
                </button>
              )}
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={loading || !input.trim()}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span className="text-lg">↑</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500 dark:text-purple-400">
            <span>✨ Creative</span>
            <span>🔍 Knowledgeable</span>
            <span>🎨 Visual</span>
            <span>💬 Conversational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;