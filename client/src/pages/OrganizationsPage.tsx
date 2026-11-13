import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { request } from '@/lib/http';
import { queryClient } from '@/lib/queryClient';
import type { Organization } from '@shared/schema';
import type { Supplier } from './ImpactPage';
export function OrganizationDetailPage() {
  const { id } = useParams(); const organization = useQuery<Organization & { suppliers: Supplier[] }>({ queryKey: [`/api/organizations/${id}`] });
  if (organization.isLoading) return <p className="p-10">Loading organization…</p>;
  if (organization.error || !organization.data) return <p className="p-10" role="alert">Organization could not be loaded.</p>;
  const item = organization.data;
  return <main className="max-w-5xl mx-auto p-5 py-10 space-y-5"><Link href="/organizations">← Organizations</Link><h1 className="text-4xl font-semibold">{item.name}</h1><p className="text-sm text-muted-foreground">Community-submitted profile · Not independently verified</p><p>{item.description}</p><p>{item.location}</p><p>{item.contactEmail} · {item.contactPhone}</p><h2 className="text-2xl font-semibold pt-5">Donation activity</h2><p>Donations explicitly associated with this organization by its owner.</p>{!item.suppliers.length && <p>No donation activity yet.</p>}{item.suppliers.map(supplier => <article key={supplier.supplierId} className="border rounded-2xl p-5"><h3 className="font-semibold">{supplier.supplierName}</h3><p>{supplier.totalListings} donations · {supplier.activeListings} available · {supplier.completedPickups} confirmed pickups</p></article>)}</main>;
}
export default function OrganizationsPage() {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [showForm, setShowForm] = useState(false);
  const organizations = useQuery<Organization[]>({ queryKey: ['/api/organizations'] });
  const account = useQuery<{ user: { id: string } | null }>({ queryKey: ['/api/auth/me'] });
  return <main className="max-w-6xl mx-auto px-5 py-10 space-y-7"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-4xl font-semibold">Community organizations</h1><p className="text-muted-foreground mt-4">User-created profiles. No certification or third-party verification is claimed.</p></div><Button onClick={() => setShowForm(!showForm)}>Add organization</Button></div>
    {showForm && <form className="border rounded-2xl p-6 grid sm:grid-cols-2 gap-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError(''); const form = Object.fromEntries(new FormData(event.currentTarget));
      try { await request('/api/organizations', 'POST', { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }); await queryClient.invalidateQueries(); setShowForm(false); }
      catch (error: any) { setError(error.message); } finally { setBusy(false); }
    }}><h2 className="text-xl font-semibold sm:col-span-2">Create your organization profile</h2>{[['name', 'Name'], ['description', 'Description'], ['location', 'Address'], ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone']].map(([name, label]) => <label key={name}>{label}<Input name={name} type={name === 'contactEmail' ? 'email' : 'text'} required maxLength={name === 'description' ? 2000 : 150} /></label>)}<label>Type<select name="type" className="border w-full p-2 rounded-md bg-background">{['food_bank', 'community_fridge', 'ngo', 'other'].map(type => <option key={type}>{type}</option>)}</select></label><label>Latitude<Input name="latitude" type="number" step="any" min="-90" max="90" required /></label><label>Longitude<Input name="longitude" type="number" step="any" min="-180" max="180" required /></label>{error && <p role="alert" className="text-destructive sm:col-span-2">{error}</p>}<Button disabled={busy || !account.data?.user}>{busy ? 'Saving…' : account.data?.user ? 'Create profile' : 'Sign in to create'}</Button></form>}
    {organizations.isLoading && <p>Loading profiles…</p>}{organizations.error && <p role="alert">Could not load organizations.</p>}{!organizations.isLoading && !organizations.error && !organizations.data?.length && <p className="border border-dashed rounded-2xl p-10">No organizations yet. Create a profile and associate your next donation with it.</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{organizations.data?.map(item => <article className="border rounded-2xl p-6 space-y-3" key={item.id}><p className="text-xs uppercase tracking-wide text-emerald-700">{item.type.replace('_', ' ')}</p><h2 className="text-xl font-semibold">{item.name}</h2><p className="text-muted-foreground">{item.description}</p><p>{item.location}</p><Link href={`/organizations/${item.id}`} className="inline-block underline">Profile & activity →</Link></article>)}</div>
  </main>;
}
