import React, { useEffect, useState } from 'react'
import { dummyPublishedImages } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Community = () => {
  const { user } = useAppContext()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Use environment variable for API URL
  const SERVER_URL = import.meta.env.VITE_SERVER_URL

  useEffect(() => {
    // Wait for user state to be determined before fetching
    if (user !== null) {
      setAuthChecked(true)
      fetchImages()
    }
  }, [user])

  const fetchImages = async () => {
    // If no user, don't fetch images
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('❌ No token found');
        setLoading(false)
        return
      }

      // Use environment variable for API URL
      const res = await fetch(`${SERVER_URL}/api/auth/published-images`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 401) {
        console.log('❌ Token expired');
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setLoading(false)
        return
      }

      const data = await res.json()
      if (data.success) {
        setImages(data.images || [])
      } else {
        setImages(dummyPublishedImages)
      }
    } catch (err) {
      console.error('Error fetching images:', err)
      setImages(dummyPublishedImages)
    } finally {
      setLoading(false)
    }
  }

  // Download image
  const handleDownload = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quickgpt-${imageName || 'image'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    }
  }

  // Close image viewer
  const handleCloseViewer = () => {
    setSelectedImage(null)
  }

  // Show loading state within the component instead of Loading component
  if (loading || !authChecked) {
    return (
      <div className='p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
        <div className="flex justify-between items-center mb-6">
          <h2 className='text-2xl font-bold text-gray-800 dark:text-purple-100'>Community Images</h2>
          <div className="w-20 h-4 bg-gray-300 dark:bg-purple-700 rounded animate-pulse"></div>
        </div>
        
        {/* Loading skeleton */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
          {[...Array(10)].map((_, index) => (
            <div key={index} className='bg-white dark:bg-purple-900/20 rounded-xl overflow-hidden border border-gray-200 dark:border-purple-700 shadow-sm'>
              <div className='w-full h-48 bg-gray-300 dark:bg-purple-800 animate-pulse'></div>
              <div className='p-3'>
                <div className='w-3/4 h-4 bg-gray-300 dark:bg-purple-700 rounded animate-pulse mb-2'></div>
                <div className='w-1/2 h-3 bg-gray-200 dark:bg-purple-600 rounded animate-pulse'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // If no user after auth check, show message (shouldn't happen due to App.js redirect)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-purple-300 mb-4">
            Please login to view community images
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
      <div className="flex justify-between items-center mb-6">
        <h2 className='text-2xl font-bold text-gray-800 dark:text-purple-100'>Community Images</h2>
        <p className="text-sm text-gray-600 dark:text-purple-300">
          {images.length} image{images.length !== 1 ? 's' : ''} shared
        </p>
      </div>

      {images.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
          {images.map((item, index) => (
            <div key={item._id || index} className='relative group bg-white dark:bg-purple-900/20 rounded-xl overflow-hidden border border-gray-200 dark:border-purple-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]'>
              <img 
                src={item.imageUrl} 
                alt={`Community image by ${item.userName}`}
                className='w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105'
                onClick={() => setSelectedImage(item)}
              />
              
              {/* Overlay actions - Only Download */}
              <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                <button
                  onClick={() => handleDownload(item.imageUrl, item.userName)}
                  className='bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110'
                  title="Download Image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>

              {/* Image info - Simple and clean */}
              <div className='p-3'>
                <p className='text-xs text-gray-600 dark:text-purple-300 truncate'>
                  Created by {item.userName}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-purple-300 mb-2">No Images Yet</h3>
          <p className="text-gray-500 dark:text-purple-400">Be the first to share an image with the community!</p>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Image by {selectedImage.userName}
              </h3>
              <button
                onClick={handleCloseViewer}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage.imageUrl} 
                alt={`Community image by ${selectedImage.userName}`}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.userName)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleCloseViewer}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Community