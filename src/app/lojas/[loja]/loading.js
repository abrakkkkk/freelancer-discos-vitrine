import BottomNav from '@/components/BottomNav';

export default function LojaCaixasLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div className="skeletonBlock" style={{ width: '40px', height: '40px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeletonBlock" style={{ width: '110px', height: '20px' }} />
          <div className="skeletonBlock" style={{ width: '160px', height: '14px' }} />
        </div>
      </header>

      <div className="skeletonBlock" style={{ height: '44px', width: '100%', marginBottom: '12px' }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px',
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeletonBlock" style={{ height: '78px' }} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

