export interface PreferenceItem { title: string; quantity: number; unit_price: number; description?: string }
export interface CreatePreferencePayload { items: PreferenceItem[]; external_reference?: string; payer?: { name?: string; email?: string; }; }

export async function createPreference(payload: CreatePreferencePayload) {
  // This endpoint must be implemented server-side using your Access Token (never expose it in the client)
  const res = await fetch('/api/mercadopago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create preference: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ id: string; init_point?: string; sandbox_init_point?: string }>; 
}

export function getPublicKey(): string | undefined {
  return (import.meta as any).env?.VITE_MP_PUBLIC_KEY || (typeof window !== 'undefined' ? (window as any).__MP_PUBLIC_KEY : undefined);
}
