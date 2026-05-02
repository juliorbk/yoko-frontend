import { WidgetMessages } from './WidgetMessages';
import { WidgetInput } from './WidgetInput';
import type { WidgetConfig, WidgetMessage } from '../types';

interface WidgetWindowProps {
  messages: WidgetMessage[];
  onSend: (content: string) => void;
  onClose: () => void;
  loading: boolean;
  config: WidgetConfig;
}

export function WidgetWindow({ messages, onSend, onClose, loading, config }: WidgetWindowProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '500px',
      background: config.backgroundColor || '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: config.primaryColor || '#B3CFE5',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>Chat de Ayuda</span>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#fff', 
            cursor: 'pointer', 
            fontSize: '18px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Messages */}
      <WidgetMessages messages={messages} />
      
      {/* Input */}
      <WidgetInput onSend={onSend} loading={loading} />
    </div>
  );
}
