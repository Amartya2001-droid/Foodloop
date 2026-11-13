import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queryClient } from '@/lib/queryClient';
export default function ReservationForm({ listingId, onSuccess }: { listingId: string; onSuccess: () => void }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/food-listings/${listingId}/reservations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, pickupAt: new Date(String(data.pickupAt)).toISOString() }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      await queryClient.invalidateQueries(); onSuccess();
    } catch (error: any) { setError(error.message); } finally { setBusy(false); }
  }}>
    <p>Choose a pickup time within the donor's window. Your contact details are shared with the donor only. Reservations expire two hours after the arranged time, or at food expiry if earlier.</p>
    <label className="block">Pickup time<Input name="pickupAt" type="datetime-local" required /></label>
    <label className="block">Contact email or phone<Input name="contact" required minLength={3} maxLength={200} /></label>
    <label className="block">Pickup notes<Input name="notes" maxLength={1000} placeholder="How should the donor find you?" /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button disabled={busy}>{busy ? 'Reserving…' : 'Reserve food'}</Button>
  </form>;
}
