import { getDisplayName, getInitials } from './DoctypeContact'

describe('Contact model', () => {
  describe('getInitials method', () => {
    it('should return the first letter of public_name if it is an owner recipient', () => {
      const recipient = {
        name: { givenName: 'Jane', familyName: 'Doe' },
        public_name: 'janedoe'
      }
      const result = getInitials(recipient)
      expect(result).toEqual('J')
    })

    it('should build initials from the structured name object', () => {
      const recipient = {
        name: { givenName: 'Jane', familyName: 'Doe' }
      }
      const result = getInitials(recipient)
      expect(result).toEqual('JD')
    })

    it('should return the first letter of email when name and public_name are absent', () => {
      const recipient = {
        email: 'janedoe@example.com'
      }
      const result = getInitials(recipient)
      expect(result).toEqual('J')
    })

    it('should return the first letter of email when name is an empty object', () => {
      const recipient = {
        name: {},
        email: 'janedoe@example.com'
      }
      const result = getInitials(recipient)
      expect(result).toEqual('J')
    })

    it('should return an empty string when nothing is resolvable', () => {
      const recipient = {}
      const result = getInitials(recipient)
      expect(result).toEqual('')
    })

    it('should use the default value when nothing is resolvable', () => {
      const recipient = {}
      const result = getInitials(recipient, 'A')
      expect(result).toEqual('A')
    })

    it('should build initials for a full contact document', () => {
      const contact = {
        _id: '46b5d129-0296-4466-8c02-9a6a0c17c4cb',
        _type: 'io.cozy.contacts',
        name: {
          givenName: 'Arya',
          familyName: 'Stark'
        }
      }
      const result = getInitials(contact)
      expect(result).toEqual('AS')
    })
  })

  describe('getDisplayName method', () => {
    it('should use displayName when a contact document is given', () => {
      const contact = {
        _id: '46b5d129-0296-4466-8c02-9a6a0c17c4cb',
        _type: 'io.cozy.contacts',
        displayName: 'Arya Stark',
        name: {
          givenName: 'Arya',
          familyName: 'Stark'
        }
      }
      const result = getDisplayName(contact)
      expect(result).toEqual('Arya Stark')
    })

    it('should use public_name when available', () => {
      const recipient = {
        email: 'arya@winterfell.westeros',
        name: { givenName: 'Arya', familyName: 'Stark' },
        public_name: 'aryastark'
      }
      const result = getDisplayName(recipient)
      expect(result).toEqual('aryastark')
    })

    it('should build the fullname from the structured name object', () => {
      const recipient = {
        name: {
          namePrefix: 'Lady',
          givenName: 'Arya',
          familyName: 'Stark'
        }
      }
      const result = getDisplayName(recipient)
      expect(result).toEqual('Lady Arya Stark')
    })

    it('should fall back to email when name is absent', () => {
      const recipient = {
        email: 'arya.stark@winterfell.westeros'
      }
      const result = getDisplayName(recipient)
      expect(result).toEqual('arya.stark@winterfell.westeros')
    })

    it('should fall back to email when name is an empty object', () => {
      const recipient = {
        name: {},
        email: 'arya.stark@winterfell.westeros'
      }
      const result = getDisplayName(recipient)
      expect(result).toEqual('arya.stark@winterfell.westeros')
    })

    it('should return an empty string when nothing is resolvable', () => {
      const recipient = {}
      const result = getDisplayName(recipient)
      expect(result).toEqual('')
    })

    it('should use the default value when nothing is resolvable', () => {
      const recipient = {}
      const result = getDisplayName(recipient, 'Anonymous')
      expect(result).toEqual('Anonymous')
    })
  })
})
