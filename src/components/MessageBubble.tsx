import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm overflow-hidden ${
          role === 'user'
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-sm'
        }`}
      >
        <ReactMarkdown
          components={{
            // Style code blocks
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="rounded-md overflow-hidden my-2 border border-gray-700">
                  <div className="bg-gray-900 px-3 py-1 text-xs text-gray-400 flex justify-between items-center border-b border-gray-700">
                    <span>{match[1]}</span>
                    <span className="text-[10px]">COPY</span>
                  </div>
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.85rem' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={`${role === 'user' ? 'bg-blue-700' : 'bg-gray-900'} px-1 py-0.5 rounded text-sm font-mono`} {...props}>
                  {children}
                </code>
              );
            },
            // Style basic elements
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-blue-300">{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};