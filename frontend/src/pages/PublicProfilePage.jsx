import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { followsApi } from '../api/follows';
import FollowButton from '../components/FollowButton';
import PetCard from '../components/PetCard';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import FullPageSpinner from '../components/ui/FullPageSpinner';
import { MapPinIcon, PawIcon } from '../components/icons/Icons';
import { memberSince } from '../utils/format';
import './listing-pages.css';
import './public-profile.css';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    setData(null);
    setNotFound(false);
    setFollowing(false);
    usersApi.getPublicProfile(id)
      .then((d) => {
        setData(d);
        setFollowersCount(d.user.followersCount || 0);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!me) return;
    followsApi.ids().then((d) => setFollowing(d.ids.includes(Number(id)))).catch(() => {});
  }, [id, me]);

  if (notFound) {
    return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}><p>No encontramos a este usuario.</p></div>;
  }
  if (!data) return <FullPageSpinner />;

  const { user, pets } = data;
  const adoptedCount = pets.filter((p) => p.status === 'adoptada').length;
  const isMe = me && String(me.id) === String(user.id);

  return (
    <div className="container public-profile">
      <div className="card public-profile__header">
        <Avatar url={user.profilePhotoUrl} size={80} />
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.firstName} {user.lastName}
            {user.isVerifiedOrganization && <VerifiedBadge size={20} />}
          </h1>
          <div className="public-profile__meta">
            {user.cityName && (
              <span><MapPinIcon size={14} /> {user.cityName}, {user.cityProvince}</span>
            )}
            <span>Miembro desde {memberSince(user.memberSince)}</span>
          </div>
        </div>
        {isMe && (
          <Link to="/perfil" className="btn btn-outline btn-sm public-profile__edit">Ir a Mi cuenta</Link>
        )}
        {!isMe && user.isVerifiedOrganization && (
          <FollowButton
            userId={user.id}
            following={following}
            onChange={(now, count) => {
              setFollowing(now);
              if (typeof count === 'number') setFollowersCount(count);
            }}
          />
        )}
        <div className="public-profile__stats">
          <div>
            <strong>{pets.length}</strong>
            <span>publicaciones</span>
          </div>
          <div>
            <strong>{adoptedCount}</strong>
            <span>dadas en adopción</span>
          </div>
          {user.isVerifiedOrganization && (
            <div>
              <strong>{followersCount}</strong>
              <span>{followersCount === 1 ? 'seguidor' : 'seguidores'}</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="public-profile__section-title">Publicaciones de {user.firstName}</h2>

      {pets.length === 0 ? (
        <div className="listing-empty"><PawIcon size={22} /><p>Todavía no publicó ninguna mascota.</p></div>
      ) : (
        <div className="pet-grid">
          {pets.map((pet) => <PetCard key={pet.id} pet={pet} showFavoriteButton={false} />)}
        </div>
      )}
    </div>
  );
}
