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

  describe('with regex special characters in input', () => {
    const contact = {
      fullname: 'Jon (the) Snow*',
      email: [{ address: 'jon+snow@winterfell.westeros' }],
      cozy: [{ url: 'https://jon.mycozy.cloud' }]
    }
    const group = {
      _type: 'io.cozy.contacts.groups',
      name: 'House (Stark)'
    }

    it('should not throw on unbalanced parentheses', () => {
      expect(() => matchers.emailMatch('foo (bar', contact)).not.toThrow()
      expect(() => matchers.cozyUrlMatch('foo (bar', contact)).not.toThrow()
      expect(() => matchers.fullnameMatch('foo (bar', contact)).not.toThrow()
      expect(() => matchers.groupNameMatch('foo (bar', group)).not.toThrow()
    })

    it('should match special chars literally instead of as regex', () => {
      expect(matchers.fullnameMatch('(the)', contact)).toBe(true)
      expect(matchers.fullnameMatch('Snow*', contact)).toBe(true)
      expect(matchers.emailMatch('jon+snow', contact)).toBe(true)
      expect(matchers.groupNameMatch('(Stark)', group)).toBe(true)
    })

    it('should not let . match any character', () => {
      expect(matchers.fullnameMatch('J.n', contact)).toBe(false)
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

    it('should treat regex metacharacters as plain text', () => {
      expect(() =>
        matchers.fullnameMatch('(', { fullname: 'Jon Snow' })
      ).not.toThrow()
      expect(matchers.fullnameMatch('(', { fullname: 'Jon Snow' })).toBeFalsy()
      expect(matchers.fullnameMatch('.', { fullname: 'Jon Snow' })).toBeFalsy()
      expect(
        matchers.fullnameMatch('.', { fullname: 'Dr. House' })
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

  describe('Vietnamese diacritics support', () => {
    const vietnameseContacts = [
      { fullname: 'Nguyễn Văn Minh', email: 'minh.nguyen@email.com' },
      { fullname: 'Trần Thị Hương', email: 'huong.tran@email.com' },
      { fullname: 'Lê Hoàng Nam', email: 'nam.hoang@email.com' },
      {
        fullname: 'Phạm Đức Anh',
        email: 'anh.pham@email.com',
        cozy: [{ url: 'https://anh.mycozy.cloud' }]
      }
    ]

    it('should match Vietnamese accented name with unaccented input', () => {
      expect(
        matchers.fullnameMatch('nguyen', vietnameseContacts[0])
      ).toBeTruthy()
      expect(matchers.fullnameMatch('van', vietnameseContacts[0])).toBeTruthy()
      expect(matchers.fullnameMatch('minh', vietnameseContacts[0])).toBeTruthy()
      expect(matchers.fullnameMatch('tran', vietnameseContacts[1])).toBeTruthy()
      expect(
        matchers.fullnameMatch('huong', vietnameseContacts[1])
      ).toBeTruthy()
      expect(matchers.fullnameMatch('le', vietnameseContacts[2])).toBeTruthy()
      expect(matchers.fullnameMatch('nam', vietnameseContacts[2])).toBeTruthy()
      expect(matchers.fullnameMatch('pham', vietnameseContacts[3])).toBeTruthy()
      expect(matchers.fullnameMatch('anh', vietnameseContacts[3])).toBeTruthy()
    })

    it('should match unaccented input with Vietnamese accented name', () => {
      expect(
        matchers.fullnameMatch('nguyễn', vietnameseContacts[0])
      ).toBeTruthy()
      expect(matchers.fullnameMatch('văn', vietnameseContacts[0])).toBeTruthy()
      expect(matchers.fullnameMatch('trần', vietnameseContacts[1])).toBeTruthy()
      expect(
        matchers.fullnameMatch('hương', vietnameseContacts[1])
      ).toBeTruthy()
      expect(matchers.fullnameMatch('lê', vietnameseContacts[2])).toBeTruthy()
      expect(matchers.fullnameMatch('phạm', vietnameseContacts[3])).toBeTruthy()
    })

    it('should match Vietnamese email with partial unaccented input', () => {
      expect(matchers.emailMatch('minh', vietnameseContacts[0])).toBeTruthy()
      expect(matchers.emailMatch('nguyen', vietnameseContacts[0])).toBeTruthy()
      expect(matchers.emailMatch('huong', vietnameseContacts[1])).toBeTruthy()
      expect(matchers.emailMatch('tran', vietnameseContacts[1])).toBeTruthy()
    })

    it('should match Vietnamese cozy URL with unaccented input', () => {
      const contact = {
        fullname: 'Đặng Minh Đức',
        cozy: [{ url: 'https://duc.mycozy.cloud' }]
      }
      expect(matchers.cozyUrlMatch('duc', contact)).toBeTruthy()
      expect(matchers.cozyUrlMatch('mycozy', contact)).toBeTruthy()
    })

    it('should match Vietnamese group names with diacritics', () => {
      const vietGroup = {
        _type: 'io.cozy.contacts.groups',
        name: 'Nhóm Việt'
      }
      expect(matchers.groupNameMatch('nhom', vietGroup)).toBeTruthy()
      expect(matchers.groupNameMatch('viet', vietGroup)).toBeTruthy()
      expect(matchers.groupNameMatch('nhóm', vietGroup)).toBeTruthy()
    })
  })
})
