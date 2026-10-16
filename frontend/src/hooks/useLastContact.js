import { useEffect, useState } from 'react';
import { petsApi } from '../api/pets';

/**
 * Datos de contacto que la persona usó en su publicación más reciente
 * (para ofrecerlos como sugerencia en la próxima). `excludePetId` evita
 * sugerir los de la misma publicación que se está editando.
 */
export function useLastContact(excludePetId) {
  const [contact, setContact] = useState({ whatsapp: '', email: '' });

  useEffect(() => {
    let active = true;
    petsApi.mine()
      .then(({ pets }) => {
        // /pets/mine viene ordenado de la más nueva a la más vieja.
        const others = pets.filter((p) => String(p.id) !== String(excludePetId));
        const whatsapp = others.find((p) => p.contactWhatsapp)?.contactWhatsapp || '';
        const email = others.find((p) => p.contactEmail)?.contactEmail || '';
        if (active) setContact({ whatsapp, email });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [excludePetId]);

  return contact;
}
