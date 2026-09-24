import {
  type CreateRewardInput,
  type ListOwnRewardsQuery,
  type ListRewardsQuery,
  type OwnRewardsPage,
  type ReplaceAssignmentsInput,
  type Reward,
  type RewardsPage,
  type UpdateRewardInput,
  ownRewardsPageSchema,
  rewardSchema,
  rewardsPageSchema,
  type ImageContentType,
  type UploadUrl,
  uploadUrlSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

const emptySchema = z.unknown();

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

export function createReward(input: CreateRewardInput): Promise<Reward> {
  return apiFetch("/rewards", rewardSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchRewards(query: Partial<ListRewardsQuery> = {}): Promise<RewardsPage> {
  return apiFetch(
    `/rewards${queryString({ page: query.page, pageSize: query.pageSize, status: query.status })}`,
    rewardsPageSchema,
  );
}

export function updateReward(rewardId: string, input: UpdateRewardInput): Promise<Reward> {
  return apiFetch(`/rewards/${rewardId}`, rewardSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function replaceAssignments(
  rewardId: string,
  input: ReplaceAssignmentsInput,
): Promise<Reward> {
  return apiFetch(`/rewards/${rewardId}/assignments`, rewardSchema, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function requestPendingRewardImageUploadUrl(
  contentType: ImageContentType,
): Promise<UploadUrl> {
  return apiFetch(`/rewards/image/upload-url`, uploadUrlSchema, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export function requestRewardImageUploadUrl(
  rewardId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  return apiFetch(`/rewards/${rewardId}/image/upload-url`, uploadUrlSchema, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export async function retireReward(rewardId: string): Promise<void> {
  await apiFetch(`/rewards/${rewardId}`, emptySchema, { method: "DELETE" });
}

export function fetchOwnRewards(
  query: Partial<ListOwnRewardsQuery> = {},
): Promise<OwnRewardsPage> {
  return apiFetch(
    `/rewards/mine${queryString({ page: query.page, pageSize: query.pageSize })}`,
    ownRewardsPageSchema,
  );
}

export const rewardsQueryKey = ["rewards"] as const;

export const rewardsPageQueryKey = (query: Partial<ListRewardsQuery>) =>
  ["rewards", "catalog", query] as const;

export const ownRewardsQueryKey = (query: Partial<ListOwnRewardsQuery> = {}) =>
  ["rewards", "mine", query] as const;
