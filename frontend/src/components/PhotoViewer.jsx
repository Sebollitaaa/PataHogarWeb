import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_ORIGIN } from '../api/origin';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons/Icons';
import './photo-viewer.css';

const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 280;
const SWIPE_THRESHOLD = 60;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Visor de fotos a pantalla completa: flechas, deslizar, teclado, contador,
 * cerrar con X / Esc / tocando afuera / deslizando hacia abajo, y zoom
 * (doble toque o doble clic, pellizcar, rueda del mouse) con arrastre de la foto ampliada.
 */
export default function PhotoViewer({ photos, index, alt, onIndexChange, onClose }) {
  const count = photos.length;
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [swipe, setSwipe] = useState({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const stageRef = useRef(null);

  const photo = photos[index];
  const zoomed = view.scale > 1.01;

  function resetView() {
    setView({ scale: 1, x: 0, y: 0 });
  }

  function go(delta) {
    if (count < 2) return;
    resetView();
    onIndexChange((index + delta + count) % count);
  }

  // Teclado y bloqueo del scroll de la página mientras el visor está abierto.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  /** Mantiene la foto ampliada dentro de la pantalla al moverla. */
  function limit(next) {
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return next;
    const maxX = ((next.scale - 1) * stage.width) / 2;
    const maxY = ((next.scale - 1) * stage.height) / 2;
    return { scale: next.scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }

  /** Amplía o reduce manteniendo fijo el punto que está bajo el dedo / el mouse. */
  function zoomAt(newScale, clientX, clientY, base = view) {
    const stage = stageRef.current.getBoundingClientRect();
    const scale = clamp(newScale, 1, MAX_SCALE);
    const px = clientX - (stage.left + stage.width / 2);
    const py = clientY - (stage.top + stage.height / 2);
    const ratio = scale / base.scale;
    return limit({ scale, x: px - (px - base.x) * ratio, y: py - (py - base.y) * ratio });
  }

  function toggleZoom(clientX, clientY) {
    setAnimating(true);
    setView(zoomed ? { scale: 1, x: 0, y: 0 } : zoomAt(2.5, clientX, clientY));
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimating(false);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: 'pinch', startDist: distance(a, b), startView: view };
      setSwipe({ x: 0, y: 0 });
      return;
    }
    gesture.current = { type: zoomed ? 'pan' : 'swipe', startX: e.clientX, startY: e.clientY, startView: view, moved: false };
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.type === 'pinch' && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      setView(zoomAt(g.startView.scale * (distance(a, b) / g.startDist), mid.x, mid.y, g.startView));
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true;

    if (g.type === 'pan') {
      setView(limit({ scale: g.startView.scale, x: g.startView.x + dx, y: g.startView.y + dy }));
    } else if (g.type === 'swipe') {
      // Gesto dominante: horizontal cambia de foto, hacia abajo cierra.
      g.swipe = Math.abs(dx) >= Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: Math.max(0, dy) };
      setSwipe(g.swipe);
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;

    if (g.type === 'pinch') {
      if (pointers.current.size === 0) {
        gesture.current = null;
        if (view.scale < 1.05) {
          setAnimating(true);
          resetView();
        }
      }
      return;
    }
    gesture.current = null;

    if (g.type === 'swipe') {
      const final = g.swipe || { x: 0, y: 0 };
      setAnimating(true);
      if (final.y > 120) {
        onClose();
        return;
      }
      if (Math.abs(final.x) > SWIPE_THRESHOLD) go(final.x < 0 ? 1 : -1);
      setSwipe({ x: 0, y: 0 });
    }

    if (!g.moved) {
      // Toque fuera de la foto (en el fondo oscuro): cierra el visor.
      const img = stageRef.current?.querySelector('img')?.getBoundingClientRect();
      const outside = img && (e.clientX < img.left || e.clientX > img.right || e.clientY < img.top || e.clientY > img.bottom);
      if (outside && !zoomed) {
        onClose();
        return;
      }
      const now = Date.now();
      const tap = lastTap.current;
      if (now - tap.time < DOUBLE_TAP_MS && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30) {
        lastTap.current = { time: 0, x: 0, y: 0 };
        toggleZoom(e.clientX, e.clientY);
      } else {
        lastTap.current = { time: now, x: e.clientX, y: e.clientY };
      }
    }
  }

  function onWheel(e) {
    setAnimating(false);
    setView(zoomAt(view.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY));
  }

  const imageStyle = {
    transform: `translate(${view.x + swipe.x}px, ${view.y + swipe.y}px) scale(${view.scale})`,
    transition: animating ? 'transform 0.22s ease' : 'none',
  };
  const backdropOpacity = swipe.y ? Math.max(0.35, 1 - swipe.y / 400) : 1;

  return createPortal(
    <div
      className="photo-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${alt}`}
      style={{ '--viewer-backdrop': backdropOpacity }}
    >
      <div className="photo-viewer__top">
        {count > 1 && <span className="photo-viewer__counter">{index + 1} / {count}</span>}
        <span className="photo-viewer__hint">{zoomed ? 'Doble toque para volver' : 'Doble toque para ampliar'}</span>
        <button type="button" className="photo-viewer__btn photo-viewer__close" onClick={onClose} aria-label="Cerrar">
          <XIcon size={22} />
        </button>
      </div>

      <div
        ref={stageRef}
        className={`photo-viewer__stage ${zoomed ? 'is-zoomed' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          key={photo.id}
          className="photo-viewer__img"
          src={`${API_ORIGIN}${photo.original}`}
          alt={`${alt} — foto ${index + 1} de ${count}`}
          style={imageStyle}
          draggable={false}
          onTransitionEnd={() => setAnimating(false)}
        />
      </div>

      {count > 1 && !zoomed && (
        <>
          <button type="button" className="photo-viewer__btn photo-viewer__arrow photo-viewer__arrow--prev" onClick={() => go(-1)} aria-label="Foto anterior">
            <ChevronLeftIcon size={28} />
          </button>
          <button type="button" className="photo-viewer__btn photo-viewer__arrow photo-viewer__arrow--next" onClick={() => go(1)} aria-label="Foto siguiente">
            <ChevronRightIcon size={28} />
          </button>
        </>
      )}

      {count > 1 && (
        <div className="photo-viewer__thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id} type="button" className={i === index ? 'active' : ''}
              onClick={() => { resetView(); onIndexChange(i); }} aria-label={`Ver foto ${i + 1}`}
            >
              <img src={`${API_ORIGIN}${p.thumbnail}`} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
