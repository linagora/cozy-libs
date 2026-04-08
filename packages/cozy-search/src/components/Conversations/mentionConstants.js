// Only match @ preceded by whitespace or at start of string (avoids matching emails like me@host)
// Allows spaces in the search term so filenames like "my report.pdf" can be found
export const MENTION_MATCH_REGEX = /(^|\s)@([^\n@]*)$/
export const MENTION_REPLACE_REGEX = /(^|\s)@[^\n@]*$/

export const FILES_DOCTYPE = 'io.cozy.files'

export const FILE_SEARCH_OPTIONS = {
  doctypes: [FILES_DOCTYPE],
  excludeFilters: { type: 'directory' }
}
