/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import {
  encodeYamlToLubbaData,
  encodeJsonObjectToLubbaData,
  decodeLubbaData,
  encodeLubbaDataToHash,
  decodeLubbaDataFromHash
} from './index'

const yaml = `id: 123abc-dsa
isMetric: true
title: Runcoach Speed 04/13
isCustom: true
activityType: 37
locationType: 3
parts:
- title: Warmup
  goalType: distance
  goalValue: 2e+3
- title: Drills
- title: Custom layout
  layout: 2+2
  layoutValues:
    - distance
    - duration
    - bpm
    - paceCurrent
- repeats: 4
  repeatParts:
  - title: Run
    goalType: duration
    goalValue: 3e+2
    targetType: pace
    targetMin: 2.56e+2
    targetMax: 2.76e+2
  - title: Recover
    goalType: duration
    goalValue: 1.8e+2
  - title: Pace Splits
    goalType: distance
    goalValue: 2e+3
    targetType: paceSplits
    targetMin: 3e+2
    targetMax: -1
- title: Cooldown
  goalType: distance
  goalTypeVariation: 1
  goalIsVariable: true
  targetType: bpm
  targetMin: 0
  targetMax: 3e+2
`

const jsonObject = {
  id: '123abc-dsa',
  isMetric: true,
  title: 'Runcoach Speed 04/13',
  isCustom: true,
  activityType: 37,
  locationType: 3,
  parts: [
    {
      title: 'Warmup',
      goalType: 'distance',
      goalValue: 2000
    },
    {
      title: 'Drills'
    },
    {
      title: 'Custom layout',
      layout: '2+2',
      layoutValues: [
        'distance',
        'duration',
        'bpm',
        'paceCurrent'
      ]
    },
    {
      repeats: 4,
      repeatParts: [
        {
          title: 'Run',
          goalType: 'duration',
          goalValue: 300,
          targetType: 'pace',
          targetMin: 256,
          targetMax: 276
        },
        {
          title: 'Recover',
          goalType: 'duration',
          goalValue: 180
        },
        {
          title: 'Pace Splits',
          goalType: 'distance',
          goalValue: 2000,
          targetType: 'paceSplits',
          targetMin: 300,
          targetMax: -1
        }
      ]
    },
    {
      title: 'Cooldown',
      goalType: 'distance',
      goalTypeVariation: 1,
      goalIsVariable: true,
      targetType: 'bpm',
      targetMin: 0,
      targetMax: 300
    }
  ]
}

const result = {
  isMetric: true,
  title: 'Runcoach Speed 04/13',
  isCustom: true,
  activityType: 37,
  locationType: 3,
  parts: [
    { title: 'Warmup', goalType: 'distance', goalValue: 2000 },
    { title: 'Drills' },
    {
      title: 'Custom layout',
      layout: '2+2',
      layoutValues: ['distance', 'duration', 'bpm', 'paceCurrent']
    },
    {
      repeats: 4,
      repeatParts: [
        {
          title: 'Run',
          goalType: 'duration',
          goalValue: 300,
          targetType: 'pace',
          targetMin: 256,
          targetMax: 276
        },
        {
          title: 'Recover',
          goalType: 'duration',
          goalValue: 180
        },
        {
          title: 'Pace Splits',
          goalType: 'distance',
          goalValue: 2000,
          targetType: 'paceSplits',
          targetMin: 300,
          targetMax: -1
        }
      ]
    },
    {
      title: 'Cooldown',
      goalType: 'distance',
      goalTypeVariation: 1,
      goalIsVariable: true,
      targetType: 'bpm',
      targetMin: 0,
      targetMax: 300
    }
  ]
}

test('works encoding and then decoding with yaml', () => {
  const encodingVersion = 1
  const encoded = encodeYamlToLubbaData(yaml, encodingVersion)
  const decoded = decodeLubbaData(encoded)

  // Expect first byte to be version
  expect(encoded[0]).toBe(encodingVersion)

  expect(decoded).toEqual(result)
})

test('works encoding and then decoding with json object', () => {
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData(jsonObject, encodingVersion)
  const decoded = decodeLubbaData(encoded)

  // Expect first byte to be version
  expect(encoded[0]).toBe(encodingVersion)

  expect(decoded).toEqual(result)
})

