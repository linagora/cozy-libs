import { IOCozyFile } from 'cozy-client/types/types'

import { ROOT_DIR_ID, SHARED_DRIVES_DIR_ID } from '../consts'
import { shouldKeepFile } from './normalizeFile'

describe('shouldKeepFile', () => {
  it('keeps a regular file', () => {
    const file = {
      _id: 'abc',
      dir_id: 'some-folder',
      path: '/some-folder/doc.txt',
      trashed: false
    } as unknown as IOCozyFile
    expect(shouldKeepFile(file)).toBe(true)
  })

  it('keeps a real file inside a shared drive', () => {
    // Files within a shared drive live under their own folder, not directly
    // under the Shared Drives directory, so they must remain searchable.
    const file = {
      _id: 'drive-file',
      dir_id: 'drive-folder',
      path: '/Drives/Team Drive/doc.txt',
      trashed: false
    } as unknown as IOCozyFile
    expect(shouldKeepFile(file)).toBe(true)
  })

  it('drops the Shared Drives directory itself', () => {
    const dir = {
      _id: SHARED_DRIVES_DIR_ID,
      dir_id: ROOT_DIR_ID,
      trashed: false
    } as unknown as IOCozyFile
    expect(shouldKeepFile(dir)).toBe(false)
  })

  it('drops the .url shortcut placeholder of a shared drive', () => {
    // When a shared drive is received, the stack drops a `<DriveName>.url`
    // shortcut directly under the Shared Drives directory. It must not pollute
    // search results.
    const shortcut = {
      _id: 'shortcut-id',
      dir_id: SHARED_DRIVES_DIR_ID,
      class: 'shortcut',
      path: '/Drives/Team Drive.url',
      trashed: false
    } as unknown as IOCozyFile
    expect(shouldKeepFile(shortcut)).toBe(false)
  })

  it('keeps a non-shortcut file sitting under the Shared Drives directory', () => {
    const file = {
      _id: 'some-file',
      dir_id: SHARED_DRIVES_DIR_ID,
      class: 'text',
      path: '/Drives/doc.txt',
      trashed: false
    } as unknown as IOCozyFile
    expect(shouldKeepFile(file)).toBe(true)
  })
})
