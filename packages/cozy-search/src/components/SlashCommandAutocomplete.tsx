import React, { useMemo } from 'react'

import Paper from 'cozy-ui/transpiled/react/Paper'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { getPlatformTools } from '../tools/registry'
import { useAppTools } from './AppToolsProvider'
import type { AssistantTool } from '../tools/types'

interface SlashCommandAutocompleteProps {
  inputValue: string
  onSelect: (tool: AssistantTool) => void
}

const SlashCommandAutocomplete = ({ inputValue, onSelect }: SlashCommandAutocompleteProps) => {
  const { t } = useI18n()
  const appTools = useAppTools()
  const allTools = useMemo(
    () => [...getPlatformTools(), ...appTools],
    [appTools]
  )

  const query = inputValue.slice(1).toLowerCase()

  const filteredTools = useMemo(() => {
    if (!query) return allTools
    return allTools.filter(tool => {
      const slug = `${tool.category}-${tool.name}`.toLowerCase()
      const label = tool.label.toLowerCase()
      return slug.includes(query) || label.includes(query)
    })
  }, [allTools, query])

  if (filteredTools.length === 0) return null

  const grouped = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, AssistantTool[]>)

  return (
    <Paper
      elevation={2}
      className="u-pos-absolute u-w-100 u-mb-half"
      style={{ bottom: '100%', maxHeight: 240, overflowY: 'auto', zIndex: 10 }}
    >
      {Object.entries(grouped).map(([category, tools]) => (
        <div key={category}>
          <Typography
            variant="caption"
            color="textSecondary"
            className="u-ph-1 u-pv-half"
          >
            {category}
          </Typography>
          {tools.map(tool => (
            <div
              key={`${tool.category}-${tool.name}`}
              className="u-ph-1 u-pv-half u-c-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(tool)}
              role="option"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter') onSelect(tool)
              }}
            >
              <Typography variant="body2" component="span">
                /{tool.category}-{tool.name}
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                component="span"
                className="u-ml-1"
              >
                {tool.label}
              </Typography>
            </div>
          ))}
        </div>
      ))}
    </Paper>
  )
}

export default SlashCommandAutocomplete
