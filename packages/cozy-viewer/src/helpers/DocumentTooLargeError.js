export class DocumentTooLargeError extends Error {
  constructor() {
    super('DOCUMENT_TOO_LARGE')
    this.code = 'DOCUMENT_TOO_LARGE'
    this.name = 'DocumentTooLargeError'
  }
}
