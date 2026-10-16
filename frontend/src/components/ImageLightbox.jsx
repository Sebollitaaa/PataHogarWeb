import { useEffect } from 'react';
import { useChatImage } from './ChatImage';
import { XIcon } from './icons/Icons';

/** Foto del chat a pantalla completa. Se cierra con la X, tocando el fondo o con Esc. */
export default function ImageLightbox({ attachment, onClose }) {
  const { url, error } = useChatImage(attachment.id, 'medium');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Cerrar"><XIcon size={20} /></button>
      {error ? <p style={{ color: '#fff' }}>No se pudo cargar la foto.</p> : url && <img src={url} alt="Foto enviada" onClick={(e) => e.stopPropagation()} />}
    </div>
  );
}
