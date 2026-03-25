import type { AssistantTool } from "../types";

export const move: AssistantTool = {
  name: "move",
  category: "files",
  description: "Move a file or folder to a different location",
  label: "Move a file or folder",
  parameters: {
    type: "object",
    properties: {
      sourcePath: {
        type: "string",
        description: "Current path of the file or folder",
      },
      destinationPath: { type: "string", description: "Target directory path" },
    },
    required: ["sourcePath", "destinationPath"],
  },
  execute: async (params, client) => {
    return { success: false, message: "Move not yet implemented" };
  },
  confirmationDetails: (params, t) => ({
    title: t("assistant.tools.move.confirm_title"),
    fields: [
      {
        label: t("assistant.tools.move.from"),
        value: params.sourcePath as string,
      },
      {
        label: t("assistant.tools.move.to"),
        value: params.destinationPath as string,
      },
    ],
  }),
  resultMessage: (params, result, t) =>
    result.success
      ? t("assistant.tools.move.success", {
          source: params.sourcePath,
          dest: params.destinationPath,
        })
      : t("assistant.tools.move.error", {
          source: params.sourcePath,
          error: result.message,
        }),
};
