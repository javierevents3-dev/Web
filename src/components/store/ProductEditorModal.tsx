import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { db } from '../../utils/firebaseClient';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface ProductInput {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  tags?: string[];
  active?: boolean;
  allow_name?: boolean;
  allow_custom_image?: boolean;
  variants?: { name: string; priceDelta: number }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  product: ProductInput | null; // if null => creating
  onSaved: () => void;
}

const ProductEditorModal: React.FC<Props> = ({ open, onClose, product, onSaved }) => {
  const [form, setForm] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    category: 'otros',
    image_url: '',
    tags: [],
    active: true,
    allow_name: true,
    allow_custom_image: true,
    variants: []
  });
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        price: Number(product.price) || 0,
        category: product.category || 'otros',
        image_url: product.image_url || '',
        tags: product.tags || [],
        active: product.active !== false,
        allow_name: product.allow_name !== false,
        allow_custom_image: product.allow_custom_image !== false,
        variants: product.variants || []
      });
      setTagsText((product.tags || []).join(', '));
    } else {
      setForm({
        name: '',
        description: '',
        price: 0,
        category: 'otros',
        image_url: '',
        tags: [],
        active: true,
        allow_name: true,
        allow_custom_image: true,
        variants: []
      });
      setTagsText('');
    }
  }, [product]);

  const handleUpload = async (file: File) => {
    const storage = getStorage();
    const key = `product_images/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, key);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setForm(prev => ({ ...prev, image_url: url }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload: any = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        category: form.category,
        image_url: form.image_url,
        tags: (tagsText || '').split(',').map(t => t.trim()).filter(Boolean),
        active: !!form.active,
        allow_name: !!form.allow_name,
        allow_custom_image: !!form.allow_custom_image,
        variants: form.variants || [],
        updated_at: new Date().toISOString(),
      };
      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload);
      } else {
        await addDoc(collection(db, 'products'), { ...payload, created_at: new Date().toISOString() });
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('Error saving product', e);
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{form.id ? 'Editar Producto' : 'Agregar Producto'}</h3>
          <button onClick={onClose} className="p-2 rounded-none border border-black text-black hover:bg-black hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nombre del Producto</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Precio</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Categoría</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Imagen del Producto</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-500 cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload size={18} className="inline mr-2" /> Haz clic para subir imagen (JPG, PNG, WebP)
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])} />
            </div>
            {form.image_url && (
              <div className="mt-3 relative">
                <img src={form.image_url} alt="preview" className="w-full h-48 object-cover rounded" />
                <button className="absolute top-2 right-2 bg-white border-2 border-black text-black rounded-none p-1 hover:bg-black hover:text-white" onClick={() => setForm({ ...form, image_url: '' })}>
                  <X size={14} />
                </button>
              </div>
            )}
            <input
              placeholder="o pega la URL manualmente"
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              className="mt-2 w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags (separados por comas)</label>
            <input value={tagsText} onChange={e => setTagsText(e.target.value)} className="w-full px-3 py-2 border rounded-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.allow_name} onChange={e => setForm({ ...form, allow_name: e.target.checked })} /> Permite personalización con nombre</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.allow_custom_image} onChange={e => setForm({ ...form, allow_custom_image: e.target.checked })} /> Permite subir imagen personalizada</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Variantes del Producto</span>
              <button className="flex items-center gap-1 text-sm border-2 border-black text-black px-2 py-1 rounded-none hover:bg-black hover:text-white" onClick={() => setForm(f => ({ ...f, variants: [...(f.variants || []), { name: '', priceDelta: 0 }] }))}><Plus size={14} /> Agregar Variante</button>
            </div>
            <div className="space-y-2">
              {(form.variants || []).map((v, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                  <input placeholder="Nombre" value={v.name} onChange={e => setForm(f => ({ ...f, variants: f.variants!.map((vv, idx) => idx === i ? { ...vv, name: e.target.value } : vv) }))} className="md:col-span-3 px-3 py-2 border rounded-none" />
                  <input type="number" step="0.01" placeholder="Δ Precio" value={v.priceDelta} onChange={e => setForm(f => ({ ...f, variants: f.variants!.map((vv, idx) => idx === i ? { ...vv, priceDelta: Number(e.target.value) } : vv) }))} className="px-3 py-2 border rounded-none" />
                  <button className="justify-self-end border-2 border-black text-black px-2 py-2 rounded-none hover:bg-black hover:text-white" onClick={() => setForm(f => ({ ...f, variants: (f.variants || []).filter((_, idx) => idx !== i) }))}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-none border-2 border-black text-black hover:bg-black hover:text-white">Cancelar</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-none bg-black text-white disabled:opacity-50">{saving ? 'Guardando...' : (form.id ? 'Actualizar Producto' : 'Crear Producto')}</button>
        </div>
      </div>
    </div>
  );
};

export default ProductEditorModal;
