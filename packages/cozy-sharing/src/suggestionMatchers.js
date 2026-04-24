import { Group } from 'cozy-doctypes'

let removeDiacritics
try {
  new RegExp('\\p{Diacritic}', 'gu')
  removeDiacritics = str => str.replace(/\p{Diacritic}/gu, '')
} catch {
  removeDiacritics = str => str.replace(/[̀-ͯ]/g, '')
}

const normalize = str => removeDiacritics(str.normalize('NFD'))
const normalizeLowercase = str => normalize(str).toLowerCase()

// TODO: sadly we have different versions of contacts' doctype to handle...
// A migration tool on the stack side is needed here
const emailMatch = (input, contact) => {
  if (!contact.email) return false
  const normalizedInput = normalizeLowercase(input)
  if (Array.isArray(contact.email)) {
    return contact.email.some(email =>
      normalizeLowercase(email.address).includes(normalizedInput)
    )
  }
  return normalizeLowercase(contact.email).includes(normalizedInput)
}

const cozyUrlMatch = (input, contact) => {
  if (!contact.cozy && !contact.url) return false
  const normalizedInput = normalizeLowercase(input)
  if (contact.cozy && Array.isArray(contact.cozy)) {
    return contact.cozy.some(cozy =>
      normalizeLowercase(cozy.url).includes(normalizedInput)
    )
  }
  return normalizeLowercase(contact.url).includes(normalizedInput)
}

const groupNameMatch = (input, contactOrGroup) => {
  if (contactOrGroup._type !== Group.doctype) return false
  const normalizedInput = normalizeLowercase(input)
  return normalizeLowercase(contactOrGroup.name).includes(normalizedInput)
}

const fullnameMatch = (input, contact) => {
  if (!contact.fullname) return false
  const normalizedInput = normalizeLowercase(input)
  return normalizeLowercase(contact.fullname).includes(normalizedInput)
}

export { emailMatch, cozyUrlMatch, groupNameMatch, fullnameMatch }
