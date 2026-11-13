import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { request } from '@/lib/http';
import type { Organization } from '@shared/schema';
interface Props { onSubmit?: (data: any) => void; onSuccess?: () => void }
export default function PostFoodForm({ onSuccess }: Props) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const account = useQuery<{ user: { id: string } | null }>({ queryKey: ['/api/auth/me'] });
  const organizations = useQuery<Organization[]>({ queryKey: ['/api/organizations'] });
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget);
    for (const name of ['expiryDate', 'pickupTimeStart', 'pickupTimeEnd']) {
      const value = form.get(name); if (value) form.set(name, new Date(String(value)).toISOString());
    }
    try { await request('/api/food-listings', 'POST', form); onSuccess?.(); }
    catch (error: any) { setError(error.message); } finally { setBusy(false); }
  }}>
    <p className="text-sm text-muted-foreground">Describe the food and allergens honestly. Optional weight is donor-reported and counts only after confirmed pickup.</p>
    <label className="block">Title<Input name="title" required maxLength={150} /></label>
    <label className="block">Description & allergens<Textarea name="description" required maxLength={2000} /></label>
    <div className="grid sm:grid-cols-2 gap-4">
      <label>Quantity<Input name="quantity" required maxLength={100} placeholder="e.g. 2 loaves" /></label>
      <label>Category<select name="category" className="border rounded-md w-full p-2 bg-background">{['produce', 'bakery', 'dairy', 'prepared', 'packaged', 'other'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Weight (kg, optional)<Input name="weightKg" type="number" min="0.001" max="10000" step="0.001" /></label>
      <label>Cost or free<Input name="cost" maxLength={100} placeholder="Free" /></label>
    </div>
    <label className="block">Pickup address or landmark<Input name="location" required maxLength={300} /></label>
    <div className="grid sm:grid-cols-2 gap-4">
      <label>Latitude<Input name="latitude" type="number" step="any" min="-90" max="90" required /></label>
      <label>Longitude<Input name="longitude" type="number" step="any" min="-180" max="180" required /></label>
      <label>Pickup window starts<Input name="pickupTimeStart" type="datetime-local" /></label>
      <label>Pickup window ends<Input name="pickupTimeEnd" type="datetime-local" /></label>
    </div>
    <label className="block">Food expires (optional)<Input name="expiryDate" type="datetime-local" /></label>
    <label className="block">Organization<select name="organizationId" className="border rounded-md w-full p-2 bg-background"><option value="">Personal donation</option>{organizations.data?.filter(item => item.ownerId === account.data?.user?.id).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label className="block">Photo (optional)<Input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button disabled={busy || !account.data?.user}>{busy ? 'Posting…' : account.data?.user ? 'Post donation' : 'Sign in to post'}</Button>
  </form>;
}
