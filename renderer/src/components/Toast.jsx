export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  const bgColor = type === 'error' ? 'rgb(230, 80, 80)' : 'rgb(76, 175, 80)';
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: '10px 20px',
        backgroundColor: bgColor,
        color: 'white',
        borderRadius: 4,
        boxShadow: '0 0 8px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}
