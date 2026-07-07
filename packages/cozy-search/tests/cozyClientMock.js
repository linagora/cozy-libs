module.exports = {
  Q: jest.fn(doctype => ({
    getById: jest.fn(id => ({
      definition: { doctype, id },
      options: { singleDocData: true }
    })),
    getByIds: jest.fn(ids => ({
      definition: { doctype, ids },
      options: {}
    }))
  })),
  fetchPolicies: {
    olderThan: jest.fn(() => ({
      strategy: 'olderThan'
    }))
  },
  CozyClient: jest.fn()
}
