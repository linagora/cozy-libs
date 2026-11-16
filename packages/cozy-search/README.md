# Cozy-search

### Prerequisite

1. Install `cozy-dataproxy-lib` and update `cozy-scripts` version of your app to 8.4.0.

2. Add the provider in your tree because the SearchEngine is provided by the DataProxyProvider :

```jsx
import { DataProxyProvider } from 'cozy-dataproxy-lib'

<DataProxyProvider>
  { children }
</DataProxyProvider>
```

3. Import the CSS :

```jsx
import 'cozy-search/dist/stylesheet.css'
```

### On desktop

You can add the search bar like this :

```jsx
import React from 'react'

import { BarSearch } from 'cozy-bar'
import { AssistantDesktop } from 'cozy-search'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const AppBarSearch = () => {
  const { isMobile } = useBreakpoints()

  return (
    <BarSearch>
      {!isMobile && (
        <AssistantDesktop
          componentsProps={{ SearchBarDesktop: { size: 'small' } }}
        />
      )}
    </BarSearch>
  )
}

export default AppBarSearch
```

### On mobile

The search is a dialog. Create a route for it and open it when you want:

```jsx
<Route path="search" element={<SearchDialog />} />
```
