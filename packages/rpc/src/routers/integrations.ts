import { account, and, db, eq } from "@databuddy/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../orpc";

export type IntegrationInfo = {
	id: string;
	provider: string;
	accountId: string;
	connected: boolean;
	connectedAt: string;
	scope?: string;
	metadata?: Record<string, unknown>;
}

const disconnectIntegrationSchema = z.object({
	provider: z.enum(["vercel"]),
});

export const integrationsRouter = {
	getIntegrations: protectedProcedure.handler(async ({ context }) => {
		try {
			const userId = context.user.id;

			const connectedAccounts = await db
				.select({
					id: account.id,
					providerId: account.providerId,
					accountId: account.accountId,
					createdAt: account.createdAt,
					scope: account.scope,
				})
				.from(account)
				.where(eq(account.userId, userId));

			// Define available integrations
			const availableIntegrations = [
				{
					id: "vercel",
					name: "Vercel",
					description:
						"Deploy and host your websites with automatic deployments from Git.",
					logo: "/vercel.svg",
					category: "deployment" as const,
				},
			];

			// Map integrations with connection status
			const integrations = availableIntegrations.map((integration) => {
				const connectedAccount = connectedAccounts.find(
					(acc) => acc.providerId === integration.id
				);

				return {
					...integration,
					connected: !!connectedAccount,
					connectionInfo: connectedAccount
						? {
							id: connectedAccount.id,
							accountId: connectedAccount.accountId,
							connectedAt: connectedAccount.createdAt,
							scope: connectedAccount.scope,
						}
						: null,
				};
			});

			return {
				integrations,
				totalConnected: connectedAccounts.length,
			};
		} catch (error) {
			console.error("Error fetching integrations:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to fetch integrations",
			});
		}
	}),

	// Get specific integration details
	getIntegration: protectedProcedure
		.input(z.object({ provider: z.enum(["vercel"]) }))
		.handler(async ({ input, context }) => {
			try {
				const userId = context.user.id;

				const connectedAccount = await db
					.select({
						id: account.id,
						providerId: account.providerId,
						accountId: account.accountId,
						createdAt: account.createdAt,
						updatedAt: account.updatedAt,
						scope: account.scope,
					})
					.from(account)
					.where(
						and(
							eq(account.userId, userId),
							eq(account.providerId, input.provider)
						)
					)
					.limit(1);

				if (!connectedAccount.length) {
					return {
						connected: false,
						provider: input.provider,
					};
				}

				const integration = connectedAccount[0];
				let parsedScope: any = null;

				try {
					parsedScope = integration.scope
						? JSON.parse(integration.scope)
						: null;
				} catch {
					// Ignore JSON parse errors
				}

				return {
					connected: true,
					provider: input.provider,
					id: integration.id,
					accountId: integration.accountId,
					connectedAt: integration.createdAt,
					updatedAt: integration.updatedAt,
					scope: parsedScope,
				};
			} catch (error) {
				console.error("Error fetching integration:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch integration details",
				});
			}
		}),

	// Disconnect an integration
	disconnect: protectedProcedure
		.input(disconnectIntegrationSchema)
		.handler(async ({ input, context }) => {
			try {
				const userId = context.user.id;

				// Find the connected account
				const connectedAccount = await db
					.select({ id: account.id })
					.from(account)
					.where(
						and(
							eq(account.userId, userId),
							eq(account.providerId, input.provider)
						)
					)
					.limit(1);

				if (!connectedAccount.length) {
					throw new ORPCError("NOT_FOUND", {
						message: "Integration not found or not connected",
					});
				}

				// Delete the account record
				await db.delete(account).where(eq(account.id, connectedAccount[0].id));

				return {
					success: true,
					message: `${input.provider} integration disconnected successfully`,
				};
			} catch (error) {
				console.error("Error disconnecting integration:", error);

				if (error instanceof ORPCError) {
					throw error;
				}

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to disconnect integration",
				});
			}
		}),

	// Get integration statistics
	getStats: protectedProcedure.handler(async ({ context }) => {
		try {
			const userId = context.user.id;

			const connectedAccounts = await db
				.select({
					providerId: account.providerId,
					createdAt: account.createdAt,
				})
				.from(account)
				.where(eq(account.userId, userId));

			const stats = {
				totalConnected: connectedAccounts.length,
				byProvider: connectedAccounts.reduce(
					(acc, account) => {
						acc[account.providerId] = (acc[account.providerId] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				),
				recentConnections: connectedAccounts
					.sort(
						(a, b) =>
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
					.slice(0, 5)
					.map((account) => ({
						provider: account.providerId,
						connectedAt: account.createdAt,
					})),
			};

			return stats;
		} catch (error) {
			console.error("Error fetching integration stats:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to fetch integration statistics",
			});
		}
	}),
};
