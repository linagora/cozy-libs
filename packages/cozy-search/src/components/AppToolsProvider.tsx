import React, { createContext, useContext, useMemo, ReactNode } from "react";

import type { AssistantTool } from "../tools/types";

const AppToolsContext = createContext<AssistantTool[]>([]);

export const useAppTools = (): AssistantTool[] => useContext(AppToolsContext);

interface AppToolsProviderProps {
  tools: AssistantTool[];
  children: ReactNode;
}

const AppToolsProvider = ({
  tools,
  children,
}: AppToolsProviderProps): JSX.Element => {
  const value = useMemo(() => tools, [tools]);
  return (
    <AppToolsContext.Provider value={value}>
      {children}
    </AppToolsContext.Provider>
  );
};

export default AppToolsProvider;
