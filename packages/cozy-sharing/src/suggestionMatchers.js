import { Group } from 'cozy-doctypes'

let removeDiacritics
try {
  new RegExp('\\p{Diacritic}', 'gu')
  removeDiacritics = str => str.replace(/\p{Diacritic}/gu, '')
} catch {
  removeDiacritics = str => str.replace(/[̀-ͯ]/g, '')
}

const normalize = str => removeDiacritics(str.normalize('NFD'))

// TODO: sadly we have different versions of contacts' doctype to handle...
// A migration tool on the stack side is needed here
const emailMatch = (input, contact) => {
  if (!contact.email) return false
  const emailInput = new RegExp(normalize(input), 'i')
  if (Array.isArray(contact.email)) {
    return contact.email.some(email =>
      emailInput.test(normalize(email.address))
    )
  }
  return emailInput.test(normalize(contact.email))
}

const cozyUrlMatch = (input, contact) => {
  if (!contact.cozy && !contact.url) return false
  const urlInput = new RegExp(normalize(input), 'i')
  if (contact.cozy && Array.isArray(contact.cozy)) {
    return contact.cozy.some(cozy => urlInput.test(normalize(cozy.url)))
  }
  return urlInput.test(normalize(contact.url))
}

const groupNameMatch = (input, contactOrGroup) => {
  if (contactOrGroup._type !== Group.doctype) return false
  const nameInput = new RegExp(normalize(input), 'i')
  return nameInput.test(normalize(contactOrGroup.name))
}

const fullnameMatch = (input, contact) => {
  if (!contact.fullname) return false
  const fullnameInput = new RegExp(normalize(input), 'i')
  return fullnameInput.test(normalize(contact.fullname))
}

export { emailMatch, cozyUrlMatch, groupNameMatch, fullnameMatch }
