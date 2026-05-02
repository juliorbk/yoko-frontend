import { useState, useEffect } from 'react';
import { WidgetBubble } from './WidgetBubble';
import { WidgetWindow } from './WidgetWindow';
import type { WidgetConfig, WidgetMessage } from '../types';

export default function ChatWidget(config: WidgetConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Crear sesión al abrir el widget
  const openWidget = async () => {
    setIsOpen(true);
    if (!sessionId) {
      try {
        const res = await fetch(`${config.apiUrl}/sessions/widget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationSlug: config.organizationSlug })
        });
        const session = await res.json();
        setSessionId(session.id);
        
        // Agregar mensaje de bienvenida
        if (config.greeting) {
          setMessages([{
            id: 'greeting',
            content: config.greeting,
            role: 'ASSISTANT',
            timestamp: Date.now()
          }]);
        }
      } catch (err) {
        console.error('Error creating widget session', err);
      }
    }
  };

  // Enviar mensaje
  const sendMessage = async (content: string) => {
    if (!sessionId || loading) return;
    
    const userMessage: WidgetMessage = {
      id: Date.now().toString(),
      content,
      role: 'USER',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      const res = await fetch(`${config.apiUrl}/sessions/widget/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      });
      const responseText = await res.text();
      
      const assistantMessage: WidgetMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: 'ASSISTANT',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <WidgetBubble 
          onClick={openWidget} 
          color={config.primaryColor} 
        />
      )}
      {isOpen && (
        <WidgetWindow
          messages={messages}
          onSend={sendMessage}
          onClose={() => setIsOpen(false)}
          loading={loading}
          config={config}
        />
      )}
    </>
  );
}
