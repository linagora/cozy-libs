import get from 'lodash/get'

import {
  moveToHead,
  makeItemLabel,
  makeTypeAndLabel,
  makeImppValues,
  makeCustomLabel,
  makeFields,
  makeInitialCustomValue,
  hasNoValues,
  getFirstValueIfArray,
  validateFields
} from './helpers'
import { locales } from './locales'

const t = x => get(locales.en, x, x)

describe('makeCustomLabel', () => {
  it('should return custom type and supported label', () => {
    const resForWork = makeCustomLabel('{"type":"someType","label":"work"}', t)
    expect(resForWork).toBe('someType (pro)')

    const resForHome = makeCustomLabel('{"type":"someType","label":"home"}', t)
    expect(resForHome).toBe('someType (personal)')
  })

  it('should return label if no type', () => {
    const resForWork = makeCustomLabel('{"label":"work"}', t)
    expect(resForWork).toBe('label.work')

    const resForHome = makeCustomLabel('{"label":"home"}', t)
    expect(resForHome).toBe('label.home')
  })

  it('should return only custom type if label is not supported or undefined', () => {
    const resForNotSupported = makeCustomLabel(
      '{"type":"someType","label":"someLabel"}',
      t
    )
    expect(resForNotSupported).toBe('someType')

    const resForUndefined = makeCustomLabel('{"type":"someType"}', t)
    expect(resForUndefined).toBe('someType')
  })
})

describe('moveToHead function', () => {
  it('should move an item to head of the array', () => {
    const items = [1, 5, 657, 42, 3, 27, 88, 3, 4]
    const shouldBeHead = v => v === 42
    const expected = [42, 1, 5, 657, 3, 27, 88, 3, 4]
    const actual = moveToHead(shouldBeHead)(items)
    expect(actual).toEqual(expected)
  })
})

describe('makeItemLabel', () => {
  it('should return undefined if no arg', () => {
    const res = makeItemLabel()

    expect(res).toBe(undefined)
  })

  it('should return undefined if nothing defined', () => {
    const res = makeItemLabel({ type: undefined, label: undefined })

    expect(res).toBe(undefined)
  })

  it('should return correct type and label', () => {
    const res = makeItemLabel({ type: 'cell', label: 'work' })

    expect(res).toBe('{"type":"cell","label":"work"}')
  })

  it('should return only label if no type', () => {
    const res = makeItemLabel({ type: undefined, label: 'work' })

    expect(res).toBe('{"label":"work"}')
  })

  it('should return only type if no label', () => {
    const res = makeItemLabel({ type: 'cell', label: undefined })

    expect(res).toBe('{"type":"cell"}')
  })
})

describe('makeTypeAndLabel', () => {
  it('should return undefined if no arg', () => {
    const res = makeTypeAndLabel()

    expect(res).toStrictEqual({ type: undefined, label: undefined })
  })

  it('should return correct type and label', () => {
    const res = makeTypeAndLabel('{"type":"cell","label":"work"}')

    expect(res).toStrictEqual({ type: 'cell', label: 'work' })
  })

  it('should return only label', () => {
    const res = makeTypeAndLabel('{"label":"work"}')

    expect(res).toStrictEqual({ type: undefined, label: 'work' })
  })

  it('should return only type', () => {
    const res = makeTypeAndLabel('{"type":"cell"}')

    expect(res).toStrictEqual({ type: 'cell', label: undefined })
  })
})

