import type { Express, Response, Request } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireUser, userId } from "./auth";
import {
  organizationRole,
  type OrganizationCommand,
  type OrganizationState,
} from "./organization-policy";
import { WorkflowError } from "./reservations";
export const reviewerIds = () =>
  (process.env.ORGANIZATION_REVIEWER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
const independent = (state: OrganizationState, actor: string) =>
  state.organization.ownerId !== actor &&
  !state.memberships.some((row) => row.userId === actor);
const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    location: z.string().trim().min(1).max(300).optional(),
    contactEmail: z.string().email().max(200).optional(),
    contactPhone: z.string().max(100).optional(),
    website: z.string().url().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    type: z.enum(["food_bank", "community_fridge", "ngo", "other"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
function failure(res: Response, error: unknown) {
  res
    .status(
      error instanceof WorkflowError
        ? error.status
        : error instanceof z.ZodError
          ? 400
          : 500,
    )
    .json({
      error:
        error instanceof WorkflowError
          ? error.message
          : error instanceof z.ZodError
            ? "Invalid organization details"
            : "Organization service unavailable",
    });
}
export async function publicOrganization(id: string) {
  const state = await storage.getOrganizationState(id);
  if (!state) return undefined;
  const approved = state.reviews
    .filter(
      (row) => row.status === "approved" && row.reviewedBy && row.reviewedAt,
    )
    .sort((a, b) => b.reviewedAt!.getTime() - a.reviewedAt!.getTime())[0];
  const verified = state.organization.verified && !!approved;
  return {
    ...state.organization,
    verified,
    verificationStatus: verified
      ? "reviewed"
      : state.reviews.some((row) => row.status === "pending")
        ? "pending"
        : "unverified",
    reviewedAt: verified ? approved!.reviewedAt : null,
  };
}
export function installOrganizationRoutes(app: Express) {
  app.get("/api/organization-capabilities", requireUser, (_req, res) =>
    res.json({
      isReviewer: reviewerIds().includes(userId(res)),
      reviewerConfigured: reviewerIds().length > 0,
    }),
  );
  app.get("/api/my-organizations", requireUser, async (_req, res) => {
    try {
      const memberships = await storage.getMembershipsForUser(userId(res));
      const organizations = await storage.getAllOrganizations();
      res.json(
        await Promise.all(
          organizations
            .filter(
              (org) =>
                org.ownerId === userId(res) ||
                memberships.some(
                  (row) =>
                    row.organizationId === org.id && row.status === "active",
                ),
            )
            .map(async (org) => ({
              ...(await publicOrganization(org.id)),
              membershipRole:
                org.ownerId === userId(res)
                  ? "owner"
                  : memberships.find((row) => row.organizationId === org.id)
                      ?.role,
            })),
        ),
      );
    } catch (error) {
      failure(res, error);
    }
  });
  app.get("/api/organization-invitations", requireUser, async (_req, res) => {
    try {
      const memberships = await storage.getMembershipsForUser(userId(res));
      res.json(
        await Promise.all(
          memberships
            .filter((row) => row.status === "invited")
            .map(async (row) => ({
              ...row,
              organizationName: (
                await storage.getOrganization(row.organizationId)
              )?.name,
            })),
        ),
      );
    } catch (error) {
      failure(res, error);
    }
  });
  app.get("/api/organization-review-queue", requireUser, async (_req, res) => {
    try {
      if (!reviewerIds().includes(userId(res)))
        throw new WorkflowError(
          403,
          "A configured reviewer account is required",
        );
      const states = await Promise.all(
        (await storage.getAllOrganizations()).map((org) =>
          storage.getOrganizationState(org.id),
        ),
      );
      res.json(
        states
          .filter(
            (state): state is OrganizationState =>
              !!state && independent(state, userId(res)),
          )
          .flatMap((state) =>
            state.reviews
              .filter((row) => row.status === "pending")
              .map((row) => ({
                ...row,
                organizationName: state.organization.name,
              })),
          ),
      );
    } catch (error) {
      failure(res, error);
    }
  });
  app.get("/api/organizations/:id/access", requireUser, async (req, res) => {
    try {
      const state = await storage.getOrganizationState(req.params.id);
      if (!state) throw new WorkflowError(404, "Organization not found");
      const role = organizationRole(state, userId(res));
      const canReview =
        reviewerIds().includes(userId(res)) && independent(state, userId(res));
      const canEdit = role === "owner" || role === "manager";
      res.json({
        role,
        canReview,
        canEdit,
        reviewerConfigured: reviewerIds().length > 0,
        canManageMembers: role === "owner",
        myMembership:
          state.memberships.find((row) => row.userId === userId(res)) ?? null,
        memberships: canEdit
          ? await Promise.all(
              state.memberships.map(async (row) => ({
                ...row,
                username:
                  (await storage.getUser(row.userId))?.username ?? "Unknown",
              })),
            )
          : [],
        reviews: canEdit || canReview ? state.reviews : [],
      });
    } catch (error) {
      failure(res, error);
    }
  });
  const commandRoute = (
    path: string,
    parse: (
      req: Request,
      actor: string,
    ) => Promise<OrganizationCommand> | OrganizationCommand,
  ) => {
    app.post(path, requireUser, async (req, res) => {
      try {
        const command = await parse(req, userId(res));
        const state = await storage.organizationAction(
          req.params.id,
          userId(res),
          command,
        );
        res.json({
          organization: await publicOrganization(state.organization.id),
        });
      } catch (error) {
        failure(res, error);
      }
    });
  };
  commandRoute("/api/organizations/:id/memberships", async (req) => {
    const body = z
      .object({
        username: z.string().trim().toLowerCase().min(3).max(40),
        role: z.enum(["manager", "member"]),
      })
      .strict()
      .parse(req.body);
    const target = await storage.getUserByUsername(body.username);
    if (!target) throw new WorkflowError(404, "Account not found");
    if (reviewerIds().includes(target.id))
      throw new WorkflowError(
        409,
        "Configured reviewers cannot join organizations",
      );
    return { action: "invite", targetUserId: target.id, role: body.role };
  });
  commandRoute(
    "/api/organizations/:id/memberships/:membershipId/actions",
    (req) => {
      const body = z
        .discriminatedUnion("action", [
          z
            .object({ action: z.enum(["accept", "decline", "remove"]) })
            .strict(),
          z
            .object({
              action: z.literal("role"),
              role: z.enum(["member", "manager"]),
            })
            .strict(),
        ])
        .parse(req.body);
      return { ...body, membershipId: req.params.membershipId };
    },
  );
  commandRoute("/api/organizations/:id/profile", (req) => ({
    action: "profile",
    profile: profileSchema.parse(req.body),
  }));
  commandRoute("/api/organizations/:id/verification-requests", (req) => ({
    action: "request_review",
    evidence: z
      .object({ evidence: z.string().trim().min(10).max(4000) })
      .strict()
      .parse(req.body).evidence,
  }));
  commandRoute(
    "/api/organizations/:id/verification-requests/:requestId/review",
    (req, actor) => {
      const body = z
        .object({
          decision: z.enum(["approved", "rejected"]),
          note: z.string().trim().min(10).max(2000),
        })
        .strict()
        .parse(req.body);
      return {
        action: "review",
        requestId: req.params.requestId,
        ...body,
        authorizedReviewer: reviewerIds().includes(actor),
      };
    },
  );
}