test('works encoding for url hash', () => {
  /*
    https://stackoverflow.com/a/44532746/511949
    Max hash size:

    Chrome: 50K+
    Firefox: 50K+
    Safari (iOS): 50K+
    Internet Explorer 11: Fails between 2,025 and 2,050
    Microsoft Edge: Fails between 2,025 and 2,050
  */
  const MAX_HASH_SIZE = 2020
  const encodingVersion = 1
  const encoded = encodeYamlToLubbaData(yaml, encodingVersion)
  const hash = encodeLubbaDataToHash(encoded)
  const decodedFromHash = decodeLubbaDataFromHash(hash)
  const decoded = decodeLubbaData(decodedFromHash)

  // No need to check exact hash, but just that we get a string
  expect(typeof hash).toBe('string')
  expect(hash.length < MAX_HASH_SIZE).toBe(true)

  // Log hash to be able to test against other implementations
  console.log('Encoded bytes:', encoded.join(','))
  console.log('Encoded hash:', hash)

  expect(decodedFromHash).toEqual(encoded)
  expect(decoded).toEqual(result)
})

test('url encodes slashes to work in browser', () => {
  // This specific jsonObject generates a / with base64 hash encoding. Should be replaced by encodeURIComponent('/') == '%2F'
  const jsonObject = {
    isCustom: true,
    isMetric: true,
    title: 'My custom workout',
    activityType: 37,
    locationType: 3,
    parts: [
      { title: 'Warmup' },
      { title: 'Run', goalType: 'distance', goalValue: 21000, targetType: 'paceSplits', targetMin: 4800, targetMax: 1 },
      { title: 'Cooldown' }
    ]
  }
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData(jsonObject, encodingVersion)
  const hash = encodeLubbaDataToHash(encoded)
  const hashForUrl = encodeLubbaDataToHash(encoded, true)

  expect(hash.includes('/')).toBe(true)
  expect(hash.includes('%2F')).toBe(false)

  expect(hashForUrl.includes('/')).toBe(false)
  expect(hashForUrl.includes('%2F')).toBe(true)
})

test('supports dfaAlpha1 layout values', () => {
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'DFA workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '1',
        layoutValues: ['dfaAlpha1']
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'DFA workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '1',
        layoutValues: ['dfaAlpha1']
      }
    ]
  })
})

test('supports CORE2 temperature layout values', () => {
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'CORE2 workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+1',
        layoutValues: [
          'coreBodyTemperature',
          'skinTemperature',
          'heatStrainIndex'
        ]
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'CORE2 workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+1',
        layoutValues: [
          'coreBodyTemperature',
          'skinTemperature',
          'heatStrainIndex'
        ]
      }
    ]
  })
})

test('supports Tymewear breathing layout values', () => {
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'Tymewear workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+3',
        layoutValues: [
          'breathingRate',
          'tidalVolume',
          'minuteVentilation',
          'minuteVentilationAverage60s',
          'inhaleExhaleRatio'
        ]
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'Tymewear workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+3',
        layoutValues: [
          'breathingRate',
          'tidalVolume',
          'minuteVentilation',
          'minuteVentilationAverage60s',
          'inhaleExhaleRatio'
        ]
      }
    ]
  })
})

test('supports VE workout targets', () => {
  const encodingVersion = 1
  const workout = {
    isCustom: true,
    isMetric: true,
    title: 'VE target workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        goalType: 'duration',
        goalValue: 600,
        targetType: 've',
        targetMin: 40,
        targetMax: 48,
        layout: '1+1',
        layoutValues: ['minuteVentilation', 'minuteVentilationAverage60s']
      }
    ]
  }

  const encoded = encodeJsonObjectToLubbaData(workout, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual(workout)
})

test('supports power percentage of CP layout values', () => {
  const encodingVersion = 1
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'Power percentage workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '1',
        layoutValues: ['powerPercentageCP']
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'Power percentage workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '1',
        layoutValues: ['powerPercentageCP']
      }
    ]
  })
})

test('supports power average percentage of CP layout values', () => {
  const encodingVersion = 1
  const layoutValues = [
    'powerAverageDurationPercentageCP',
    'powerAverage3sPercentageCP',
    'powerAverage10sPercentageCP',
    'powerAverageIntervalPercentageCP'
  ]
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'Power average percentage workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+2',
        layoutValues
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'Power average percentage workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+2',
        layoutValues
      }
    ]
  })
})

