import * as matchers from './suggestionMatchers'

describe('Suggestion matchers', () => {
  describe('cozyUrlMatch', () => {
    it('should return true if cozy url matches', () => {
      const contact = {
        fullname: 'Jon Snow',
        cozy: [
          {
            url: 'https://jon.mycozy.cloud'
          }
        ]
      }
      const result = matchers.cozyUrlMatch('https://jon.mycozy.cloud', contact)
      expect(result).toBe(true)
    })

    it("should return false if cozy url doesn't match", () => {
      const contact = {
        fullname: 'Jon Snow',
        cozy: [
          {
            url: 'https://jon.mycozy.cloud'
          }
        ]
      }
      const result = matchers.emailMatch(
        'https://jonsnow.mycozy.cloud',
        contact
      )
      expect(result).toBe(false)
    })

    it('should return false if contact has no cozy', () => {
      const contact = {
        fullname: 'Jon Snow',
        cozy: []
      }
      const result = matchers.emailMatch(
        'https://jonsnow.mycozy.cloud',
        contact
      )
      expect(result).toBe(false)
    })
  })

  describe('emailMatch', () => {
    it('should return true if one email matches', () => {
      const contact = {
        fullname: 'Jon Snow',
        email: [
          {
            address: 'jon@winterfell.westeros',
            type: 'Home',
            primary: true
          },
          {
            address: 'jon.snow@thewall.westeros',
            type: 'Work',
            primary: true
          }
        ]
      }
      const result = matchers.emailMatch('jon.snow@thewall.westeros', contact)
      expect(result).toBe(true)
    })

    it('should return false if no email matches', () => {
      const contact = {
        fullname: 'Jon Snow',
        email: [
          {
            address: 'jon@winterfell.westeros',
            type: 'Home',
            primary: true
          },
          {
            address: 'jon.snow@thewall.westeros',
            type: 'Work',
            primary: true
          }
        ]
      }
      const result = matchers.emailMatch('jon@thewall.westeros', contact)
      expect(result).toBe(false)
    })

    it('should return false if contact has no email', () => {
      const contact = {
        fullname: 'Jon Snow',
        email: []
      }
      const result = matchers.emailMatch('jon.snow@thewall.westeros', contact)
      expect(result).toBe(false)
    })
  })

  describe('fullnameMatch', () => {
    it('should return false if no fullname or no match', () => {
      const contact = {}
      const result = matchers.fullnameMatch('jo', contact)
      expect(result).toBeFalsy()

      expect(
        matchers.fullnameMatch('Matt', {
          fullname: 'Jon'
        })
      ).toBeFalsy()
    })

    it('should return true if fullname matches', () => {
      const contact = {
        fullname: 'Jon Margaret Snow'
      }
      expect(matchers.fullnameMatch('jo', contact)).toBeTruthy()
      expect(matchers.fullnameMatch('snow', contact)).toBeTruthy()
      expect(matchers.fullnameMatch('MARG', contact)).toBeTruthy()
    })

    it('should match accented fullname with unaccented input', () => {
      expect(
        matchers.fullnameMatch('zoe', { fullname: 'Zoé Dupont' })
      ).toBeTruthy()
      expect(
        matchers.fullnameMatch('elodie', { fullname: 'Élodie Martin' })
      ).toBeTruthy()
      expect(
        matchers.fullnameMatch('celine', { fullname: 'Céline' })
      ).toBeTruthy()
    })

    it('should match unaccented fullname with accented input', () => {
      expect(
        matchers.fullnameMatch('zoé', { fullname: 'Zoe Dupont' })
      ).toBeTruthy()
    })
  })

  describe('groupNameMatch', () => {
    it('should match accented group name with unaccented input', () => {
      const group = {
        _type: 'io.cozy.contacts.groups',
        name: 'Équipe'
      }
      expect(matchers.groupNameMatch('equipe', group)).toBeTruthy()
    })
  })
})
