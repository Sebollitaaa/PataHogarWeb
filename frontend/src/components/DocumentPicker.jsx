import { useRef } from 'react';
import { FileIcon, PlusIcon, XIcon } from './icons/Icons';
import './document-picker.css';

const MAX_FILES = 10;

/**
 * Selector de archivos múltiple para documentos de una solicitud: las fotos se
 * muestran como miniatura (igual que en una publicación), y el resto (PDFs) con
 * un ícono de documento y el nombre del archivo.
 */
export default function DocumentPicker({ files, onChange, accept, id }) {
  const inputRef = useRef(null);

  function handleSelect(e) {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, MAX_FILES);
    onChange(combined);
    e.target.value = '';
  }

  function removeAt(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="document-picker">
      <div className="document-picker__grid">
        {files.map((file, i) => (
          <div key={i} className="document-picker__item">
            {file.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt="" />
            ) : (
              <div className="document-picker__file">
                <FileIcon size={26} />
                <span>{file.name}</span>
              </div>
            )}
            <button type="button" onClick={() => removeAt(i)} aria-label="Quitar archivo"><XIcon size={14} /></button>
          </div>
        ))}
        {files.length < MAX_FILES && (
          <button type="button" className="document-picker__add" onClick={() => inputRef.current.click()}>
            <PlusIcon size={20} />
            <span>Agregar</span>
          </button>
        )}
      </div>
      <input
        id={id} ref={inputRef} type="file" accept={accept} multiple hidden
        onChange={handleSelect}
      />
    </div>
  );
}
