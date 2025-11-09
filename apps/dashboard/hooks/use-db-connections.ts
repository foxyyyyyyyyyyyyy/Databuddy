"use client";

import { authClient } from "@databuddy/auth/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

type DbConnection = Awaited<
	ReturnType<
		ReturnType<typeof orpc.dbConnections.list.queryOptions>["queryFn"]
	>
>[number];

export type { DbConnection };
export type CreateDbConnectionData = {
	name: string;
	type?: string;
	url: string;
	organizationId?: string;
};
export type UpdateDbConnectionData = {
	id: string;
	name?: string;
};

export function useDbConnections() {
	const { data: activeOrganization, isPending: isLoadingOrganization } =
		authClient.useActiveOrganization();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
		...orpc.dbConnections.list.queryOptions({
			input: { organizationId: activeOrganization?.id },
		}),
		enabled: !isLoadingOrganization,
	});

	return {
		connections: data ?? [],
		isLoading: isLoading || isLoadingOrganization,
		isFetching,
		isError,
		error,
		refetch,
	};
}

export function useDbConnection(id: string) {
	return useQuery({
		...orpc.dbConnections.getById.queryOptions({ input: { id } }),
		enabled: !!id,
	});
}

export function useCreateDbConnection({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (errorMessage: string) => void;
} = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.dbConnections.create.mutationOptions(),
		onSuccess: (newConnection, variables) => {
			const listKey = orpc.dbConnections.list.queryOptions({
				input: { organizationId: variables.organizationId ?? undefined },
			}).queryKey;

			queryClient.setQueryData<DbConnection[]>(listKey, (old) => {
				if (!old) {
					return [newConnection];
				}
				const exists = old.some((c) => c.id === newConnection.id);
				return exists ? old : [...old, newConnection];
			});
			onSuccess?.();
		},
		onError: (error) => {
			console.error("Failed to create database connection:", error);
			onError?.(error instanceof Error ? error.message : String(error));
		},
	});
}

export function useUpdateDbConnection({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (errorMessage: string) => void;
} = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.dbConnections.update.mutationOptions(),
		onSuccess: (updatedConnection) => {
			const getByIdKey = orpc.dbConnections.getById.queryOptions({
				input: { id: updatedConnection.id },
			}).queryKey;
			const listKey = orpc.dbConnections.list.queryOptions({
				input: { organizationId: updatedConnection.organizationId ?? undefined },
			}).queryKey;

			queryClient.setQueryData<DbConnection[]>(listKey, (old) => {
				if (!old) {
					return old;
				}
				return old.map((connection) =>
					connection.id === updatedConnection.id
						? updatedConnection
						: connection
				);
			});

			queryClient.setQueryData(getByIdKey, updatedConnection);
			onSuccess?.();
		},
		onError: (error) => {
			console.error("Failed to update database connection:", error);
			onError?.(error instanceof Error ? error.message : String(error));
		},
	});
}

export function useDeleteDbConnection({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (errorMessage: string) => void;
} = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.dbConnections.delete.mutationOptions(),
		onMutate: async ({ id }) => {
			const getByIdKey = orpc.dbConnections.getById.queryOptions({
				input: { id },
			}).queryKey;
			const previousConnection = queryClient.getQueryData<DbConnection>(
				getByIdKey
			);

			const listKey = orpc.dbConnections.list.queryOptions({
				input: {
					organizationId: previousConnection?.organizationId ?? undefined,
				},
			}).queryKey;

			await queryClient.cancelQueries({ queryKey: listKey });
			const previousData = queryClient.getQueryData<DbConnection[]>(listKey);

			queryClient.setQueryData<DbConnection[]>(listKey, (old) => {
				if (!old) {
					return old;
				}
				return old.filter((c) => c.id !== id);
			});

			return { previousData, listKey };
		},
		onError: (error, _variables, context) => {
			if (context?.previousData && context.listKey) {
				queryClient.setQueryData(context.listKey, context.previousData);
			}
			onError?.(error instanceof Error ? error.message : String(error));
		},
		onSuccess: (_data, { id }) => {
			const getByIdKey = orpc.dbConnections.getById.queryOptions({
				input: { id },
			}).queryKey;
			queryClient.setQueryData(getByIdKey, undefined);
			onSuccess?.();
		},
	});
}
