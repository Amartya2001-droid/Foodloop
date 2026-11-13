import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function AccountBar() {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['/api/auth/me'], queryFn: async () => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Cannot load account');
    return response.json() as Promise<{ user: { id: string; username: string } | null }>;
  }, retry: false });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      queryClient.clear();
      await queryClient.invalidateQueries();
      window.location.reload();
    } catch (error: any) { setError(error.message); } finally { setBusy(false); }
  }
  return <aside className="border-b bg-muted/40 px-4 py-3" aria-label="Account">
    <div className="max-w-7xl mx-auto">
      {isLoading ? <p>Loading account…</p> : data?.user ? <div className="flex items-center gap-4"><strong>Signed in as {data.user.username}</strong><Button variant="outline" onClick={async () => {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) { queryClient.clear(); window.location.reload(); } else setError('Could not sign out');
      }}>Sign out</Button></div> : <form onSubmit={submit} className="flex flex-wrap gap-2 items-center">
        <strong>{register ? 'Create account' : 'Sign in'}</strong>
        <Input aria-label="Username" name="username" autoComplete="username" required minLength={3} maxLength={40} placeholder="Username" className="w-40" />
        <Input aria-label="Password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} placeholder="Password (12+ characters)" className="w-64" />
        <Button disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</Button>
        <Button type="button" variant="ghost" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Have an account? Sign in' : 'New here? Create account'}</Button>
        <p className="text-sm text-muted-foreground">Sign in to post or reserve food. Local memory accounts reset on restart.</p>
      </form>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </div>
  </aside>;
}
