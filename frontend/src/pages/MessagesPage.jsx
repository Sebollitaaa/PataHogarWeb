import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { conversationsApi } from '../api/conversations';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationsContext';
import FullPageSpinner from '../components/ui/FullPageSpinner';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import ChatImage from '../components/ChatImage';
import ImageLightbox from '../components/ImageLightbox';
import ReportMessageModal from '../components/ReportMessageModal';
import { ArchiveIcon, ArrowLeftIcon, CameraIcon, FlagIcon, SendIcon, TrashIcon, XIcon } from '../components/icons/Icons';
import { timeAgo } from '../utils/format';
import './messages.css';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { refresh: refreshNotifications } = useNotifications();

  const [groups, setGroups] = useState(null);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [sendError, setSendError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [reporting, setReporting] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    setLoadingThread(true);
    conversationsApi.messages(conversationId).then((d) => {
      setMessages(d.messages);
      setLoadingThread(false);
      loadConversations();
      refreshNotifications();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ conversationId: incomingId, message }) => {
      if (String(incomingId) === String(conversationId)) {
        setMessages((list) => [...list, message]);
        // El chat ya está abierto: le avisamos al backend que este mensaje se leyó
        // al toque, así la campanita no se queda con un número colgado.
        conversationsApi.messages(conversationId).then(() => refreshNotifications());
      }
      loadConversations();
    };
    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversationId]);

  function loadConversations() {
    conversationsApi.list().then((d) => setGroups(d.conversations));
  }

  // Las vistas previas usan object URLs: se liberan al cambiar de fotos o al salir.
  const previews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function handlePickPhotos(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    setSendError('');
    const valid = picked.filter((f) => f.type.startsWith('image/'));
    if (valid.length < picked.length) setSendError('Solo se pueden enviar fotos.');
    const tooBig = valid.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) {
      setSendError('Cada foto puede pesar hasta 8 MB.');
      return;
    }
    const next = [...photos, ...valid].slice(0, MAX_PHOTOS);
    if (photos.length + valid.length > MAX_PHOTOS) setSendError(`Podés enviar hasta ${MAX_PHOTOS} fotos por mensaje.`);
    setPhotos(next);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() && photos.length === 0) return;
    setSending(true);
    setSendError('');
    try {
      await conversationsApi.send(conversationId, draft.trim(), photos);
      setDraft('');
      setPhotos([]);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleArchive(chat, archived) {
    await conversationsApi.archive(chat.conversationId, archived);
    loadConversations();
  }

  async function handleDelete(chat) {
    if (!confirm('¿Eliminar esta conversación de tu lista?')) return;
    await conversationsApi.remove(chat.conversationId);
    if (String(chat.conversationId) === String(conversationId)) navigate('/mensajes');
    loadConversations();
  }

  if (groups === null) return <FullPageSpinner />;

  const visibleGroups = groups
    .map((g) => ({ ...g, chats: g.chats.filter((c) => showArchived || !c.archived) }))
    .filter((g) => g.chats.length > 0);

  const activeChat = groups.flatMap((g) => g.chats.map((c) => ({ ...c, counterpart: g.counterpart }))).find((c) => String(c.conversationId) === String(conversationId));

  return (
    <div className={`container messages-page ${conversationId ? 'has-active-chat' : ''}`}>
      <aside className="messages-sidebar">
        <div className="messages-sidebar__header">
          <h2>Mensajes</h2>
          <label className="checkbox-row" style={{ fontSize: '0.78rem' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Ver archivados
          </label>
        </div>

        {visibleGroups.length === 0 ? (
          <p className="messages-empty">No tenés conversaciones todavía.</p>
        ) : (
          <ul className="conversation-list">
            {visibleGroups.map((g) => {
              const single = g.chats.length === 1;
              const isExpanded = expandedPerson === g.counterpart.id;
              return (
                <li key={g.counterpart.id}>
                  <div className="conversation-list__row">
                    <Link to={`/usuarios/${g.counterpart.id}`} className="conversation-list__avatar-link" title="Ver perfil">
                      <Avatar url={g.counterpart.profilePhotoUrl} />
                    </Link>
                    <button
                      className="conversation-list__person"
                      onClick={() => single ? navigate(`/mensajes/${g.chats[0].conversationId}`) : setExpandedPerson(isExpanded ? null : g.counterpart.id)}
                    >
                      <span className="conversation-list__person-info">
                        <strong>
                          {g.counterpart.firstName} {g.counterpart.lastName}
                          {g.counterpart.isVerifiedOrganization && <VerifiedBadge size={13} />}
                        </strong>
                        {single && <span className="conversation-list__preview">{g.chats[0].lastMessagePreview}</span>}
                      </span>
                      {single && g.chats[0].unreadCount > 0 && <span className="badge-dot-static">{g.chats[0].unreadCount}</span>}
                    </button>
                  </div>

                  {(!single && isExpanded) && (
                    <ul className="conversation-list__subchats">
                      {g.chats.map((chat) => (
                        <li key={chat.conversationId}>
                          <button
                            className={String(chat.conversationId) === String(conversationId) ? 'active' : ''}
                            onClick={() => navigate(`/mensajes/${chat.conversationId}`)}
                          >
                            <span>{chat.petName}</span>
                            {chat.unreadCount > 0 && <span className="badge-dot-static">{chat.unreadCount}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="messages-thread">
        {!conversationId ? (
          <div className="messages-empty messages-empty--center">Elegí una conversación para ver los mensajes.</div>
        ) : !activeChat ? (
          <div className="messages-empty messages-empty--center">Esta conversación ya no está disponible.</div>
        ) : (
          <>
            <div className="messages-thread__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn-icon btn-ghost mobile-back" onClick={() => navigate('/mensajes')} aria-label="Volver">
                  <ArrowLeftIcon size={18} />
                </button>
                <Link to={`/usuarios/${activeChat.counterpart.id}`} className="messages-thread__counterpart-link">
                  <Avatar url={activeChat.counterpart.profilePhotoUrl} size={30} />
                  <strong>
                    {activeChat.counterpart.firstName} {activeChat.counterpart.lastName}
                    {activeChat.counterpart.isVerifiedOrganization && <VerifiedBadge size={13} />}
                  </strong>
                </Link>
                <span className="field-hint"> · sobre {activeChat.petName}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleArchive(activeChat, !activeChat.archived)}>
                  <ArchiveIcon size={15} /> {activeChat.archived ? 'Desarchivar' : 'Archivar'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleDelete(activeChat)}>
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>

            {loadingThread ? (
              <FullPageSpinner />
            ) : (
              <div className="messages-thread__body">
                {messages.map((m) => {
                  const own = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`bubble ${own ? 'bubble--own' : ''} ${m.removed ? 'bubble--removed' : ''}`}>
                      {m.removed ? (
                        <p><em>Un moderador eliminó este mensaje.</em></p>
                      ) : (
                        <>
                          {m.attachments.length > 0 && (
                            <div className={`bubble__photos bubble__photos--${Math.min(m.attachments.length, 4)}`}>
                              {m.attachments.map((a) => (
                                <ChatImage key={a.id} attachment={a} onOpen={() => setLightbox(a)} />
                              ))}
                            </div>
                          )}
                          {m.content && <p>{m.content}</p>}
                        </>
                      )}
                      <div className="bubble__footer">
                        {!own && !m.removed && (
                          <button type="button" className="bubble__report" title="Reportar mensaje" aria-label="Reportar mensaje" onClick={() => setReporting(m)}>
                            <FlagIcon size={13} />
                          </button>
                        )}
                        <time>{timeAgo(m.createdAt)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}

            {sendError && <div className="alert alert-error messages-thread__error">{sendError}</div>}

            {photos.length > 0 && (
              <div className="composer-previews">
                {previews.map((url, i) => (
                  <div key={url} className="composer-previews__item">
                    <img src={url} alt="" />
                    <button type="button" aria-label="Quitar foto" onClick={() => setPhotos((list) => list.filter((_, idx) => idx !== i))}>
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form className="messages-thread__composer" onSubmit={handleSend}>
              <button
                type="button" className="btn btn-outline btn-icon" aria-label="Adjuntar fotos" title="Adjuntar fotos"
                onClick={() => fileInputRef.current.click()} disabled={photos.length >= MAX_PHOTOS}
              >
                <CameraIcon size={18} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePickPhotos} />
              <input
                className="input" placeholder={photos.length ? 'Agregá un texto (opcional)…' : 'Escribí un mensaje…'}
                value={draft} onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-primary btn-icon" disabled={sending || (!draft.trim() && photos.length === 0)} aria-label="Enviar">
                <SendIcon size={18} />
              </button>
            </form>
          </>
        )}
      </section>
      {lightbox && <ImageLightbox attachment={lightbox} onClose={() => setLightbox(null)} />}
      {reporting && <ReportMessageModal message={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}
