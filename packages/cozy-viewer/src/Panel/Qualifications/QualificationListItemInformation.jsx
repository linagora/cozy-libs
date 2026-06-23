import {
  Icon,
  Bell,
  Company,
  Contract,
  Dots,
  Euro,
  Globe,
  Number,
  Right
} from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React, { forwardRef } from 'react'

import {
  getTranslatedNameForInformationMetadata,
  formatInformationMetadataValue,
  KNOWN_INFORMATION_METADATA_NAMES
} from 'cozy-client/dist/models/paper'
import { copyToClipboard } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import MidEllipsis from 'cozy-ui/transpiled/react/MidEllipsis'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import QualificationListItemText from './QualificationListItemText'
import IntentOpener from '../../components/IntentOpener'
const KNOWN_INFORMATION_METADATA_ICONS = [
  Number,
  Number,
  Globe,
  Euro,
  Contract,
  Euro,
  Company,
  Number,
  Number,
  Bell
]

const makeInformationMetadataIcon = name =>
  KNOWN_INFORMATION_METADATA_ICONS[
    KNOWN_INFORMATION_METADATA_NAMES.findIndex(el => el === name)
  ]

const QualificationListItemInformation = forwardRef(
  (
    { formattedMetadataQualification, file, isReadOnly, toggleActionsMenu },
    ref
  ) => {
    const { lang } = useI18n()
    const { showAlert } = useAlert()

    const { name, value } = formattedMetadataQualification
    const qualificationLabel = file.metadata.qualification.label

    const formattedTitle = getTranslatedNameForInformationMetadata(name, {
      lang,
      qualificationLabel
    })
    const formattedValue = formatInformationMetadataValue(value, {
      lang,
      name,
      qualificationLabel
    })
    const InformationIcon = makeInformationMetadataIcon(name)

    const titleComponent =
      formattedTitle === name ? <MidEllipsis text={name} /> : formattedTitle

    const handleClick = async () => {
      if (!value) return
      await copyToClipboard().action(undefined, { showAlert, copyValue: value })
    }

    return (
      <IntentOpener
        action="OPEN"
        doctype="io.cozy.files.paper"
        options={{
          path: `${qualificationLabel}/${file._id}/edit/information?metadata=${name}`
        }}
        disabled={!!value || isReadOnly}
      >
        <ListItem button={!!value || !isReadOnly} onClick={handleClick}>
          <ListItemIcon>
            <Icon icon={InformationIcon} />
          </ListItemIcon>
          <QualificationListItemText
            primary={value ? titleComponent : undefined}
            secondary={value ? formattedValue : titleComponent}
            disabled={!value}
          />
          {value ? (
            <ListItemSecondaryAction>
              <IconButton
                ref={ref}
                onClick={() => toggleActionsMenu(value)}
                data-testid="toggleActionsMenuBtn"
              >
                <Icon icon={Dots} />
              </IconButton>
            </ListItemSecondaryAction>
          ) : (
            !isReadOnly && (
              <ListItemIcon>
                <Icon icon={Right} color="var(--secondaryTextColor)" />
              </ListItemIcon>
            )
          )}
        </ListItem>
      </IntentOpener>
    )
  }
)

QualificationListItemInformation.displayName = 'QualificationListItemNumber'

QualificationListItemInformation.propTypes = {
  file: PropTypes.object.isRequired,
  isReadOnly: PropTypes.bool,
  formattedMetadataQualification: PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  toggleActionsMenu: PropTypes.func.isRequired
}

export default QualificationListItemInformation
