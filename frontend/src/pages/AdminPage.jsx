import { useEffect, useState } from 'react';
import { adminApi } from '../api/admin';
import ChatImage from '../components/ChatImage';
import ImageLightbox from '../components/ImageLightbox';
import { ShieldIcon, UserIcon } from '../components/icons/Icons';
import { timeAgo } from '../utils/format';
import '../components/row-list.css';
import './admin.css';

export default function AdminPage() {
  const [tab, setTab] = useState('users');

  return (
    <div className="container admin-page">
      <div className="admin-page__header">
        <ShieldIcon size={22} />
        <h1>Administración</h1>
      </div>

      <div className="listing-tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Usuarios</button>
        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reportes</button>
        <button className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>Auditoría</button>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'actions' && <ActionsTab />}
    </div>
  );
}

function UsersTab() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function load() {
    adminApi.listUsers(q).then((d) => setUsers(d.users));
  }

  async function handleBan(user) {
    const reason = prompt(`¿Por qué suspendés a ${user.first_name} ${user.last_name}? (opcional)`) || '';
    await adminApi.banUser(user.id, reason);
    setMessage(`${user.first_name} fue suspendido.`);
    load();
  }

  async function handleUnban(user) {
    await adminApi.unbanUser(user.id);
    setMessage(`${user.first_name} fue reactivado.`);
    load();
  }

  async function handleDelete(user) {
    if (!confirm(`¿Eliminar definitivamente la cuenta de ${user.first_name} ${user.last_name}? Se borran también sus publicaciones.`)) return;
    const reason = prompt('Motivo (opcional)') || '';
    await adminApi.deleteUser(user.id, reason);
    setMessage(`${user.first_name} fue eliminado.`);
    load();
  }

  return (
    <div>
      <input className="input" placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 16 }} />
      {message && <div className="alert alert-info" style={{ marginBottom: 16 }}>{message}</div>}

      {!users ? null : users.length === 0 ? (
        <div className="listing-empty"><p>Sin resultados.</p></div>
      ) : (
        <ul className="row-list">
          {users.map((u) => (
            <li key={u.id} className="row-card">
              <span className="row-card__avatar"><UserIcon size={18} /></span>
              <div className="row-card__info">
                <strong>{u.first_name} {u.last_name}</strong>
                <span className="row-card__meta">{u.email} · {u.role}</span>
              </div>
              <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {u.status === 'active' ? 'Activo' : 'Suspendido'}
              </span>
              <div className="row-card__actions">
                {u.status === 'active' ? (
                  <button className="btn btn-outline btn-sm" onClick={() => handleBan(u)}>Suspender</button>
                ) : (
                  <button className="btn btn-outline btn-sm" onClick={() => handleUnban(u)}>Reactivar</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionsTab() {
  const [actions, setActions] = useState(null);

  useEffect(() => {
    adminApi.actions().then((d) => setActions(d.actions));
  }, []);

  const LABELS = {
    delete_pet: 'Eliminó una publicación',
    ban_user: 'Suspendió un usuario',
    delete_user: 'Eliminó un usuario',
    flag_outdated_pet: 'Marcó una publicación como desactualizada',
    remove_message: 'Eliminó un mensaje del chat',
  };

  return !actions ? null : actions.length === 0 ? (
    <div className="listing-empty"><p>Sin acciones registradas.</p></div>
  ) : (
    <ul className="row-list">
      {actions.map((a) => (
        <li key={a.id} className="row-card">
          <span className="row-card__avatar"><ShieldIcon size={16} /></span>
          <div className="row-card__info">
            <strong>{a.admin_first_name} {a.admin_last_name}</strong>
            <span className="row-card__meta">{LABELS[a.action_type] || a.action_type}{a.reason ? ` — ${a.reason}` : ''}</span>
          </div>
          <time className="row-card__time">{timeAgo(a.created_at)}</time>
        </li>
      ))}
    </ul>
  );
}

const REPORT_REASONS = {
  inapropiado: 'Contenido inapropiado o ilegal',
  acoso: 'Acoso o maltrato',
  spam: 'Spam o publicidad',
  otro: 'Otro motivo',
};

function ReportsTab() {
  const [status, setStatus] = useState('pendiente');
  const [reports, setReports] = useState(null);
  const [message, setMessage] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setReports(null);
    adminApi.reports(status).then((d) => setReports(d.reports));
  }, [status]);

  async function resolve(report, action) {
    let note = '';
    if (action === 'remove') {
      if (!confirm('¿Eliminar este mensaje? Se borran su texto y sus fotos y se avisa al autor.')) return;
      note = prompt('Motivo (opcional, queda en la auditoría)') || '';
    }
    await adminApi.resolveReport(report.id, action, note);
    setMessage(action === 'remove' ? 'Mensaje eliminado.' : 'Reporte descartado.');
    setReports((list) => list.filter((r) => r.message.id !== report.message.id));
  }

  async function handleBanSender(report) {
    const sender = report.message.sender;
    const reason = prompt(`¿Por qué suspendés a ${sender.name}? (opcional)`) || '';
    await adminApi.banUser(sender.id, reason);
    setMessage(`${sender.name} fue suspendido.`);
  }

  return (
    <div>
      <div className="listing-tabs" style={{ marginBottom: 16 }}>
        {[['pendiente', 'Pendientes'], ['resuelto', 'Resueltos'], ['descartado', 'Descartados']].map(([value, label]) => (
          <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>
      {message && <div className="alert alert-info" style={{ marginBottom: 16 }}>{message}</div>}

      {!reports ? null : reports.length === 0 ? (
        <div className="listing-empty"><p>No hay reportes {status === 'pendiente' ? 'pendientes' : status === 'resuelto' ? 'resueltos' : 'descartados'}.</p></div>
      ) : (
        <ul className="row-list">
          {reports.map((r) => (
            <li key={r.id} className="card report-card">
              <div className="report-card__head">
                <span className="badge badge-warning">{REPORT_REASONS[r.reason] || r.reason}</span>
                <time className="row-card__time">{timeAgo(r.createdAt)}</time>
              </div>
              <p className="report-card__who">
                <strong>{r.reporter.name}</strong> reportó un mensaje de <strong>{r.message.sender ? r.message.sender.name : 'una cuenta eliminada'}</strong>
                {r.message.sender?.status === 'banned' && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Suspendido</span>}
              </p>
              {r.comment && <p className="report-card__comment">“{r.comment}”</p>}

              <div className="report-card__message">
                {r.message.removed ? (
                  <em>Mensaje eliminado.</em>
                ) : (
                  <>
                    {r.message.content && <p>{r.message.content}</p>}
                    {r.message.attachments.length > 0 && (
                      <div className="report-card__photos">
                        {r.message.attachments.map((a) => (
                          <ChatImage key={a.id} attachment={a} onOpen={() => setLightbox(a)} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {status === 'pendiente' && (
                <div className="row-card__actions">
                  <button className="btn btn-outline btn-sm" onClick={() => resolve(r, 'dismiss')}>Descartar</button>
                  {r.message.sender && r.message.sender.status !== 'banned' && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleBanSender(r)}>Suspender al autor</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => resolve(r, 'remove')}>Eliminar mensaje</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {lightbox && <ImageLightbox attachment={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