describe('makeImppValues', () => {
  it('should replace only uri for {label: "work", protocol: "matrix"}', () => {
    const res = makeImppValues(
      {
        impp: [
          {
            uri: 'john.doe@xmpp.net',
            protocol: 'xmpp',
            label: 'home',
            primary: false
          },
          {
            uri: 'john.doe@xmpp.net',
            protocol: 'xmpp',
            label: 'work',
            primary: false
          },
          {
            uri: 'john@doe.matrix.net',
            protocol: 'matrix',
            label: 'work',
            primary: true
          },
          {
            uri: 'john@doe.matrix.home',
            protocol: 'matrix',
            label: 'home'
          }
        ]
      },
      'newMatrixURI'
    )

    expect(res).toStrictEqual([
      {
        uri: 'john.doe@xmpp.net',
        protocol: 'xmpp',
        label: 'home',
        primary: false
      },
      {
        uri: 'john.doe@xmpp.net',
        protocol: 'xmpp',
        label: 'work',
        primary: false
      },
      {
        uri: 'newMatrixURI',
        protocol: 'matrix',
        label: 'work',
        primary: true
      },
      {
        uri: 'john@doe.matrix.home',
        protocol: 'matrix',
        label: 'home'
      }
    ])
  })

  it('should remove correctly', () => {
    const res = makeImppValues(
      {
        impp: [
          {
            uri: 'john.doe@xmpp.net',
            protocol: 'xmpp',
            label: 'home',
            primary: false
          },
          {
            uri: 'john.doe@xmpp.net',
            protocol: 'xmpp',
            label: 'work',
            primary: false
          },
          {
            uri: 'john@doe.matrix.net',
            protocol: 'matrix',
            label: 'work',
            primary: true
          },
          {
            uri: 'john@doe.matrix.home',
            protocol: 'matrix',
            label: 'home'
          }
        ]
      },
      ''
    )

    expect(res).toStrictEqual([
      {
        uri: 'john.doe@xmpp.net',
        protocol: 'xmpp',
        label: 'home',
        primary: false
      },
      {
        uri: 'john.doe@xmpp.net',
        protocol: 'xmpp',
        label: 'work',
        primary: false
      },
      {
        uri: 'john@doe.matrix.home',
        protocol: 'matrix',
        label: 'home'
      }
    ])
  })

  it('should add the matrix impp values for the first time if no impp attribute', () => {
    const expected = [
      {
        uri: 'newMatrixURI',
        protocol: 'matrix',
        label: 'work',
        primary: true
      }
    ]

    expect(makeImppValues({ impp: undefined }, 'newMatrixURI')).toStrictEqual(
      expected
    )

    expect(makeImppValues({ impp: [] }, 'newMatrixURI')).toStrictEqual(expected)
  })

  it('should not add empty object if value is empty', () => {
    expect(makeImppValues({ impp: undefined }, '')).toStrictEqual([])

    expect(makeImppValues({ impp: [] }, '')).toStrictEqual([])
  })
})

describe('makeInitialCustomValue', () => {
  it('should return undefined if no name', () => {
    const res = makeInitialCustomValue(
      undefined,
      '{"type":"fax","label":"work"}'
    )

    expect(res).toStrictEqual(undefined)
  })

  it('should return undefined if no value', () => {
    const res = makeInitialCustomValue('phone[0].phoneLabel', undefined)

    expect(res).toStrictEqual(undefined)
  })

  it('should return undefined if no name/value', () => {
    const res = makeInitialCustomValue(undefined, undefined)

    expect(res).toStrictEqual(undefined)
  })

  it('should return undefined for gender input', () => {
    const res = makeInitialCustomValue(
      'gender',
      '{"type":"fax","label":"work"}'
    )

    expect(res).toStrictEqual(undefined)
  })

  it('should return the type if no label to ensure backwards compatibility', () => {
    const res = makeInitialCustomValue('someInput', '{"type":"someType"}')

    expect(res).toStrictEqual('{"type":"someType"}')
  })

  it('should return type and label if present', () => {
    const res = makeInitialCustomValue(
      'someInput',
      '{"type":"someType","label":"work"}'
    )

    expect(res).toStrictEqual('{"type":"someType","label":"work"}')
  })

  describe('for phone input', () => {
    const name = 'phone[0].phoneLabel'

    it('should not return a custom label if the value is supported', () => {
      const res = makeInitialCustomValue(name, '{"type":"fax","label":"work"}')

      expect(res).toStrictEqual(undefined)
    })

    it('should return the custom label', () => {
      const res = makeInitialCustomValue(name, '{"type":"someType"}')

      expect(res).toStrictEqual('{"type":"someType"}')
    })

    it('should return the custom label', () => {
      const res = makeInitialCustomValue(name, '{"label":"work"}')

      expect(res).toStrictEqual('{"label":"work"}')
    })

    it('should return the custom value if the type is not supported even if there is a label', () => {
      const res = makeInitialCustomValue(
        name,
        '{"type":"someType","label":"work"}'
      )

      expect(res).toStrictEqual('{"type":"someType","label":"work"}')
    })
  })
})

