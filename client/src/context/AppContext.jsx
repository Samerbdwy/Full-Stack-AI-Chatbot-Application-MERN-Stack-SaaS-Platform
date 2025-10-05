import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [contextReady, setContextReady] = useState(false);

  // Use environment variable for API URL
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to refresh user data (including credits)
  const refreshUserData = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.log('❌ No token found for refresh');
        return null;
      }

      console.log('🔵 Refreshing user data...');
      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('✅ User data refreshed, credits:', data.user.credits);
          return data.user;
        }
      } else {
        console.log('❌ Failed to refresh user data, status:', res.status);
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
    return null;
  };

  // Function to fetch user chats
  const fetchUserChats = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      console.log('🔵 Fetching user chats...');
      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/chat/`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChats(data.chats || []);
          console.log('✅ Chats loaded:', data.chats?.length || 0);
          
          // Try to restore selected chat from localStorage
          const savedSelectedChatId = localStorage.getItem('selectedChatId');
          if (savedSelectedChatId) {
            const chatToSelect = data.chats.find(chat => chat._id === savedSelectedChatId);
            if (chatToSelect) {
              setSelectedChat(chatToSelect);
              console.log('✅ Restored selected chat:', chatToSelect.name);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Save selected chat to localStorage whenever it changes
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChatId', selectedChat._id);
    }
  }, [selectedChat]);

  // Auto-login from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Fetch fresh user data and chats
        await refreshUserData();
        await fetchUserChats();
        
        console.log('✅ Auto-login from localStorage completed');
      }
      
      // Mark context as ready
      setContextReady(true);
    };

    initializeAuth();
  }, []);

  return (
    <AppContext.Provider value={{
      navigate,
      user,
      setUser,
      token,
      setToken,
      chats,
      setChats,
      selectedChat,
      setSelectedChat,
      theme,
      setTheme,
      contextReady,
      refreshUserData,
      fetchUserChats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};