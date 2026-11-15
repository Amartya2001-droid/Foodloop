import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { request } from "@/lib/http";
import { queryClient } from "@/lib/queryClient";
import type {
  OrganizationMembership,
  OrganizationReview,
} from "@shared/schema";
type Access = {
  role: string | null;
  canReview: boolean;
  canEdit: boolean;
  reviewerConfigured: boolean;
  canManageMembers: boolean;
  myMembership: OrganizationMembership | null;
  memberships: (OrganizationMembership & { username: string })[];
  reviews: OrganizationReview[];
};
function useOrganizationAction() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const act = async (path: string, body: unknown) => {
    setBusy(true);
    setError("");
    try {
      await request(path, "POST", body);
      await queryClient.invalidateQueries();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, act };
}
export function OrganizationAccountPanel() {
  const account = useQuery<{ user: { id: string } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const invites = useQuery<
    (OrganizationMembership & { organizationName: string })[]
  >({
    queryKey: ["/api/organization-invitations"],
    enabled: !!account.data?.user,
  });
  const capabilities = useQuery<{ isReviewer: boolean }>({
    queryKey: ["/api/organization-capabilities"],
    enabled: !!account.data?.user,
  });
  const queue = useQuery<(OrganizationReview & { organizationName: string })[]>(
    {
      queryKey: ["/api/organization-review-queue"],
      enabled: !!capabilities.data?.isReviewer,
    },
  );
  const { error, busy, act } = useOrganizationAction();
  if (!account.data?.user) return null;
  return (
    <section className="space-y-4">
      {(invites.error || queue.error) && (
        <p role="alert">
          Could not load organization invitations or review queue.
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {!!invites.data?.length && (
        <div className="border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-semibold">Your invitations</h2>
          {invites.data.map((row) => (
            <article key={row.id} className="flex flex-wrap items-center gap-3">
              <Link
                className="underline"
                href={`/organizations/${row.organizationId}`}
              >
                {row.organizationName}
              </Link>
              <span>{row.role}</span>
              <Button
                disabled={busy}
                onClick={() =>
                  act(
                    `/api/organizations/${row.organizationId}/memberships/${row.id}/actions`,
                    { action: "accept" },
                  )
                }
              >
                Accept invitation
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  act(
                    `/api/organizations/${row.organizationId}/memberships/${row.id}/actions`,
                    { action: "decline" },
                  )
                }
              >
                Decline
              </Button>
            </article>
          ))}
        </div>
      )}
      {capabilities.data?.isReviewer && (
        <div className="border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-semibold">Independent review queue</h2>
          <p>Only organizations you do not own or belong to appear here.</p>
          {!queue.data?.length && !queue.isLoading && (
            <p>No pending independent reviews.</p>
          )}
          {queue.data?.map((row) => (
            <p key={row.id}>
              <Link
                className="underline"
                href={`/organizations/${row.organizationId}`}
              >
                Review {row.organizationName}
              </Link>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
export default function OrganizationPermissions({
  id,
  name,
  description,
}: {
  id: string;
  name: string;
  description: string;
}) {
  const account = useQuery<{ user: { id: string } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const access = useQuery<Access>({
    queryKey: [`/api/organizations/${id}/access`],
    enabled: !!account.data?.user,
  });
  const { error, busy, act } = useOrganizationAction();
  const root = `/api/organizations/${id}`;
  if (!account.data?.user)
    return <p>Sign in to manage membership or review permissions.</p>;
  if (access.isLoading) return <p>Loading permissions…</p>;
  if (access.error || !access.data)
    return <p role="alert">Could not load organization permissions.</p>;
  const data = access.data;
  return (
    <section className="border rounded-2xl p-6 space-y-5">
      <h2 className="text-2xl font-semibold">Membership & review</h2>
      <p>
        Your role: {data.role ?? "visitor"}. Owners manage invitations and
        roles; managers edit profiles; active members may associate their own
        donations. Members cannot edit another donor's food.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {data.myMembership?.status === "invited" && (
        <Button
          disabled={busy}
          onClick={() =>
            act(`${root}/memberships/${data.myMembership!.id}/actions`, {
              action: "accept",
            })
          }
        >
          Accept invitation
        </Button>
      )}
      {data.myMembership?.status === "active" && (
        <Button
          disabled={busy}
          variant="outline"
          onClick={() =>
            act(`${root}/memberships/${data.myMembership!.id}/actions`, {
              action: "remove",
            })
          }
        >
          Leave organization
        </Button>
      )}
      {data.canManageMembers && (
        <form
          className="flex flex-wrap gap-3 items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            act(`${root}/memberships`, Object.fromEntries(form));
          }}
        >
          <label>
            Account username
            <Input name="username" required minLength={3} maxLength={40} />
          </label>
          <label>
            Invited role
            <select
              name="role"
              className="border rounded-md p-2 block bg-background"
            >
              <option value="member">member</option>
              <option value="manager">manager</option>
            </select>
          </label>
          <Button disabled={busy}>Invite account</Button>
        </form>
      )}
      {!!data.memberships.length && (
        <ul className="space-y-3">
          {data.memberships.map((row) => (
            <li
              key={row.id}
              className="flex gap-3 flex-wrap items-center border-b py-2"
            >
              <span>
                {row.username} · {row.role} · {row.status}
              </span>
              {data.canManageMembers &&
                ["active", "invited"].includes(row.status) && (
                  <>
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() =>
                        act(`${root}/memberships/${row.id}/actions`, {
                          action: "role",
                          role: row.role === "member" ? "manager" : "member",
                        })
                      }
                    >
                      Make {row.role === "member" ? "manager" : "member"}
                    </Button>
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() =>
                        act(`${root}/memberships/${row.id}/actions`, {
                          action: "remove",
                        })
                      }
                    >
                      Remove {row.username}
                    </Button>
                  </>
                )}
            </li>
          ))}
        </ul>
      )}
      {data.canEdit && (
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            act(
              `${root}/profile`,
              Object.fromEntries(new FormData(event.currentTarget)),
            );
          }}
        >
          <h3 className="text-lg font-semibold">Edit profile</h3>
          <p className="text-sm text-muted-foreground">
            Changing the profile invalidates any previous verification and
            pending review.
          </p>
          <label className="block">
            Organization name
            <Input
              aria-label="Organization name"
              name="name"
              defaultValue={name}
              required
              maxLength={150}
            />
          </label>
          <label className="block">
            Profile description
            <Textarea
              aria-label="Profile description"
              name="description"
              defaultValue={description}
              required
              maxLength={2000}
            />
          </label>
          <Button disabled={busy}>Save profile</Button>
        </form>
      )}
      <div className="border-t pt-4 space-y-3">
        <h3 className="text-lg font-semibold">Organization review</h3>
        <p className="text-sm">
          A configured reviewer must be independent of this organization. Review
          records describe an app profile review, not food-safety or regulatory
          certification.
        </p>
        {!data.reviewerConfigured && (
          <p className="text-amber-700">
            No reviewer configured yet. Requests can be saved but cannot be
            approved until Amartya configures trusted reviewer account IDs.
          </p>
        )}
        {data.role === "owner" && (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              act(
                `${root}/verification-requests`,
                Object.fromEntries(new FormData(event.currentTarget)),
              );
            }}
          >
            <label className="block">
              Evidence for reviewer
              <Textarea
                name="evidence"
                required
                minLength={10}
                maxLength={4000}
                placeholder="Describe evidence and any independently checkable references. Do not include secrets."
              />
            </label>
            <Button disabled={busy}>Request independent review</Button>
          </form>
        )}
        {data.reviews.map((row) => (
          <article className="border rounded-lg p-4 space-y-2" key={row.id}>
            <h4 className="font-medium">
              {row.status} · {new Date(row.requestedAt).toLocaleString()}
            </h4>
            <p>{row.evidence}</p>
            {row.note && <p>Review note: {row.note}</p>}
            {row.reviewedAt && (
              <p className="text-sm">
                Reviewed {new Date(row.reviewedAt).toLocaleString()}
              </p>
            )}
            {data.canReview && row.status === "pending" && (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  act(
                    `${root}/verification-requests/${row.id}/review`,
                    Object.fromEntries(new FormData(event.currentTarget)),
                  );
                }}
              >
                <label className="block">
                  Decision
                  <select
                    name="decision"
                    className="border rounded-md p-2 block bg-background"
                  >
                    <option value="rejected">Reject</option>
                    <option value="approved">Approve profile review</option>
                  </select>
                </label>
                <label className="block">
                  Review rationale
                  <Textarea
                    name="note"
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                </label>
                <Button disabled={busy}>Record review decision</Button>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
