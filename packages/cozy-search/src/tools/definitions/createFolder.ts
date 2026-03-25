import type { AssistantTool } from "../types";

export const createFolder: AssistantTool = {
  name: "createFolder",
  category: "files",
  description: "Create a new folder in Cozy Drive",
  label: "Create a folder",

  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the folder to create",
      },
      path: {
        type: "string",
        description: 'The parent directory path (defaults to root "/")',
      },
    },
    required: ["name"],
  },

  execute: async (params: Record<string, unknown>, client: unknown) => {
    const name = params.name as string;
    const dirPath = (params.path as string) || "/";
    const cozyClient = client as {
      stackClient: {
        fetchJSON: (
          method: string,
          path: string,
          body?: object
        ) => Promise<unknown>;
      };
    };

    try {
      const parent = (await cozyClient.stackClient.fetchJSON(
        "GET",
        `/files/metadata?Path=${encodeURIComponent(dirPath)}`
      )) as { data: { id: string } };
      const parentId = parent.data.id;

      await cozyClient.stackClient.fetchJSON(
        "POST",
        `/files/${parentId}?Type=directory&Name=${encodeURIComponent(
          name
        )}&Tags=`
      );

      return {
        success: true,
        message: `Folder "${name}" created successfully in ${dirPath}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create folder "${name}": ${
          (error as Error).message
        }`,
      };
    }
  },

  confirmationDetails: (params, t) => ({
    title: t("assistant.tools.createFolder.confirm_title"),
    fields: [
      {
        label: t("assistant.tools.createFolder.name"),
        value: params.name as string,
      },
      {
        label: t("assistant.tools.createFolder.location"),
        value: (params.path as string) || "/",
      },
    ],
  }),

  resultMessage: (params, result, t) =>
    result.success
      ? t("assistant.tools.createFolder.success", { name: params.name })
      : t("assistant.tools.createFolder.error", {
          name: params.name,
          error: result.message,
        }),
};
