import { useState } from 'react';
import { conversationsApi } from '../api/conversations';
import Field from './ui/Field';

const REASONS = [
  { value: 'inapropiado', label: 'Contenido inapropiado o ilegal' },
  { value: 'acoso', label: 'Acoso o maltrato' },
  { value: 'spam', label: 'Spam o publicidad' },
  { value: 'otro', label: 'Otro motivo' },
];

/** Formulario para reportar un mensaje del chat; lo revisa un moderador. */
export default function ReportMessageModal({ message, onClose }) {
  const [reason, setReason] = useState('inapropiado');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await conversationsApi.report(message.id, reason, comment.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="report-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card report-modal__card" onClick={(e) => e.stopPropagation()}>
        <h3>Reportar mensaje</h3>

        {sent ? (
          <>
            <div className="alert alert-success">Gracias. Un moderador va a revisar el mensaje.</div>
            <div className="report-modal__actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <Field label="Motivo" htmlFor="reportReason">
              <select id="reportReason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Comentario (opcional)" htmlFor="reportComment">
              <textarea
                id="reportComment" className="input" rows={3} maxLength={500}
                value={comment} onChange={(e) => setComment(e.target.value)}
              />
            </Field>
            <div className="report-modal__actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar reporte'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
