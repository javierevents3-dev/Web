import { db } from './firebaseClient';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebaseClient';

export type PackageType = 'portrait' | 'maternity' | 'events';

export interface DBPackage {
  id: string;
  type: PackageType;
  title: string;
  price: number; // BRL value
  duration: string;
  description: string;
  features: string[];
  image_url: string;
  category?: string; // e.g., 'wedding', 'prewedding'
  created_at?: string;
}

export const fetchPackages = async (type?: PackageType): Promise<DBPackage[]> => {
  const col = collection(db, 'packages');
  let q = type ? query(col, where('type', '==', type), orderBy('created_at', 'desc')) : query(col, orderBy('created_at', 'desc'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DBPackage, 'id'>) }));
  } catch (e: any) {
    const msg = String(e?.message || '');
    const code = String(e?.code || '');
    const needsIndex = code === 'failed-precondition' || msg.toLowerCase().includes('requires an index');
    if (needsIndex) {
      try {
        const q2 = type ? query(col, where('type', '==', type)) : query(col);
        const snap2 = await getDocs(q2);
        return snap2.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DBPackage, 'id'>) }));
      } catch (e2) {
        console.warn('fetchPackages fallback failed', e2);
        return [];
      }
    }
    console.warn('fetchPackages (firebase) failed, returning []', e);
    return [];
  }
};

export const createPackage = async (pkg: Omit<DBPackage, 'id' | 'created_at'>) => {
  try {
    await addDoc(collection(db, 'packages'), { ...pkg, created_at: new Date().toISOString() });
  } catch (e) {
    console.error('createPackage (firebase) failed', e);
    throw e;
  }
};

export const updatePackage = async (id: string, updates: Partial<DBPackage>) => {
  try {
    await updateDoc(doc(db, 'packages', id), updates);
  } catch (e) {
    console.error('updatePackage (firebase) failed', e);
    throw e;
  }
};

export const deletePackage = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'packages', id));
  } catch (e) {
    console.error('deletePackage (firebase) failed', e);
    throw e;
  }
};
