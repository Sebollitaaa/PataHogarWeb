import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { followsApi } from '../api/follows';
import { useAuth } from '../context/AuthContext';
import './follow-button.css';

/**
 * Botón "Seguir / Siguiendo" para perfiles verificados.
 * `following` lo decide quien lo usa (así una lista de perfiles consulta una sola vez);
 * `onChange(nowFollowing, followersCount)` avisa el resultado.
 */
export default function FollowButton({ userId, following, onChange, size = 'md' }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/ingresar');
      return;
    }
    setLoading(true);
    try {
      const res = following ? await followsApi.unfollow(userId) : await followsApi.follow(userId);
      onChange(!following, res.followersCount);
    } finally {
      setLoading(false);
    }
  }

  const label = following ? (hover ? 'Dejar de seguir' : 'Siguiendo') : 'Seguir';

  return (
    <button
      type="button"
      className={`btn follow-btn follow-btn--${size} ${following ? 'btn-outline follow-btn--active' : 'btn-primary'}`}
      onClick={toggle}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={following}
    >
      {label}
    </button>
  );
}
