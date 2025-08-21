import { z } from "zod";

// Schema for PublishToRelaysResult
export const PublishToRelayResultSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    relay: z.string(),
  }),
  z.object({
    success: z.literal(false),
    relay: z.string(),
    error: z.string(),
  }),
]);

// Schema for PublishEventResponse
export const PublishEventResponseSchema = z.object({
  message: z.string(),
  result: z.array(PublishToRelayResultSchema),
});

// Schema for MultiPublishEventResponse
export const MultiPublishEventResponseSchema = z.object({
  result: z.record(z.string(), PublishEventResponseSchema),
});

// Schema for the complete response structure returned by the functions
export const SinglePublishResponseSchema = z.object({
  success: z.boolean(),
  type: z.literal("single-publish"),
  message: z.string(),
  result: z.array(PublishToRelayResultSchema),
});

export const MultiPublishResponseSchema = z.object({
  success: z.boolean(),
  type: z.literal("multi-publish"),
  message: z.string(),
  result: z.record(z.string(), PublishEventResponseSchema),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.instanceof(Error).optional(),
});

// Union type for all possible response types
export const PublishResponseSchema = z.union([
  SinglePublishResponseSchema,
  MultiPublishResponseSchema,
  ErrorResponseSchema,
]);

export function isErrorResponse(response: PublishResponse): response is ErrorResponse {
  return response.success === false;
}

export function isSinglePublishResponse(
  response: SinglePublishResponse | MultiPublishResponse,
): response is SinglePublishResponse {
  return response.type === "single-publish";
}

export function isMultiPublishResponse(
  response: SinglePublishResponse | MultiPublishResponse,
): response is MultiPublishResponse {
  return response.type === "multi-publish";
}

export function isPublishResponseSuccess(
  response: PublishResponse,
): response is SinglePublishResponse | MultiPublishResponse {
  return response.success === true;
}

export function isPublishResponseError(response: PublishResponse): response is ErrorResponse {
  return response.success === false;
}

// Type exports for use in other files
export type PublishToRelayResult = z.infer<typeof PublishToRelayResultSchema>;
export type PublishEventResponse = z.infer<typeof PublishEventResponseSchema>;
export type MultiPublishEventResponse = z.infer<typeof MultiPublishEventResponseSchema>;
export type SinglePublishResponse = z.infer<typeof SinglePublishResponseSchema>;
export type MultiPublishResponse = z.infer<typeof MultiPublishResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PublishResponse = z.infer<typeof PublishResponseSchema>;
