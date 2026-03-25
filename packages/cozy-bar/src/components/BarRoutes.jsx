import React from 'react'
import { Route } from 'react-router-dom'

import { RealTimeQueries } from 'cozy-client'
import { AssistantDialog, SearchDialog } from 'cozy-search'

export const BarRoutes = [
  <Route
    key="assistant/:conversationId"
    path="assistant/:conversationId"
    element={
      <>
        <RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
        <AssistantDialog />
      </>
    }
  />,
  <Route key="search" path="search" element={<SearchDialog />} />
]
