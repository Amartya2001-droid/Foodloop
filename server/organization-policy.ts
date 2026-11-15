import { randomUUID } from "node:crypto";
import type {
  Organization,
  OrganizationMembership,
  OrganizationReview,
} from "@shared/schema";
import { WorkflowError } from "./reservations";
export type OrganizationState = {
  organization: Organization;
  memberships: OrganizationMembership[];
  reviews: OrganizationReview[];
};
export type OrgRole = "owner" | "manager" | "member";
export type OrganizationCommand =
  | { action: "invite"; targetUserId: string; role: "manager" | "member" }
  | { action: "accept"; membershipId: string }
  | { action: "decline"; membershipId: string }
  | { action: "remove"; membershipId: string }
  | { action: "role"; membershipId: string; role: "manager" | "member" }
  | {
      action: "profile";
      profile: Partial<
        Pick<
          Organization,
          | "name"
          | "description"
          | "location"
          | "contactEmail"
          | "contactPhone"
          | "website"
          | "latitude"
          | "longitude"
          | "type"
        >
      >;
    }
  | { action: "request_review"; evidence: string }
  | {
      action: "review";
      requestId: string;
      decision: "approved" | "rejected";
      note: string;
      authorizedReviewer: boolean;
    };
export function organizationRole(
  state: OrganizationState,
  userId: string,
): OrgRole | null {
  if (state.organization.ownerId === userId) return "owner";
  const membership = state.memberships.find(
    (row) => row.userId === userId && row.status === "active",
  );
  return membership?.role === "manager"
    ? "manager"
    : membership?.role === "member"
      ? "member"
      : null;
}
export function applyOrganizationCommand(
  original: OrganizationState,
  actor: string,
  command: OrganizationCommand,
  now = new Date(),
): OrganizationState {
  const state = structuredClone(original);
  const role = organizationRole(state, actor);
  const owner = role === "owner";
  const forbid = (
    condition: boolean,
    message = "Not authorized for this organization",
  ) => {
    if (!condition) throw new WorkflowError(403, message);
  };
  const member = (id: string) => {
    const row = state.memberships.find((row) => row.id === id);
    if (!row) throw new WorkflowError(404, "Membership not found");
    return row;
  };
  if (command.action === "invite") {
    forbid(owner);
    if (command.targetUserId === state.organization.ownerId)
      throw new WorkflowError(
        409,
        "Owner role is fixed and cannot be invited or removed",
      );
    let row = state.memberships.find(
      (row) => row.userId === command.targetUserId,
    );
    if (row && ["invited", "active"].includes(row.status))
      throw new WorkflowError(409, "User is already invited or active");
    if (!row) {
      row = {
        id: randomUUID(),
        organizationId: state.organization.id,
        userId: command.targetUserId,
        role: command.role,
        status: "invited",
        invitedBy: actor,
        updatedAt: now,
      };
      state.memberships.push(row);
    } else
      Object.assign(row, {
        role: command.role,
        status: "invited",
        invitedBy: actor,
        updatedAt: now,
      });
  } else if (command.action === "accept" || command.action === "decline") {
    const row = member(command.membershipId);
    forbid(row.userId === actor, "Only the invitee may accept or decline");
    if (row.status !== "invited")
      throw new WorkflowError(409, "Invitation is no longer pending");
    Object.assign(row, {
      status: command.action === "accept" ? "active" : "declined",
      updatedAt: now,
    });
  } else if (command.action === "remove" || command.action === "role") {
    const row = member(command.membershipId);
    forbid(owner || (command.action === "remove" && row.userId === actor));
    if (!["active", "invited"].includes(row.status))
      throw new WorkflowError(409, "Membership is not active or invited");
    Object.assign(
      row,
      command.action === "remove"
        ? { status: "removed", updatedAt: now }
        : { role: command.role, updatedAt: now },
    );
  } else if (command.action === "profile") {
    forbid(owner || role === "manager");
    Object.assign(state.organization, command.profile, { verified: false });
    for (const review of state.reviews)
      if (review.status === "pending")
        Object.assign(review, {
          status: "superseded",
          reviewedAt: now,
          note: "Profile changed; submit a new review request",
        });
  } else if (command.action === "request_review") {
    forbid(owner);
    if (
      state.organization.verified ||
      state.reviews.some((row) => row.status === "pending")
    )
      throw new WorkflowError(409, "Already verified or awaiting review");
    state.reviews.push({
      id: randomUUID(),
      organizationId: state.organization.id,
      requestedBy: actor,
      evidence: command.evidence,
      status: "pending",
      requestedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      note: null,
    });
  } else if (command.action === "review") {
    forbid(
      command.authorizedReviewer,
      "A configured reviewer account is required",
    );
    forbid(
      !owner && !state.memberships.some((row) => row.userId === actor),
      "Reviewers must be independent of this organization",
    );
    const review = state.reviews.find((row) => row.id === command.requestId);
    if (!review) throw new WorkflowError(404, "Review request not found");
    if (review.status !== "pending")
      throw new WorkflowError(409, "Review request is no longer pending");
    Object.assign(review, {
      status: command.decision,
      reviewedBy: actor,
      reviewedAt: now,
      note: command.note,
    });
    state.organization.verified = command.decision === "approved";
  }
  return state;
}
