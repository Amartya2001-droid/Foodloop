import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowUpRight, Leaf, MapPin, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PostFoodForm from '@/components/PostFoodForm';
import ReservationForm from '@/components/ReservationForm';
import { queryClient } from '@/lib/queryClient';
import type { FoodListing } from '@shared/schema';
export default function HomePage() {
  const [posting, setPosting] = useState(false), [selected, setSelected] = useState<string | null>(null), [search, setSearch] = useState('');
  const listings = useQuery<FoodListing[]>({ queryKey: ['/api/food-listings'], refetchInterval: 30000 });
  const account = useQuery<{ user: { id: string } | null }>({ queryKey: ['/api/auth/me'] });
  const filtered = listings.data?.filter(item => `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="max-w-7xl mx-auto px-5 py-10 space-y-10">
    <section className="rounded-3xl bg-emerald-950 text-emerald-50 p-8 md:p-14 grid md:grid-cols-[2fr_1fr] gap-10 items-center">
      <div><p className="uppercase tracking-widest text-xs text-emerald-300 mb-5">Community food exchange</p><h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-2xl">Good food.<br />A better next stop.</h1><p className="text-emerald-100/80 mt-6 max-w-lg text-lg">Share surplus food, arrange a pickup, and make every donation count.</p><Button className="mt-7 bg-emerald-300 text-emerald-950 hover:bg-emerald-200" size="lg" onClick={() => setPosting(true)}>Post surplus food <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div>
      <div className="rounded-2xl border border-emerald-700 p-6 space-y-5"><Leaf className="h-10 w-10 text-emerald-300" /><h2 className="text-xl font-medium">From offer to pickup</h2><ol className="space-y-3 text-emerald-100/80 text-sm"><li>1. Post what you have and where to collect it.</li><li>2. A neighbor reserves a pickup time.</li><li>3. Both sides confirm the handoff.</li></ol><Link href="/impact" className="text-emerald-300 inline-block">View recorded impact →</Link></div>
    </section>
    <section aria-labelledby="available-heading" className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-end"><div><p className="text-sm text-emerald-700 font-medium">Find your next pickup</p><h2 id="available-heading" className="text-3xl font-semibold mt-1">Available food</h2></div><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search food" placeholder="Search food or location" value={search} onChange={event => setSearch(event.target.value)} className="pl-9 w-72" /></div></div>
      {listings.isLoading && <p>Loading food…</p>}{listings.error && <p role="alert">Could not load food. <button onClick={() => listings.refetch()} className="underline">Retry</button></p>}
      {!listings.isLoading && !listings.error && !filtered?.length && <div className="border border-dashed rounded-2xl p-12 text-center"><Package className="mx-auto mb-3 text-emerald-700" /><h3 className="text-xl font-medium">{search ? 'No matches yet' : 'A fresh start'}</h3><p className="text-muted-foreground mt-2">{search ? 'Try another food or location.' : 'No available donations. Post the first offer to get things moving.'}</p></div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtered?.map(item => <article key={item.id} className="border rounded-2xl overflow-hidden bg-card flex flex-col">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover" /> : <div className="h-36 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center"><Leaf className="h-12 w-12 text-emerald-700" /></div>}
        <div className="p-5 space-y-3 flex-1 flex flex-col"><p className="text-xs uppercase tracking-wider text-emerald-700">{item.category} · {item.cost || 'Free'}</p><h3 className="text-xl font-semibold">{item.title}</h3><p className="text-muted-foreground">{item.quantity}</p><p className="text-sm line-clamp-2">{item.description}</p><p className="text-sm flex gap-2"><MapPin className="w-4 h-4 shrink-0" />{item.location}</p><p className="text-xs text-muted-foreground">{item.expiryDate ? `Expires ${new Date(item.expiryDate).toLocaleString()}` : 'Ask the donor about food expiry'}</p><div className="flex gap-3 items-center pt-3 mt-auto"><Link href={`/listings/${item.id}`} className="text-sm underline">Details & measurements</Link>{item.donorId !== account.data?.user?.id && <Button className="ml-auto" onClick={() => setSelected(item.id)}>Reserve</Button>}</div></div>
      </article>)}</div>
    </section>
    <Dialog open={posting} onOpenChange={setPosting}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Post surplus food</DialogTitle></DialogHeader><PostFoodForm onSuccess={() => { setPosting(false); queryClient.invalidateQueries(); }} /></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>Arrange a pickup</DialogTitle></DialogHeader>{selected && <ReservationForm listingId={selected} onSuccess={() => setSelected(null)} />}</DialogContent></Dialog>
  </main>;
}
