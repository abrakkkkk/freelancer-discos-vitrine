import BottomNav from '@/components/BottomNav';

export default function CaixaDetalheLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div className="skeletonBlock" style={{ width: '40px', height: '40px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeletonBlock" style={{ width: '120px', height: '20px' }} />
          <div className="skeletonBlock" style={{ width: '150px', height: '14px' }} />
        </div>
      </header>

      <div className="catalogGrid">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="skeletonCard">
            <div className="skeletonBlock" style={{ width: '100%', aspectRatio: '1 / 1' }} />
            <div className="skeletonBlock" style={{ width: '60%', height: '12px' }} />
            <div className="skeletonBlock" style={{ width: '90%', height: '16px' }} />
            <div className="skeletonBlock" style={{ width: '45%', height: '24px', marginTop: '4px' }} />
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

