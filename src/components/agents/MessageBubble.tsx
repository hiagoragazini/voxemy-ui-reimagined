
import { CheckCheck, Clock } from "lucide-react";

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export const MessageBubble = ({ message, isUser, timestamp, status = 'read' }: MessageBubbleProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-500" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-green-500 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        <p className="text-sm leading-relaxed">{message}</p>
        <div className={`flex items-center justify-end mt-1 space-x-1 ${
          isUser ? 'text-green-100' : 'text-gray-500'
        }`}>
          <span className="text-xs">{timestamp}</span>
          {isUser && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};
