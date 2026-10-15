'use client';

import { useState } from 'react';
import { PiVinylRecord, PiDisc, PiFilmStrip, PiCassetteTape } from 'react-icons/pi';

export default function AlbumCover({
  artista = '',
  titulo = '',
  capaUrl = null,
  size = 80,
  tipo = 'discos',
}) {
  const [error, setError] = useState(false);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    aspectRatio: '1 / 1',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#121215',
    border: '1px solid #232328',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    flexShrink: 0,
  };

  if (capaUrl && !error) {
    return (
      <div style={containerStyle}>
        <img
          src={capaUrl}
          alt={`${artista ? `${artista} - ` : ''}${titulo || 'Capa'}`}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  const iconSize = Math.round(size * 0.48);
  const iconColor = '#52525b';

  const renderIcon = () => {
    switch (tipo) {
      case 'cds':
        return <PiDisc size={iconSize} color={iconColor} />;
      case 'dvds':
        return <PiFilmStrip size={iconSize} color={iconColor} />;
      case 'vhs':
        return <PiCassetteTape size={iconSize} color={iconColor} />;
      default:
        return <PiVinylRecord size={iconSize} color={iconColor} />;
    }
  };

  return <div style={containerStyle}>{renderIcon()}</div>;
}