test('supports power to heart rate ratio layout values', () => {
  const encodingVersion = 1
  const layoutValues = [
    'powerToHeartRateRatio',
    'powerToHeartRateRatioAverageDuration',
    'powerToHeartRateRatioAverageInterval'
  ]
  const encoded = encodeJsonObjectToLubbaData({
    isCustom: true,
    isMetric: true,
    title: 'Power to HR ratio workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+1',
        layoutValues
      }
    ]
  }, encodingVersion)

  expect(decodeLubbaData(encoded)).toEqual({
    isCustom: true,
    isMetric: true,
    title: 'Power to HR ratio workout',
    activityType: 37,
    locationType: 1,
    parts: [
      {
        title: 'Run',
        layout: '2+1',
        layoutValues
      }
    ]
  })
})

test('preserves workout notes layout values in single, grid, and nested layouts', () => {
  const workout = {
    isCustom: true,
    isMetric: true,
    title: 'Race plan',
    activityType: 37,
    locationType: 3,
    parts: [
      { layout: '1', layoutValues: ['workoutNotes'] },
      {
        layout: '2+2',
        layoutValues: ['workoutNotes', 'duration', 'distance', 'bpm']
      },
      {
        repeats: 2,
        repeatParts: [{ layout: '1', layoutValues: ['workoutNotes'] }]
      }
    ]
  }
  const encoded = encodeJsonObjectToLubbaData(workout, 1)
  const hash = encodeLubbaDataToHash(encoded)

  expect(decodeLubbaData(decodeLubbaDataFromHash(hash))).toEqual(workout)
})

test('uses the next unused layout value ID without changing existing IDs', () => {
  const encoded = encodeJsonObjectToLubbaData({
    isMetric: true,
    title: '',
    activityType: 37,
    locationType: 3,
    parts: [{ layoutValues: ['inhaleExhaleRatio', 'workoutNotes', 'duration'] }]
  }, 1)

  expect(Array.from(encoded.slice(-3))).toEqual([71, 72, 1])
})

test.each([
  '',
  'Fuel every 30 minutes.\n\nRelax shoulders.\nFinish strong.\n',
  'Ät en gel. 飲水 🏃\nKeep going!',
  'Long race plan: fuel, drink, relax.\n'.repeat(3000)
])('preserves notes through JSON and URL hash encoding (%#)', (notes) => {
  const workout = { ...jsonObject, notes }
  const encoded = encodeJsonObjectToLubbaData(workout, 1)
  const hash = encodeLubbaDataToHash(encoded, true)
  const decoded = decodeLubbaData(decodeLubbaDataFromHash(decodeURIComponent(hash)))

  expect(decoded).toEqual({ ...result, notes })
  const legacyBytes = encodeJsonObjectToLubbaData(jsonObject, 1)
  expect(encoded.slice(0, legacyBytes.length)).toEqual(legacyBytes)
})

test('preserves YAML multiline notes', () => {
  const encoded = encodeYamlToLubbaData(yaml + `notes: |
  Take a gel every 30 minutes.

  Relax shoulders.
`, 1)
  expect(decodeLubbaData(encoded)).toEqual({
    ...result,
    notes: 'Take a gel every 30 minutes.\n\nRelax shoulders.\n'
  })
})

test('omits null notes and keeps legacy hashes unchanged', () => {
  const legacyBytes = encodeJsonObjectToLubbaData(jsonObject, 1)
  const withoutNotes = encodeJsonObjectToLubbaData({ ...jsonObject, notes: null }, 1)

  expect(withoutNotes).toEqual(legacyBytes)
  expect(decodeLubbaData(withoutNotes)).toEqual(result)
  expect(decodeLubbaData(decodeLubbaDataFromHash(
    'AQERTXkgY3VzdG9tIHdvcmtvdXQlAAAAAwMBAAEZAAgCQI9AAAAAAAABAAY='
  ))).toMatchObject({
    title: 'My custom workout',
    parts: [
      { title: 'Warmup' },
      { title: 'Run', goalType: 'distance', goalValue: 1000 },
      { title: 'Cooldown' }
    ]
  })
})
