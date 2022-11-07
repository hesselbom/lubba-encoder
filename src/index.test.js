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
