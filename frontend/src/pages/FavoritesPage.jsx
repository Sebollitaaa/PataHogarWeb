import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../api/favorites';
import { followsApi } from '../api/follows';
import PetCard from '../components/PetCard';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import FollowButton from '../components/FollowButton';
import FullPageSpinner from '../components/ui/FullPageSpinner';
import { MapPinIcon } from '../components/icons/Icons';
import './listing-pages.css';

export default function FavoritesPage() {
  const [tab, setTab] = useState('mascotas');
  const [pets, setPets] = useState(null);
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    load();
    followsApi.list().then((d) => setProfiles(d.profiles)).catch(() => setProfiles([]));
  }, []);

  function load() {
    favoritesApi.list().then((d) => setPets(d.pets));
  }

  async function handleToggle(pet) {
    setPets((list) => list.filter((p) => p.id !== pet.id));
    try {
      await favoritesApi.remove(pet.id);
    } catch {
      load();
    }
  }

  function handleUnfollowed(userId) {
    setProfiles((list) => list.filter((p) => p.id !== userId));
  }

  return (
    <div className="container listing-page">
      <h1>Favoritos</h1>

      <div className="listing-tabs" role="tablist">
        <button
          role="tab" aria-selected={tab === 'mascotas'}
          className={tab === 'mascotas' ? 'active' : ''} onClick={() => setTab('mascotas')}
        >
          Mascotas{pets ? ` (${pets.length})` : ''}
        </button>
        <button
          role="tab" aria-selected={tab === 'siguiendo'}
          className={tab === 'siguiendo' ? 'active' : ''} onClick={() => setTab('siguiendo')}
        >
          Siguiendo{profiles ? ` (${profiles.length})` : ''}
        </button>
      </div>

      {tab === 'mascotas' && (
        pets === null ? (
          <FullPageSpinner />
        ) : pets.length === 0 ? (
          <div className="listing-empty">
            <p>Todavía no marcaste ninguna mascota como favorita.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Explorar mascotas</Link>
          </div>
        ) : (
          <div className="pet-grid">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} isFavorite showFavoriteButton onToggleFavorite={handleToggle} />
            ))}
          </div>
        )
      )}

      {tab === 'siguiendo' && (
        profiles === null ? (
          <FullPageSpinner />
        ) : profiles.length === 0 ? (
          <div className="listing-empty">
            <p>Todavía no seguís ningún perfil verificado. Buscalos en la pestaña "Personas" del inicio.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Ir al inicio</Link>
          </div>
        ) : (
          <ul className="followed-list">
            {profiles.map((p) => (
              <li key={p.id} className="card followed-card">
                <Link to={`/usuarios/${p.id}`} className="followed-card__main">
                  <Avatar url={p.profilePhotoUrl} size={56} />
                  <div>
                    <strong className="followed-card__name">
                      {p.firstName} {p.lastName}
                      {p.isVerifiedOrganization && <VerifiedBadge size={15} />}
                    </strong>
                    <span className="followed-card__meta">
                      {p.cityName && <><MapPinIcon size={13} /> {p.cityName}, {p.cityProvince} · </>}
                      {p.availablePets} {p.availablePets === 1 ? 'mascota disponible' : 'mascotas disponibles'}
                    </span>
                  </div>
                </Link>
                <FollowButton userId={p.id} following size="sm" onChange={() => handleUnfollowed(p.id)} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
