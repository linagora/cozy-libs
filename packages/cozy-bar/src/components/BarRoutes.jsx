import React from 'react'
import { Route } from 'react-router-dom'

import { SearchDialog } from 'cozy-search'

export const BarRoutes = [
  <Route key="search" path="search" element={<SearchDialog />} />
]
