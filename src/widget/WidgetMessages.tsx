import { useEffect, useRef } from 'react';
import type { WidgetMessage } from '../types';

interface WidgetMessagesProps {
  messages: WidgetMessage[];
}

export function WidgetMessages({ messages }: WidgetMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {messages.map(msg => (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'USER' ? 'flex-end' : 'flex-start'
          }}
        >
          <div style={{
            maxWidth: '80%',
            padding: '10px 14px',
            borderRadius: '12px',
            background: msg.role === 'USER' ? '#B3CFE5' : '#f0f0f0',
            color: msg.role === 'USER' ? '#fff' : '#333333',
            fontSize: '14px',
            lineHeight: '1.4',
            wordBreak: 'break-word'
          }}>
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