describe('makeFields', () => {
  it('should return custom fields at custom position', () => {
    const customFields = [
      { name: 'middlename', position: 1 },
      { name: 'birthday', position: 3 }
    ]
    const defaultFields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = makeFields(customFields, defaultFields)

    expect(res).toStrictEqual([
      { name: 'firstname' },
      { name: 'middlename', position: 1 },
      { name: 'lastname' },
      { name: 'birthday', position: 3 }
    ])
  })

  it('should ignore custom fields without position value', () => {
    const customFields = [
      { name: 'middlename', position: 1 },
      { name: 'field-with-no-position' }
    ]
    const defaultFields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = makeFields(customFields, defaultFields)

    expect(res).toStrictEqual([
      { name: 'firstname' },
      { name: 'middlename', position: 1 },
      { name: 'lastname' }
    ])
  })

  it('should not mutate the original arrays', () => {
    const customFields = [
      { name: 'middlename', position: 1 },
      { name: 'field-with-no-position' },
      { name: 'birthday', position: 3 }
    ]
    const defaultFields = [{ name: 'firstname' }, { name: 'lastname' }]

    makeFields(customFields, defaultFields)

    expect(defaultFields).toStrictEqual([
      { name: 'firstname' },
      { name: 'lastname' }
    ])

    expect(customFields).toStrictEqual([
      { name: 'middlename', position: 1 },
      { name: 'field-with-no-position' },
      { name: 'birthday', position: 3 }
    ])
  })

  it('should handle undefined custom fields', () => {
    const defaultFields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = makeFields(undefined, defaultFields)

    expect(res).toStrictEqual(defaultFields)
  })

  it('should replace default fields values by custom fields', () => {
    const defaultFields = [
      { name: 'firstname', type: 'text', layout: 'accordion' },
      { name: 'lastname' }
    ]
    const customFields = [
      { name: 'firstname', isSecondary: true, layout: 'array' }
    ]

    const res = makeFields(customFields, defaultFields)

    expect(res).toStrictEqual([
      { name: 'firstname', type: 'text', isSecondary: true, layout: 'array' },
      { name: 'lastname' }
    ])
  })

  it('should replace default fields values and add custom fields at custom position', () => {
    const defaultFields = [
      { name: 'firstname', type: 'text', layout: 'accordion' },
      { name: 'lastname' }
    ]
    const customFields = [
      { name: 'firstname', isSecondary: true, layout: 'array', position: 1 }
    ]

    const res = makeFields(customFields, defaultFields)

    expect(res).toStrictEqual([
      { name: 'lastname' },
      {
        name: 'firstname',
        type: 'text',
        isSecondary: true,
        layout: 'array',
        position: 1
      }
    ])
  })
})

