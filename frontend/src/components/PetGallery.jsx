import { useEffect, useRef, useState } from 'react';
import { API_ORIGIN } from '../api/origin';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import PhotoViewer from './PhotoViewer';
import './pet-gallery.css';

// Proporción del recuadro de la foto principal (4:3).
const FRAME_RATIO = 4 / 3;
// Si para llenar el recuadro hubiera que recortar más que esto, la foto se muestra entera.
const MAX_CROP = 0.15;

/** ¿La foto llena el recuadro (recorte chico) o se muestra entera con fondo desenfocado? */
export function photoFit(photo, frameRatio = FRAME_RATIO) {
  if (!photo.width || !photo.height) return 'cover';
  const ratio = photo.width / photo.height;
  const crop = ratio > frameRatio ? 1 - frameRatio / ratio : 1 - ratio / frameRatio;
  return crop <= MAX_CROP ? 'cover' : 'contain';
}

const SWIPE_THRESHOLD = 50;

/**
 * Galería de la publicación: flechas, deslizar con el dedo, teclado, contador
 * y miniaturas. Al tocar la foto se abre el visor a pantalla completa.
 */
export default function PetGallery({ photos, alt, badge }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const drag = useRef(null);
  const frameRef = useRef(null);
  const count = photos.length;

  useEffect(() => {
    setIndex(0);
  }, [photos]);

  function go(delta) {
    setIndex((i) => (i + delta + count) % count);
  }

  function handleKey(e) {
    if (viewerOpen) return; // con el visor abierto, el teclado lo maneja el visor
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'Enter') setViewerOpen(true);
  }

  function onPointerDown(e) {
    if (count < 2 || e.button > 0) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false, horizontal: null };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (d.horizontal) frameRef.current?.setPointerCapture(e.pointerId);
    }
    if (d.horizontal) {
      d.moved = true;
      d.dx = dx; // el valor final se lee de acá: el estado puede no haberse actualizado todavía
      setDragX(dx);
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved && Math.abs(d.dx || 0) > SWIPE_THRESHOLD) go(d.dx < 0 ? 1 : -1);
    setDragX(0);
    // Un toque sin deslizar abre la foto en grande.
    if (!d.moved) setViewerOpen(true);
  }

  if (count === 0) {
    return (
      <div className="pet-gallery">
        <div className="pet-gallery__frame pet-gallery__frame--empty">{badge}</div>
      </div>
    );
  }

  return (
    <div className="pet-gallery">
      <div
        ref={frameRef}
        className="pet-gallery__frame"
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${alt}`}
        onKeyDown={handleKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; setDragX(0); }}
      >
        <div
          className={`pet-gallery__track ${dragX ? 'is-dragging' : ''}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}
        >
          {photos.map((p, i) => {
            const fit = photoFit(p);
            return (
              <div key={p.id} className={`pet-gallery__slide pet-gallery__slide--${fit}`} aria-hidden={i !== index}>
                {fit === 'contain' && (
                  <img className="pet-gallery__backdrop" src={`${API_ORIGIN}${p.medium}`} alt="" aria-hidden="true" draggable={false} />
                )}
                <img
                  className="pet-gallery__img"
                  src={`${API_ORIGIN}${p.original}`}
                  alt={`${alt} — foto ${i + 1} de ${count}`}
                  loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {badge}

        {count > 1 && (
          <>
            <button
              type="button" className="pet-gallery__arrow pet-gallery__arrow--prev" aria-label="Foto anterior"
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); go(-1); }}
            >
              <ChevronLeftIcon size={22} />
            </button>
            <button
              type="button" className="pet-gallery__arrow pet-gallery__arrow--next" aria-label="Foto siguiente"
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); go(1); }}
            >
              <ChevronRightIcon size={22} />
            </button>
            <span className="pet-gallery__counter" aria-live="polite">{index + 1} / {count}</span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="pet-gallery__thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id} type="button" className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)} aria-label={`Ver foto ${i + 1}`}
            >
              <img src={`${API_ORIGIN}${p.thumbnail}`} alt="" />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          index={index}
          alt={alt}
          onIndexChange={setIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
