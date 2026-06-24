import {
  Icon,
  Bank,
  BankCheck,
  Benefit,
  Bill,
  Car,
  Chess,
  Child,
  Dots,
  Email,
  Euro,
  Exchange,
  Fitness,
  Globe,
  Gouv,
  Heart,
  Home,
  Image,
  Justice,
  Laudry,
  Lightning,
  Note,
  People,
  Plane,
  Remboursement,
  Restaurant,
  School,
  Shop,
  Team,
  Telecom,
  Telephone,
  Water,
  Work
} from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import { getIconByLabel } from 'cozy-client/dist/models/document/qualification'

const IconByLabel = {
  'bank-check': BankCheck,
  bank: Bank,
  benefit: Benefit,
  bill: Bill,
  car: Car,
  chess: Chess,
  child: Child,
  dots: Dots,
  email: Email,
  euro: Euro,
  exchange: Exchange,
  'file-type-note': Note,
  fitness: Fitness,
  globe: Globe,
  gouv: Gouv,
  heart: Heart,
  home: Home,
  image: Image,
  justice: Justice,
  laudry: Laudry,
  lightning: Lightning,
  people: People,
  plane: Plane,
  remboursement: Remboursement,
  restaurant: Restaurant,
  school: School,
  shop: Shop,
  team: Team,
  telecom: Telecom,
  telephone: Telephone,
  water: Water,
  work: Work
}

const themeIconByLabel = {
  identity: 'people',
  family: 'team',
  work_study: 'work',
  health: 'heart',
  home: 'home',
  transport: 'car',
  activity: 'chess',
  finance: 'bank',
  invoice: 'bill',
  others: 'dots'
}

const QualificationIcon = ({ theme, qualification, ...props }) => {
  const _Icon = qualification
    ? IconByLabel[getIconByLabel(qualification)]
    : theme
      ? IconByLabel[themeIconByLabel[theme]]
      : null

  return <Icon icon={_Icon} color="#E049BF" size={16} {...props} />
}

QualificationIcon.propTypes = {
  /** The name of the qualification (isp\_invoice, family\_record\_book, etc.) */
  qualification: PropTypes.string,
  /** The name of the qualification theme (indentity, family, etc.) */
  theme: PropTypes.string
}

export default QualificationIcon
