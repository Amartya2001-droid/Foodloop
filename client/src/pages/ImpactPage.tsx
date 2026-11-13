import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
export interface Supplier {
  supplierId: string;
  supplierName: string;
  totalListings: number;
  activeListings: number;
  completedPickups: number;
}
export default function ImpactPage() {
  const impact = useQuery<{
    completedPickups: number;
    activeReservations: number;
    donorCount: number;
    reportedWeightKg: number;
    pickupsWithReportedWeight: number;
    days: { day: string; completedPickups: number }[];
  }>({ queryKey: ["/api/impact"], refetchInterval: 30000 });
  const suppliers = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  return (
    <main className="max-w-6xl mx-auto px-5 py-10 space-y-8">
      <div>
        <p className="text-sm text-emerald-700">Evidence, not estimates</p>
        <h1 className="text-4xl font-semibold mt-2">Community impact</h1>
        <p className="text-muted-foreground mt-4">
          Recorded activity in this app. Completed pickups require recipient
          pickup and donor confirmation.
        </p>
      </div>
      {impact.isLoading && <p>Loading recorded activity…</p>}
      {impact.error && <p role="alert">Could not load impact.</p>}
      {impact.data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Confirmed pickups", impact.data.completedPickups],
              ["Active reservations", impact.data.activeReservations],
              ["Donors with completed pickups", impact.data.donorCount],
              ["Donor-reported weight (kg)", impact.data.reportedWeightKg],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border p-6">
                <h2 className="text-sm text-muted-foreground">{label}</h2>
                <p className="text-4xl font-semibold mt-3">{value}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Weight is reported by donors for{" "}
            {impact.data.pickupsWithReportedWeight} completed pickups; it is not
            independently measured. Meals and CO₂ savings are not measured and
            are not estimated here.
          </p>
          <section className="border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Confirmed pickups · last 7 days (UTC)
            </h2>
            <div className="flex gap-3 items-end h-48">
              {impact.data.days.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                >
                  <span className="text-sm">{day.completedPickups}</span>
                  <div
                    className="bg-emerald-600 rounded-t-md w-full"
                    style={{
                      height: `${(day.completedPickups / Math.max(1, ...impact.data!.days.map((item) => item.completedPickups))) * 110}px`,
                      minHeight: day.completedPickups ? 4 : 0,
                    }}
                  />
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={day.day}
                  >
                    {day.day.slice(5)}
                  </time>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Supplier activity</h2>
        <p className="text-muted-foreground">
          Actual donation history, not AI ratings, Google reviews or
          certification.
        </p>
        {suppliers.isLoading && <p>Loading suppliers…</p>}
        {suppliers.error && <p role="alert">Could not load suppliers.</p>}
        {!suppliers.isLoading &&
          !suppliers.error &&
          !suppliers.data?.length && (
            <p>
              No supplier activity yet.{" "}
              <Link href="/" className="underline">
                Post a donation
              </Link>{" "}
              to get started.
            </p>
          )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.data?.map((item) => (
            <article className="border rounded-2xl p-5" key={item.supplierId}>
              <h3 className="text-lg font-semibold">{item.supplierName}</h3>
              <p className="text-muted-foreground mt-3">
                {item.totalListings} donations posted · {item.activeListings}{" "}
                available
              </p>
              <p className="mt-2">{item.completedPickups} confirmed pickups</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
