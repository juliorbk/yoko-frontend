import { useState } from 'react';

interface WidgetInputProps {
  onSend: (content: string) => void;
  loading: boolean;
}

export function WidgetInput({ onSend, loading }: WidgetInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #e0e0e0',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: '#B3CFE5',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
