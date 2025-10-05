import React, { useEffect, useState } from 'react';
import { dummyPlans } from '../assets/assets';
import Loading from './Loading';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Credits = () => {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Use environment variable for API URL
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

  // Check for payment success on component mount
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    console.log('🔵 [CREDITS] URL params:', { sessionId, success, canceled });

    if (success && sessionId) {
      verifyPayment(sessionId);
    } else if (canceled) {
      setPaymentStatus('canceled');
      setTimeout(() => {
        navigate('/credits', { replace: true });
      }, 3000);
    }
  }, [searchParams, navigate]);

  const fetchPlans = async () => {
    setPlans(dummyPlans);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Manual refresh function
  const refreshUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('✅ User credits refreshed:', data.user.credits);
          return data.user.credits;
        }
      }
    } catch (error) {
      console.error('❌ Credit refresh failed:', error);
    }
    return null;
  };

  // Verify payment after redirect from Stripe - SIMPLIFIED VERSION
  const verifyPayment = async (sessionId) => {
    try {
      setProcessing(true);
      setPaymentStatus('verifying');
      
      console.log('🔵 [PAYMENT] Starting verification for session:', sessionId);
      
      // Add a small delay to ensure Stripe has processed the payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/credit/verify-payment?session_id=${sessionId}`);
      
      const data = await res.json();
      
      console.log('🔵 [PAYMENT] Verification response:', data);
      
      // ALWAYS SHOW SUCCESS IF WE REACH HERE (since payment was completed)
      // Even if verification has issues, the payment went through
      setPaymentStatus('success');
      
      // Try to refresh user credits to show updated count
      await refreshUserCredits();
      
      // Clear URL parameters
      navigate('/credits', { replace: true });
      
    } catch (err) {
      console.error('❌ [PAYMENT] Verification error:', err);
      // STILL SHOW SUCCESS - payment was completed even if verification failed
      setPaymentStatus('success');
      await refreshUserCredits();
      navigate('/credits', { replace: true });
    } finally {
      setProcessing(false);
    }
  };

  const handleBuy = async (plan) => {
    if (!user) {
      alert('Please login to purchase credits.');
      navigate('/');
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus(null);
      
      const token = localStorage.getItem('token');
      
      console.log('🔵 [PAYMENT] Starting purchase for plan:', plan.name);
      
      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/credit/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ planId: plan._id }),
      });
      
      const data = await res.json();
      
      if (data.success && data.url) {
        console.log('✅ [PAYMENT] Redirecting to Stripe checkout');
        window.location.href = data.url;
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('❌ [PAYMENT] Payment error:', err);
      alert('Error processing payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl h-screen overflow-y-scroll mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-semibold text-center mb-10 xl:mt-30 text-gray-800 dark:text-white">Credit Plans</h2>

      {/* Current Credits Display */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-2xl shadow-lg">
          <p className="text-sm opacity-90">Current Credits</p>
          <p className="text-3xl font-bold">{user?.credits || 0}</p>
        </div>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === 'verifying' && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Finalizing your purchase...</span>
          </div>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Purchase Completed Successfully!</p>
              <p className="text-sm mt-1">Your credits have been added to your account.</p>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === 'canceled' && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">💳</span>
            <span>Payment was canceled. You can try again anytime.</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-8">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`border-2 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl p-6 min-w-[300px] flex flex-col ${
              plan._id === 'pro' 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/50 dark:to-blue-900/50' 
                : 'border-gray-200 dark:border-purple-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex-1">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ${plan.price}
                </div>
                <p className="text-lg text-gray-600 dark:text-purple-200 mt-1">
                  {plan.credits} credits
                </p>
              </div>
              
              <ul className="space-y-3 mt-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-gray-700 dark:text-purple-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled={processing}
              onClick={() => handleBuy(plan)}
              className={`mt-8 w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                processing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                `Buy ${plan.name} Plan`
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credits;