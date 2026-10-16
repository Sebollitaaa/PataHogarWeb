import { useEffect, useState } from 'react';
import { conversationsApi } from '../api/conversations';

// Las fotos del chat son privadas: no se pueden pedir con un <img src>, porque la
// URL no lleva la sesión. Se descargan con el token y se muestran como blob local.
// Se guardan en memoria para no repetir la descarga al reabrir una conversación.
const cache = new Map();

export function loadChatImage(attachmentId, variant) {
  const key = `${attachmentId}:${variant}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      conversationsApi.attachment(attachmentId, variant)
        .then((blob) => URL.createObjectURL(blob))
        .catch((err) => {
          cache.delete(key);
          throw err;
        })
    );
  }
  return cache.get(key);
}

export function useChatImage(attachmentId, variant) {
  const [state, setState] = useState({ url: null, error: false });

  useEffect(() => {
    let active = true;
    setState({ url: null, error: false });
    loadChatImage(attachmentId, variant)
      .then((url) => active && setState({ url, error: false }))
      .catch(() => active && setState({ url: null, error: true }));
    return () => {
      active = false;
    };
  }, [attachmentId, variant]);

  return state;
}

/** Miniatura de una foto del chat; al tocarla se abre ampliada. */
export default function ChatImage({ attachment, onOpen }) {
  const { url, error } = useChatImage(attachment.id, 'thumb');

  if (error) return <div className="chat-image chat-image--error">No se pudo cargar</div>;
  return (
    <button type="button" className="chat-image" onClick={onOpen} aria-label="Ver foto">
      {url && <img src={url} alt="Foto enviada" width={attachment.width || undefined} />}
    </button>
  );
}
