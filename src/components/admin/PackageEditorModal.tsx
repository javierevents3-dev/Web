import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DBPackage, updatePackage } from '../../utils/packagesService';

interface PackageEditorModalProps {
  open: boolean;
  onClose: () => void;
  pkg: DBPackage | null;
  onSaved?: (updated: DBPackage) => void;
}

const PackageEditorModal: React.FC<PackageEditorModalProps> = ({ open, onClose, pkg, onSaved }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<string | undefined>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pkg) return;
    setTitle(pkg.title || '');
    setPrice(Number(pkg.price) || 0);
    setDuration(pkg.duration || '');
    setDescription(pkg.description || '');
    setFeaturesText((pkg.features || []).join('\n'));
    setImageUrl(pkg.image_url || '');
    setCategory(pkg.category || '');
  }, [pkg]);

  const handleSave = async () => {
    if (!pkg) return;
    try {
      setSaving(true);
      setError(null);
      const updates = {
        title,
        price: Number(price) || 0,
        duration,
        description,
        features: featuresText
          .split('\n')
          .map(f => f.trim())
          .filter(Boolean),
        image_url: imageUrl,
        category: category || undefined,
      } as Partial<DBPackage>;
      await updatePackage(pkg.id, updates);
      const updated: DBPackage = { ...pkg, ...updates } as DBPackage;
      onSaved && onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar pacote');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !pkg) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Editar pacote</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Duração</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Recursos (um por linha)</label>
            <textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={5} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Imagem (URL)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Categoria (opcional)</label>
            <input value={category || ''} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageEditorModal;
