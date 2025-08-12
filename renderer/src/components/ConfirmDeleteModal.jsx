export default function ConfirmDeleteModal({ visible, onConfirm, onCancel, count }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top:0, left:0, right:0, bottom:0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        backgroundColor: 'rgb(34, 34, 34)',
        padding: 20,
        borderRadius: 8,
        maxWidth: 300,
        width: '100%',
        textAlign: 'center',
      }}>
        <p>Delete {count} selected {count === 1 ? 'file' : 'files'}?</p>
        <button onClick={onConfirm} style={{marginRight: 10}}>Yes</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
