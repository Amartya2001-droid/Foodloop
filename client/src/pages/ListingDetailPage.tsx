import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { request } from "@/lib/http";
import { queryClient } from "@/lib/queryClient";
import ReservationForm from "@/components/ReservationForm";
import type { FoodListing, SensorData } from "@shared/schema";
export default function ListingDetailPage() {
  const { id } = useParams();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const listing = useQuery<FoodListing>({
    queryKey: [`/api/food-listings/${id}`],
  });
  const readings = useQuery<{ readings: SensorData[]; stale: boolean }>({
    queryKey: [`/api/food-listings/${id}/readings`],
    refetchInterval: 30000,
  });
  const account = useQuery<{ user: { id: string } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const owner = listing.data?.donorId === account.data?.user?.id;
  const analysis = listing.data?.aiAnalysis as {
    source: string;
    observedAt: string;
    notes: string;
    defects: string[];
    disclaimer: string;
  } | null;
  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: string,
  ) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const body =
        action === "inspect"
          ? form
          : action === "quality"
            ? {
                notes: form.get("notes"),
                defects: String(form.get("defects") || "")
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              }
            : {
                listingId: id,
                temperature: Number(form.get("temperature")),
                humidity: Number(form.get("humidity")),
              };
      await request(
        action === "sensor"
          ? "/api/sensor-data"
          : `/api/food-listings/${id}/${action}`,
        "POST",
        body,
      );
      setMessage("Saved.");
      await queryClient.invalidateQueries();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (listing.isLoading) return <main className="p-10">Loading donation…</main>;
  if (listing.error || !listing.data)
    return (
      <main className="p-10" role="alert">
        Donation could not be loaded. <Link href="/">Browse food</Link>
      </main>
    );
  const item = listing.data;
  return (
    <main className="max-w-5xl mx-auto p-5 py-10 space-y-7">
      <Link href="/">← Browse food</Link>
      <div>
        <p className="uppercase text-xs tracking-wider text-emerald-700">
          {item.status} · {item.category}
        </p>
        <h1 className="text-4xl font-semibold mt-2">{item.title}</h1>
        <p className="text-xl mt-2 text-muted-foreground">
          {item.quantity} · {item.cost || "Free"}
        </p>
      </div>
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="max-h-80 rounded-2xl object-cover"
        />
      )}
      <p>{item.description}</p>
      <p>
        {item.location} ·{" "}
        <a
          className="underline"
          href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          View coordinates on OpenStreetMap
        </a>
      </p>
      <p>
        Pickup window:{" "}
        {item.pickupTimeStart
          ? new Date(item.pickupTimeStart).toLocaleString()
          : "Arrange with donor"}{" "}
        {item.pickupTimeEnd
          ? `to ${new Date(item.pickupTimeEnd).toLocaleString()}`
          : ""}
      </p>
      <p>
        Expiry:{" "}
        {item.expiryDate
          ? new Date(item.expiryDate).toLocaleString()
          : "Not specified"}{" "}
        · Reported weight:{" "}
        {item.weightKg != null ? `${item.weightKg} kg` : "Not measured"}
      </p>
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Temperature & humidity</h2>
          <p className="text-sm text-muted-foreground">
            Saved measurements in °C, with their recorded source. Hardware is
            not connected. Readings older than 15 minutes are marked stale.
          </p>
          {readings.error ? (
            <p role="alert">Could not load readings.</p>
          ) : readings.isLoading ? (
            <p>Loading readings…</p>
          ) : !readings.data?.readings.length ? (
            <p>No measurements recorded.</p>
          ) : (
            <>
              <p className="font-medium">
                {readings.data.stale ? "Stale reading" : "Recent reading"}
              </p>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {readings.data.readings.map((row) => (
                  <li key={row.id} className="border-b pb-2">
                    {row.temperature} °C · {row.humidity}% RH{" "}
                    <span className="block text-xs">
                      {row.source === "donor_submitted_measurement"
                        ? "Donor-submitted"
                        : "Source not recorded"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(row.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {owner && (
            <form
              onSubmit={(event) => submit(event, "sensor")}
              className="space-y-3"
            >
              <label className="block">
                Temperature (°C)
                <Input
                  name="temperature"
                  type="number"
                  step="any"
                  min="-80"
                  max="100"
                  required
                />
              </label>
              <label className="block">
                Humidity (%)
                <Input
                  name="humidity"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  required
                />
              </label>
              <Button disabled={busy}>Record measurement</Button>
            </form>
          )}
        </section>
        <section className="border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Quality observations</h2>
          {analysis?.source ? (
            <div>
              <p className="text-sm font-medium">
                {analysis.source === "openai"
                  ? "AI visual observation"
                  : "Donor observation"}{" "}
                · {new Date(analysis.observedAt).toLocaleString()}
              </p>
              <p className="mt-3">{analysis.notes}</p>
              {analysis.defects?.length > 0 && (
                <p>Reported defects: {analysis.defects.join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                {analysis.disclaimer}
              </p>
            </div>
          ) : (
            <p>
              No quality observations recorded. Absence of a report does not
              establish safety.
            </p>
          )}
          {owner && (
            <>
              <form
                onSubmit={(event) => submit(event, "quality")}
                className="space-y-3"
              >
                <label className="block">
                  What did you observe?
                  <Textarea name="notes" required maxLength={2000} />
                </label>
                <label className="block">
                  Visible defects (comma separated)
                  <Input name="defects" />
                </label>
                <Button disabled={busy}>Save observation</Button>
              </form>
              <form
                onSubmit={(event) => submit(event, "inspect")}
                className="border-t pt-4 space-y-3"
              >
                <label className="block">
                  Optional AI photo inspection
                  <Input
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    required
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  AI inspection needs a configured service. Manual observations
                  work without it. An image cannot certify food safety.
                </p>
                <Button disabled={busy} variant="outline">
                  Analyze & save photo observation
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
      {!owner && item.status === "available" && (
        <section className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Reserve this donation</h2>
          <ReservationForm
            listingId={item.id}
            onSuccess={() => {
              setMessage("Reserved. Manage your pickup from Pickups.");
              queryClient.invalidateQueries();
            }}
          />
        </section>
      )}
    </main>
  );
}
