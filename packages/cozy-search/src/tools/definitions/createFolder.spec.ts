import { createFolder } from "./createFolder";

describe("createFolder tool", () => {
  it("should have correct identity fields", () => {
    expect(createFolder.name).toBe("createFolder");
    expect(createFolder.category).toBe("files");
    expect(createFolder.description).toBeDefined();
    expect(createFolder.label).toBeDefined();
  });

  it("should have a JSON Schema with name as required", () => {
    const params = createFolder.parameters as {
      properties: Record<string, unknown>;
      required: string[];
    };
    expect(params.properties).toHaveProperty("name");
    expect(params.required).toContain("name");
  });

  it("should generate confirmation details", () => {
    const t = jest.fn((key: string) => key);
    const details = createFolder.confirmationDetails(
      { name: "Invoices", path: "/Administrative" },
      t
    );
    expect(details.title).toBeDefined();
    expect(details.fields.length).toBeGreaterThan(0);
    expect(details.fields.find((f) => f.value === "Invoices")).toBeDefined();
  });

  it("should execute a folder creation via cozy-client", async () => {
    const mockClient = {
      stackClient: {
        fetchJSON: jest
          .fn()
          .mockResolvedValueOnce({ data: { id: "root_id" } })
          .mockResolvedValueOnce({ data: { id: "folder_123" } }),
      },
    };

    const result = await createFolder.execute(
      { name: "Invoices", path: "/" },
      mockClient as unknown
    );

    expect(result.success).toBe(true);
    expect(mockClient.stackClient.fetchJSON).toHaveBeenCalledWith(
      "GET",
      "/files/metadata?Path=%2F"
    );
    expect(mockClient.stackClient.fetchJSON).toHaveBeenCalledWith(
      "POST",
      "/files/root_id?Type=directory&Name=Invoices&Tags="
    );
  });

  it("should return failure result when execute throws", async () => {
    const mockClient = {
      stackClient: {
        fetchJSON: jest.fn().mockRejectedValue(new Error("Conflict")),
      },
    };

    const result = await createFolder.execute(
      { name: "Invoices", path: "/" },
      mockClient as unknown
    );

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  it("should generate a result message", () => {
    const t = jest.fn((key: string) => key);
    const msg = createFolder.resultMessage(
      { name: "Invoices", path: "/" },
      { success: true, message: "Created" },
      t
    );
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});