describe('hasNoValues', () => {
  it('should return true when all fields have no values', () => {
    const values = {}
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should return true when all field values are undefined', () => {
    const values = { firstname: undefined, lastname: undefined }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should return true when all field values are null', () => {
    const values = { firstname: null, lastname: null }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should return true when all field values are empty strings', () => {
    const values = { firstname: '', lastname: '' }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should return true when all field values are empty arrays', () => {
    const values = { email: [], phone: [] }
    const fields = [{ name: 'email' }, { name: 'phone' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should return false when at least one field has a value', () => {
    const values = { firstname: 'John', lastname: undefined }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(false)
  })

  it('should return false when at least one field has a non-empty string', () => {
    const values = { firstname: '', lastname: 'Doe' }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(false)
  })

  it('should return false when at least one field has a non-empty array', () => {
    const values = { email: [{ address: 'john.doe@cozycloud.cc' }], phone: [] }
    const fields = [{ name: 'email' }, { name: 'phone' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(false)
  })

  it('should return true for nested field paths with no values', () => {
    const values = { phone: [{ number: undefined }] }
    const fields = [{ name: 'phone[0].number' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })

  it('should handle mixed array and non-array values', () => {
    const values = { firstname: 'John', lastname: ['Doe'] }
    const fields = [{ name: 'firstname' }, { name: 'lastname' }]

    const res = hasNoValues(values, fields)

    expect(res).toBe(false)
  })

  it('should return true when fields array is empty', () => {
    const values = { firstname: 'John', lastname: 'Doe' }
    const fields = []

    const res = hasNoValues(values, fields)

    expect(res).toBe(true)
  })
})

describe('getFirstValueIfArray', () => {
  it('should return the first value of arrays', () => {
    const values = {
      phone: [{ phone: '123' }, { phone: '456' }],
      email: [{ email: 'test@example.com' }],
      name: 'John'
    }

    const res = getFirstValueIfArray(values)

    expect(res).toEqual({
      phone: { phone: '123' },
      email: { email: 'test@example.com' },
      name: 'John'
    })
  })

  it('should return undefined for empty arrays', () => {
    const values = {
      phone: [],
      email: [{ email: 'test@example.com' }]
    }

    const res = getFirstValueIfArray(values)

    expect(res).toEqual({
      phone: undefined,
      email: { email: 'test@example.com' }
    })
  })

  it('should not mutate the original object', () => {
    const values = {
      phone: [{ phone: '123' }, { phone: '456' }],
      name: 'John'
    }
    const originalValues = JSON.parse(JSON.stringify(values))

    getFirstValueIfArray(values)

    expect(values).toEqual(originalValues)
  })

  it('should handle non-array values', () => {
    const values = {
      name: 'John',
      age: 30,
      active: true,
      address: null
    }

    const res = getFirstValueIfArray(values)

    expect(res).toEqual({
      name: 'John',
      age: 30,
      active: true,
      address: null
    })
  })

  it('should handle mixed array and non-array values', () => {
    const values = {
      phone: [{ phone: '123' }],
      name: 'John',
      email: []
    }

    const res = getFirstValueIfArray(values)

    expect(res).toEqual({
      phone: { phone: '123' },
      name: 'John',
      email: undefined
    })
  })

  it('should return empty object for empty input', () => {
    const values = {}

    const res = getFirstValueIfArray(values)

    expect(res).toEqual({})
  })
})

describe('validateFields', () => {
  it('should return errors for required fields that are empty (non-array fields)', () => {
    const values = {
      name: '',
      email: undefined
    }
    const fields = [
      { name: 'name', required: true },
      { name: 'email', required: true },
      { name: 'phone', required: false }
    ]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({
      name: 'All required fields must be filled in',
      email: 'All required fields must be filled in'
    })
  })

  it('should return errors for required array fields that are empty', () => {
    const values = {
      phone: []
    }
    const fields = [{ name: 'phone', required: true, layout: 'array' }]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({
      phone: [
        {
          phone: 'All required fields must be filled in'
        }
      ]
    })
  })

  it('should not return errors for required array fields with valid first element', () => {
    const values = {
      phone: [{ phone: '123456789' }]
    }
    const fields = [{ name: 'phone', required: true, layout: 'array' }]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({})
  })

  it('should not return errors for non-required fields', () => {
    const values = {
      name: '',
      phone: []
    }
    const fields = [
      { name: 'name', required: false },
      { name: 'phone', required: false, layout: 'array' }
    ]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({})
  })

  it('should handle mixed array and non-array required fields', () => {
    const values = {
      name: '',
      phone: []
    }
    const fields = [
      { name: 'name', required: true },
      { name: 'phone', required: true, layout: 'array' }
    ]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({
      name: 'All required fields must be filled in',
      phone: [
        {
          phone: 'All required fields must be filled in'
        }
      ]
    })
  })

  it('should use getFirstValueIfArray to check only first element of arrays', () => {
    const values = {
      phone: [{ phone: '123' }, {}]
    }
    const fields = [{ name: 'phone', required: true, layout: 'array' }]

    const res = validateFields(values, fields, t)

    // Should not return error because first element has phone value
    expect(res).toEqual({})
  })

  it('should return empty errors object when no required fields are empty', () => {
    const values = {
      name: 'John',
      phone: [{ phone: '123456789' }]
    }
    const fields = [
      { name: 'name', required: true },
      { name: 'phone', required: true, layout: 'array' }
    ]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({})
  })

  it('should return errors for not validated fields', () => {
    const values = { mail: '0mymail@domain.com' }
    const fields = [{ name: 'mail', validate: () => false }]

    const res = validateFields(values, fields, t)

    expect(res).toEqual({ mail: 'Some fields are not filled correctly' })
  })
})
