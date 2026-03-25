import type { AssistantTool } from "../types";

export const rename: AssistantTool = {
  name: "rename",
  category: "files",
  description: "Rename a file or folder",
  label: "Rename a file or folder",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path of the file or folder to rename",
      },
      newName: { type: "string", description: "The new name" },
    },
    required: ["path", "newName"],
  },
  execute: async (params, client) => {
    return { success: false, message: "Rename not yet implemented" };
  },
  confirmationDetails: (params, t) => ({
    title: t("assistant.tools.rename.confirm_title"),
    fields: [
      { label: t("assistant.tools.rename.path"), value: params.path as string },
      {
        label: t("assistant.tools.rename.new_name"),
        value: params.newName as string,
      },
    ],
  }),
  resultMessage: (params, result, t) =>
    result.success
      ? t("assistant.tools.rename.success", {
          path: params.path,
          newName: params.newName,
        })
      : t("assistant.tools.rename.error", {
          path: params.path,
          error: result.message,
        }),
};
