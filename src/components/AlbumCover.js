'use client';

import { useState, useEffect } from 'react';
import { PiVinylRecord, PiDisc, PiFilmStrip, PiCassetteTape } from 'react-icons/pi';

const memoryCoverCache = new Map();

const FORMAT_TAG = {
  discos: 'LP',
  cds: 'CD',
  dvds: 'DVD',
  vhs: 'VHS',
};

export default function AlbumCover({
  id = null,
  artista = '',
  titulo = '',
  ano = '',
  capaUrl = null,
  size = 80,
  fluid = false,
  tipo = 'discos',
}) {
  const disableCovers = tipo === 'dvds' || tipo === 'vhs';
  const [resolvedUrl, setResolvedUrl] = useState(disableCovers ? null : capaUrl || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (disableCovers) {
      setResolvedUrl(null);
      return;
    }
    if (capaUrl) {
      setResolvedUrl(capaUrl);
      return;
    }

    let isMounted = true;
    const cleanAno = ano && String(ano) !== 'null' ? String(ano).trim() : '';
    const q = `${artista || ''} ${titulo || ''}`.trim();
    const qWithAno = `${q} ${cleanAno}`.trim();
    const qKey = qWithAno.toLowerCase();
    const cacheKey = id ? `${tipo}_${id}_${qKey}` : `${tipo}_${qKey}`;

    if (!q) {
      setResolvedUrl(null);
      return;
    }

    if (memoryCoverCache.has(cacheKey)) {
      setResolvedUrl(memoryCoverCache.get(cacheKey));
      return;
    }

    try {
      const stored = sessionStorage.getItem(`cover_${cacheKey}`);
      if (stored) {
        memoryCoverCache.set(cacheKey, stored);
        setResolvedUrl(stored);
        return;
      }
    } catch (_) {}

    setResolvedUrl(null);
    const controller = new AbortController();

    async function fetchCover() {
      try {
        const params = new URLSearchParams({
          id: String(id || ''),
          categoria: tipo,
          q,
          v: qKey,
        });
        if (cleanAno) params.set('ano', cleanAno);

        const res = await fetch(`/api/cover?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const img = data.cover || data.thumb || null;

        if (isMounted && img) {
          setResolvedUrl(img);
        }

        if (img) {
          memoryCoverCache.set(cacheKey, img);
          try {
            sessionStorage.setItem(`cover_${cacheKey}`, img);
          } catch (_) {}
        }
      } catch (_) {}
    }

    fetchCover();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, artista, titulo, ano, capaUrl, tipo]);

  const containerStyle = fluid
    ? {
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1c1c21',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }
    : {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        aspectRatio: '1 / 1',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#111114',
        border: '1px solid #26262e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      };

  if (resolvedUrl && !error) {
    return (
      <div style={containerStyle}>
        <img
          src={resolvedUrl}
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

  const iconSize = fluid ? 52 : Math.round(size * 0.46);
  const iconColor = '#52525b';
  const formatLabel = FORMAT_TAG[tipo] || 'LP';

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

  return (
    <div style={containerStyle}>
      {renderIcon()}
      {(fluid || size >= 120) && (
        <span
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: '#3f3f46',
            fontSize: '10px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.04em',
          }}
        >
          {formatLabel}
        </span>
      )}
    </div>
  );
}
