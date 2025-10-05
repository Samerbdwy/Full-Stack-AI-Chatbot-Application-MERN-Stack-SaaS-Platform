import React, { useEffect } from 'react';
import { assets } from '../assets/assets';
import moment from 'moment';
import Markdown from 'react-markdown';
import Prism from 'prismjs';

const Message = ({ message, onPublish }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  const isUser = message.role === 'user';

  return (
    <div>
      {isUser ? (
        <div className='flex items-start justify-end my-4 gap-2'>
          <div className='flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl'>
            <p className='text-sm dark:text-primary'>{message.content}</p>
            <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <img src={assets.user_icon} alt="" className='w-8 rounded-full'/>
        </div>
      ) : (
        <div className='flex items-start gap-2 my-4'>
          <img src={assets.logo} alt="AI" className='w-8 rounded-full'/>
          <div className='inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md'>
            {message.isImage ? (
              <div className="flex flex-col gap-2">
                <img src={message.content} alt="AI Generated" className='w-full max-w-md mt-2 rounded-md'/>
                <div className="flex items-center justify-between">
                  {message.isPublished ? (
                    <span className="text-xs text-green-400">Published to community</span>
                  ) : (
                    <button
                      onClick={onPublish}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Publish to community
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className='text-sm dark:text-primary reset-tw'>
                <Markdown>{message.content}</Markdown>
              </div>
            )}
            <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;