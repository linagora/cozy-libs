import type { AssistantTool } from "../types";

export const share: AssistantTool = {
  name: "share",
  category: "files",
  description: "Share a file or folder with someone",
  label: "Share a file or folder",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path of the file or folder to share",
      },
      email: {
        type: "string",
        description: "Email address of the person to share with",
      },
      readOnly: {
        type: "boolean",
        description: "Whether the share is read-only (defaults to true)",
      },
    },
    required: ["path", "email"],
  },
  execute: async (params, client) => {
    return { success: false, message: "Sharing not yet implemented" };
  },
  confirmationDetails: (params, t) => ({
    title: t("assistant.tools.share.confirm_title"),
    fields: [
      { label: t("assistant.tools.share.path"), value: params.path as string },
      {
        label: t("assistant.tools.share.recipient"),
        value: params.email as string,
      },
    ],
  }),
  resultMessage: (params, result, t) =>
    result.success
      ? t("assistant.tools.share.success", {
          path: params.path,
          email: params.email,
        })
      : t("assistant.tools.share.error", {
          path: params.path,
          error: result.message,
        }),
};
