import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationRequestsApi } from '../api/verificationRequests';
import Field from '../components/ui/Field';
import CityAutocomplete from '../components/CityAutocomplete';
import DocumentPicker from '../components/DocumentPicker';
import '../pages/publish.css';

const initialForm = {
  organizationName: '', organizationType: 'refugio', responsibleName: '',
  email: '', phone: '', address: '',
  yearsInOperation: '', animalsHoused: '', website: '', description: '',
};

const DOCUMENT_INPUTS = [
  { field: 'statute', label: 'Estatuto o constancia de la organización' },
  { field: 'responsibleId', label: 'DNI del responsable' },
  { field: 'municipalPermit', label: 'Habilitación municipal' },
  { field: 'facilityPhotos', label: 'Fotos de las instalaciones' },
];

const initialDocuments = { statute: [], responsibleId: [], municipalPermit: [], facilityPhotos: [] };

export default function RequestVerificationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [city, setCity] = useState(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setDocuments_(field, files) {
    setDocuments((d) => ({ ...d, [field]: files }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!city) {
      setError('Elegí la ciudad de la lista de sugerencias.');
      return;
    }

    const missingDoc = DOCUMENT_INPUTS.find(({ field }) => documents[field].length === 0);
    if (missingDoc) {
      setError(`Falta adjuntar: ${missingDoc.label}.`);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      fd.append('city', city.name);
      fd.append('province', city.province);
      DOCUMENT_INPUTS.forEach(({ field }) => documents[field].forEach((file) => fd.append(field, file)));

      await verificationRequestsApi.submit(fd);
      setSuccess(true);
    } catch (err) {
      if (err.details?.length) {
        setError(err.details.map((d) => d.message).join(' '));
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container publish-page">
        <div className="card publish-card">
          <h1>¡Listo!</h1>
          <p className="publish-subtitle">
            Enviamos tu solicitud de verificación. Un administrador la va a revisar y te vamos a avisar el resultado.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container publish-page">
      <div className="card publish-card">
        <h1>Solicitá tu verificación</h1>
        <p className="publish-subtitle">
          Para refugios, veterinarias y asociaciones proteccionistas. Un administrador va a revisar tus datos y documentación.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Nombre de la organización" htmlFor="organizationName">
            <input id="organizationName" className="input" required value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)} />
          </Field>

          <Field label="Tipo de organización" htmlFor="organizationType">
            <select id="organizationType" className="input" value={form.organizationType} onChange={(e) => set('organizationType', e.target.value)}>
              <option value="refugio">Refugio</option>
              <option value="veterinaria">Veterinaria</option>
              <option value="asociacion">Asociación protectora</option>
            </select>
          </Field>

          <div className="field-row">
            <Field label="Responsable" htmlFor="responsibleName">
              <input id="responsibleName" className="input" required value={form.responsibleName} onChange={(e) => set('responsibleName', e.target.value)} />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <input id="phone" className="input" required placeholder="+54 9 11 1234-5678" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </div>

          <Field label="Email de contacto" htmlFor="email">
            <input id="email" type="email" className="input" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>

          <Field label="Dirección" htmlFor="address">
            <input id="address" className="input" required placeholder="Calle y número" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>

          <Field label="Ciudad o pueblo" htmlFor="city">
            <CityAutocomplete id="city" value={city} onChange={setCity} />
          </Field>

          <div className="field-row">
            <Field label="Años en funcionamiento" htmlFor="yearsInOperation">
              <input id="yearsInOperation" type="number" min="0" className="input" required value={form.yearsInOperation} onChange={(e) => set('yearsInOperation', e.target.value)} />
            </Field>
            <Field label="Animales albergados" htmlFor="animalsHoused">
              <input id="animalsHoused" type="number" min="0" className="input" required value={form.animalsHoused} onChange={(e) => set('animalsHoused', e.target.value)} />
            </Field>
          </div>

          <Field label="Sitio web / Redes" htmlFor="website" hint="Opcional">
            <input id="website" className="input" placeholder="instagram.com/tu-organizacion" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </Field>

          <Field label="Descripción" htmlFor="description">
            <textarea id="description" className="input" required rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <h2 style={{ fontSize: '1.05rem', marginTop: 24, marginBottom: 8 }}>Documentación adjunta</h2>
          <p className="publish-subtitle" style={{ marginBottom: 12 }}>Se acepta PDF o imágenes (JPG, PNG, WEBP), hasta 10 MB cada uno. Podés subir varios archivos por campo.</p>

          {DOCUMENT_INPUTS.map(({ field, label }) => (
            <Field key={field} label={label} htmlFor={field}>
              <DocumentPicker
                id={field}
                files={documents[field]}
                onChange={(files) => setDocuments_(field, files)}
                accept="application/pdf,image/jpeg,image/png,image/webp"
              />
            </Field>
          ))}

          <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
