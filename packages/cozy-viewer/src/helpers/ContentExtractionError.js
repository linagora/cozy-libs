export class ContentExtractionError extends Error {
  constructor() {
    super('CONTENT_EXTRACTION_FAILED')
    this.code = 'CONTENT_EXTRACTION_FAILED'
    this.name = 'ContentExtractionError'
  }
}
