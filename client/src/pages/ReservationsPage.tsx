import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import type { Claim, FoodListing } from '@shared/schema';
type Reservation = Claim & { listing: FoodListing; donorName: string };
export default function ReservationsPage() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState('');
  const account = useQuery<{ user: { id: string } | null }>({ queryKey: ['/api/auth/me'] });
  const reservations = useQuery<Reservation[]>({ queryKey: ['/api/reservations'], enabled: !!account.data?.user, refetchInterval: 30000 });
  const listings = useQuery<FoodListing[]>({ queryKey: ['/api/my-listings'], enabled: !!account.data?.user });
  async function act(id: string, action: string) {
    setBusy(id); setError('');
    try {
      const response = await fetch(`/api/reservations/${id}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      await queryClient.invalidateQueries();
    } catch (error: any) { setError(error.message); } finally { setBusy(''); }
  }
  return <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <Link href="/">← Browse food</Link><h1 className="text-3xl font-bold">Reservations & pickups</h1>
    <p>Recipients mark food picked up; donors confirm completion. Only confirmed pickups count toward completed donations.</p>
    {!account.data?.user ? <p>Sign in above to manage your donations and reservations.</p> : <>
      {(reservations.isLoading || listings.isLoading) && <p>Loading…</p>}
      {(reservations.error || listings.error) && <p role="alert">Could not load your dashboard. Please retry.</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <h2 className="text-xl font-semibold">Your donations</h2>
      {!listings.data?.length && !listings.isLoading && <p>No donations yet. Post surplus food from the home page.</p>}
      {listings.data?.map(item => <article key={item.id} className="border rounded-lg p-4"><h3 className="font-semibold">{item.title}</h3><p>{item.quantity} · {item.status}</p></article>)}
      <h2 className="text-xl font-semibold">Your reservation activity</h2>
      {!reservations.data?.length && !reservations.isLoading && <p>No reservations yet.</p>}
      {reservations.data?.map(item => {
        const donor = item.listing.donorId === account.data?.user?.id;
        return <article key={item.id} className="border rounded-lg p-5 space-y-3">
          <h3 className="text-lg font-semibold">{item.listing.title} · {item.status.replace('_', ' ')}</h3>
          <p>{donor ? `Recipient: ${item.claimerName}` : `Donor: ${item.donorName}`} · {item.listing.quantity}</p>
          <p>{item.pickupAt ? new Date(item.pickupAt).toLocaleString() : 'No arranged time'} · {item.listing.location}</p>
          <p>Recipient contact: {item.claimerContact}</p><p>{item.pickupNotes}</p>
          <div className="flex flex-wrap gap-2">
            {item.status === 'reserved' && <><Button variant="outline" disabled={busy === item.id} onClick={() => act(item.id, 'cancel')}>Cancel reservation</Button>{!donor && <Button disabled={busy === item.id} onClick={() => act(item.id, 'picked_up')}>I picked it up</Button>}</>}
            {donor && item.status === 'picked_up' && <Button disabled={busy === item.id} onClick={() => act(item.id, 'complete')}>Confirm completed pickup</Button>}
          </div>
        </article>;
      })}
    </>}
  </main>;
}
