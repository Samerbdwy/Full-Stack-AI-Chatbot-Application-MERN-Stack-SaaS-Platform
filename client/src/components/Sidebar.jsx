import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import moment from 'moment';

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const { chats, setChats, selectedChat, setSelectedChat, theme, setTheme, user, navigate, setUser, setToken } = useAppContext();
  const [search, setSearch] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatName, setEditChatName] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Start editing chat name
  const startEditChat = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditChatName(chat.name);
  };

  // Save edited chat name
  const saveChatName = async (chatId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editChatName }),
      });
      
      const data = await res.json();
      if (data.success) {
        setChats(chats.map(chat => 
          chat._id === chatId ? { ...chat, name: editChatName } : chat
        ));
        if (selectedChat?._id === chatId) {
          setSelectedChat({ ...selectedChat, name: editChatName });
        }
      }
    } catch (err) {
      console.error('Error updating chat name:', err);
    } finally {
      setEditingChatId(null);
      setEditChatName('');
    }
  };

  // ----------------- New Chat -----------------
  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'New Chat' }),
      });

      const data = await res.json();
      if (data.success && data.chat) {
        setChats(prevChats => [data.chat, ...prevChats]);
        setSelectedChat(data.chat);
        setIsMenuOpen(false);
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to create new chat', err);
    }
  };

  // ----------------- Delete Chat -----------------
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChats(chats.filter((c) => c._id !== chatId));
        if (selectedChat?._id === chatId) setSelectedChat(null);
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  // ----------------- Logout -----------------
  const handleLogout = async () => {
    try {
      // Animation before logout
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.style.transform = 'scale(0.95)';
        logoutBtn.style.opacity = '0.8';
      }

      // Wait for animation to complete
      setTimeout(() => {
        // Clear user data from context and localStorage
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // DON'T clear chats from state - they are saved in database
        // When user logs back in, AppContext will fetch their chats again
        setSelectedChat(null);
        setIsMenuOpen(false);
        
        // Navigate to login page
        navigate('/');
        
        console.log('✅ Logout successful - chats preserved in database');
      }, 300);
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback logout even if there's an error
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setSelectedChat(null);
      setIsMenuOpen(false);
      navigate('/');
    }
  };

  // ----------------- Theme Toggle -----------------
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div
      className={`flex flex-col h-screen min-w-80 p-6 dark:bg-gradient-to-br from-gray-900 to-purple-900 bg-gradient-to-br from-white to-purple-50 border-r border-gray-200 dark:border-purple-700 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-20 shadow-xl ${
        !isMenuOpen ? 'max-md:translate-x-full' : 'max-md:shadow-2xl'
      }`}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <img
          src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
          alt="Logo"
          className="w-40 transition-transform duration-300 hover:scale-105"
        />
        {/* Close button for mobile */}
        <div 
          className="md:hidden w-10 h-10 rounded-full bg-gray-100 dark:bg-purple-800 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-gray-200 dark:hover:bg-purple-700 hover:scale-110"
          onClick={() => setIsMenuOpen(false)}
        >
          <img src={assets.close_icon} className="w-4 h-4 dark:invert" alt="Close" />
        </div>
      </div>

      {/* New Chat Button - Enhanced & Clear */}
      <button
        onClick={handleNewChat}
        className="flex justify-center items-center w-full py-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 text-sm rounded-xl cursor-pointer shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden mb-6 flex-shrink-0"
      >
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <span className="mr-3 text-xl font-bold group-hover:scale-110 transition-transform duration-200">+</span>
        <span className="font-semibold relative z-10 text-lg">New Chat</span>
      </button>

      {/* Search - Enhanced */}
      <div className="flex items-center gap-3 p-4 mb-6 border border-gray-300 dark:border-purple-600 rounded-xl bg-white dark:bg-purple-800/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus-within:shadow-lg focus-within:border-purple-500 flex-shrink-0">
        <img src={assets.search_icon} className="w-5 dark:invert opacity-70" alt="Search" />
        <input
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          type="text"
          placeholder="Search conversations..."
          className="text-sm placeholder:text-gray-500 dark:placeholder:text-purple-300 outline-none w-full bg-transparent dark:text-white"
        />
      </div>

      {/* Recent Chats Section with Fixed Height and Scroll */}
      {chats.length > 0 && (
        <div className="mb-6 flex-1 min-h-0"> {/* Changed to flex-1 min-h-0 for proper flex scrolling */}
          <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-3 px-2 flex-shrink-0">Recent Chats</p>
          
          {/* Scrollable chats container */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-full"> {/* Removed max-h-96, use flex-1 instead */}
            {chats
              .filter((chat) =>
                chat.messages && chat.messages[0]
                  ? chat.messages[0]?.content?.toLowerCase().includes(search.toLowerCase())
                  : chat.name?.toLowerCase().includes(search.toLowerCase())
              )
              .map((chat) => (
                <div
                  onClick={() => {
                    setSelectedChat(chat);
                    setIsMenuOpen(false);
                    navigate('/');
                  }}
                  key={chat._id}
                  className={`p-4 rounded-xl cursor-pointer flex justify-between items-center group transition-all duration-300 transform hover:scale-[1.02] ${
                    selectedChat?._id === chat._id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-purple-800/30 border border-gray-200 dark:border-purple-600 hover:bg-gray-50 dark:hover:bg-purple-700/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {editingChatId === chat._id ? (
                      <input
                        value={editChatName}
                        onChange={(e) => setEditChatName(e.target.value)}
                        onBlur={(e) => saveChatName(chat._id, e)}
                        onKeyDown={(e) => e.key === 'Enter' && saveChatName(chat._id, e)}
                        className="w-full bg-transparent border-b border-white/50 outline-none text-white placeholder-purple/70"
                        placeholder="Enter chat name..."
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="truncate font-medium text-sm dark:text-white">
                          {chat.messages && chat.messages.length > 0 
                            ? (chat.messages[0].content?.slice(0, 32) || 'Empty chat')
                            : chat.name || 'New Chat'
                          }
                        </p>
                        <p className="text-xs opacity-70 mt-1 dark:text-purple-300">
                          {moment(chat.updatedAt).fromNow()}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => startEditChat(chat, e)}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-purple-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-purple-600 transition-colors"
                    >
                      <span className="text-xs">✎</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat._id)}
                      className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      <img src={assets.bin_icon} className="w-3 h-3 dark:invert" alt="Delete" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation & Actions - Enhanced - FIXED POSITION */}
      <div className="mt-auto space-y-3 pt-6 border-t border-gray-200 dark:border-purple-700 flex-shrink-0"> {/* Added flex-shrink-0 */}
        {/* Community */}
        <div
          onClick={() => navigate('/community')}
          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer bg-white/50 dark:bg-purple-800/30 backdrop-blur-sm transition-all duration-300 hover:bg-white dark:hover:bg-purple-700/50 hover:shadow-md hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <img src={assets.gallery_icon} className="w-5 h-5 invert" alt="Community" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-white">Community</span>
        </div>

        {/* Credits */}
        <div
          onClick={() => navigate('/credits')}
          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer bg-white/50 dark:bg-purple-800/30 backdrop-blur-sm transition-all duration-300 hover:bg-white dark:hover:bg-purple-700/50 hover:shadow-md hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <img src={assets.diamond_icon} className="w-5 h-5 invert" alt="Credits" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-white">Buy Credits</span>
        </div>

        {/* Theme Toggle */}
        <div
          onClick={toggleTheme}
          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer bg-white/50 dark:bg-purple-800/30 backdrop-blur-sm transition-all duration-300 hover:bg-white dark:hover:bg-purple-700/50 hover:shadow-md hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <img src={assets.theme_icon} className="w-5 h-5 invert" alt="Theme" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-white">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 dark:border-purple-700 pt-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-purple-800/30 backdrop-blur-sm mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-md">
              <img src={assets.user_icon} className="w-6 h-6 invert" alt="User" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-600 dark:text-purple-300 truncate">{user?.email}</p>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
                {user?.credits} credits available
              </p>
            </div>
          </div>

          {/* Logout Button with Animation */}
          <div
            onClick={handleLogout}
            className="logout-btn flex items-center gap-4 p-3 rounded-xl cursor-pointer bg-red-50 dark:bg-red-900/20 backdrop-blur-sm transition-all duration-300 hover:bg-red-100 dark:hover:bg-red-800/30 hover:shadow-md hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-180 transition-all duration-500">
              <img src={assets.logout_icon} className="w-5 h-5 invert" alt="Logout" />
            </div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;