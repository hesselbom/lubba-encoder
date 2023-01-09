/* global btoa atob */
import * as encoding from 'lib0/dist/encoding.cjs'
import * as decoding from 'lib0/dist/decoding.cjs'
import { parse as parseYaml } from 'yaml'

const reverseObject = (object) => (
  Object.keys(object).reduce((res, key) => { res[object[key]] = key; return res }, {})
)

const partTitleMap = {
  Warmup: 1,
  Activity: 2,
  Fast: 3,
  Recover: 4,
  Rest: 5,
  Cooldown: 6,
  Ski: 7,
  Run: 8,
  Skate: 9,
  Walk: 10
}
const layoutMap = {
  1: 1,
  '2+1': 2,
  '2+2': 3,
  '2+3': 4,
  '3+3': 5,
  '1+1': 6
}
const valueGoalTypeMap = {
  duration: 1,
  distance: 2,
  distanceTest: 3,
  paceCurrent: 4,
  paceTest: 5,
  paceTest2: 6,
  paceAverageDuration: 7,
  bpm: 8,
  bpmAverageDuration: 9,
  intervalLeft: 10,
  durationInterval: 11,
  distanceInterval: 12,
  desiredAccuracy: 13,
  pace: 14, // used for target type
  paceSplits: 15,
  smartDistance: 16,
  smartDuration: 17,
  speedCurrent: 18,
  speedAverageDuration: 19,
  totalActiveEnergyBurned: 20,
  activeEnergyBurnedInterval: 21,
  totalEnergyBurned: 22,
  energyBurnedInterval: 23,
  runningPower: 24,
  runningVerticalOscillation: 25,
  runningGroundContactTime: 26,
  rpe: 27,
  speed: 28,
  cyclingPower: 29
}

const partTitleMapReverse = reverseObject(partTitleMap)
const layoutMapReverse = reverseObject(layoutMap)
const valueGoalTypeMapReverse = reverseObject(valueGoalTypeMap)

function getBit (number, bitPosition) {
  return (number & (1 << bitPosition)) === 0 ? 0 : 1
}

function updateBit (number, bitPosition, bitValue) {
  const bitValueNormalized = bitValue ? 1 : 0
  const clearMask = ~(1 << bitPosition)
  return (number & clearMask) | (bitValueNormalized << bitPosition)
}

function encodePart (part, encoder) {
  // Set flags for nil values
  let flagsA = 0
  let flagsB = 0

  flagsA = updateBit(flagsA, 0, part.title != null)
  flagsA = updateBit(flagsA, 1, part.layout != null)
  flagsA = updateBit(flagsA, 2, part.layoutValues != null && part.layoutValues.length > 0)
  flagsA = updateBit(flagsA, 3, part.goalType != null)
  flagsA = updateBit(flagsA, 4, part.goalValue != null)
  flagsA = updateBit(flagsA, 5, part.goalIsVariable === true)
  flagsA = updateBit(flagsA, 6, part.targetType != null)
  flagsA = updateBit(flagsA, 7, part.targetMin != null)

  flagsB = updateBit(flagsB, 0, part.targetMax != null)
  flagsB = updateBit(flagsB, 1, part.repeats != null && part.repeats > 0)
  flagsB = updateBit(flagsB, 2, part.repeatParts != null && part.repeatParts.length > 0)

  encoding.writeUint8(encoder, flagsA)
  encoding.writeUint8(encoder, flagsB)

  // Use part title map, or custom title
  if (part.title != null) {
    const titleIndex = partTitleMap[part.title]
    if (titleIndex) {
      encoding.writeUint8(encoder, titleIndex)
    } else {
      encoding.writeUint8(encoder, 0) // 0 indicates custom string
      encoding.writeVarString(encoder, part.title)
    }
  }

  if (part.layout != null) encoding.writeUint8(encoder, layoutMap[part.layout])
  if (part.layoutValues != null && part.layoutValues.length > 0) {
    encoding.writeUint8(encoder, part.layoutValues.length)

    for (const value of part.layoutValues) {
      encoding.writeUint8(encoder, valueGoalTypeMap[value])
    }
  }

  if (part.goalType != null) encoding.writeUint8(encoder, valueGoalTypeMap[part.goalType])
  if (part.goalValue != null) encoding.writeFloat64(encoder, part.goalValue)

  if (part.targetType != null) encoding.writeUint8(encoder, valueGoalTypeMap[part.targetType])
  if (part.targetMin != null) encoding.writeFloat64(encoder, part.targetMin)
  if (part.targetMax != null) encoding.writeFloat64(encoder, part.targetMax)

  if (part.repeats != null && part.repeats > 0) encoding.writeUint8(encoder, part.repeats)

  if (part.repeatParts != null && part.repeatParts.length > 0) {
    encoding.writeUint8(encoder, part.repeatParts.length)

    for (const subPart of part.repeatParts) {
      encodePart(subPart, encoder)
    }
  }
}

function decodePart (decoder) {
  const part = {}

  // Some flags to indicate what values is non-nil
  const flagsA = decoding.readUint8(decoder)
  const flagsB = decoding.readUint8(decoder)

  const hasTitle = getBit(flagsA, 0)
  const hasLayout = getBit(flagsA, 1)
  const hasLayoutValues = getBit(flagsA, 2)
  const hasGoalType = getBit(flagsA, 3)
  const hasGoalValue = getBit(flagsA, 4)
  const hasGoalIsVariable = getBit(flagsA, 5)
  const hasTargetType = getBit(flagsA, 6)
  const hasTargetMin = getBit(flagsA, 7)

  const hasTargetMax = getBit(flagsB, 0)
  const hasRepeats = getBit(flagsB, 1)
  const hasRepeatParts = getBit(flagsB, 2)

  // Use part title map, or custom title
  if (hasTitle) {
    const titleIndex = decoding.readUint8(decoder)
    const titleIsCustomString = titleIndex === 0
    part.title = titleIsCustomString ? decoding.readVarString(decoder) : partTitleMapReverse[titleIndex]
  }

  if (hasLayout) part.layout = layoutMapReverse[decoding.readUint8(decoder)]
  if (hasLayoutValues) {
    const amountValues = decoding.readUint8(decoder)
    part.layoutValues = []

    for (let j = 0; j < amountValues; j++) {
      part.layoutValues.push(valueGoalTypeMapReverse[decoding.readUint8(decoder)])
    }
  }

  if (hasGoalType) part.goalType = valueGoalTypeMapReverse[decoding.readUint8(decoder)]
  if (hasGoalValue) part.goalValue = decoding.readFloat64(decoder)
  if (hasGoalIsVariable) part.goalIsVariable = true

  if (hasTargetType) part.targetType = valueGoalTypeMapReverse[decoding.readUint8(decoder)]
  if (hasTargetMin) part.targetMin = decoding.readFloat64(decoder)
  if (hasTargetMax) part.targetMax = decoding.readFloat64(decoder)

  if (hasRepeats) part.repeats = decoding.readUint8(decoder)
  if (hasRepeatParts) {
    const amountParts = decoding.readUint8(decoder)
    part.repeatParts = []

    for (let j = 0; j < amountParts; j++) {
      part.repeatParts.push(decodePart(decoder))
    }
  }

  return part
}

export function encodeYamlToLubbaData (yaml, encodingVersion) {
  const object = parseYaml(yaml)

  return encodeJsonObjectToLubbaData(object, encodingVersion)
}

export function encodeJsonObjectToLubbaData (object, encodingVersion) {
  const encoder = encoding.createEncoder()

  encoding.writeUint8(encoder, encodingVersion)
  encoding.writeUint8(encoder, object.isMetric ? 1 : 0)
  encoding.writeVarString(encoder, object.title)
  encoding.writeUint32(encoder, object.activityType)
  encoding.writeUint8(encoder, object.locationType)

  // Parts
  const amountParts = (object.parts && object.parts.length) || 0
  encoding.writeUint8(encoder, amountParts)

  for (const part of object.parts) {
    encodePart(part, encoder)
  }

  return encoding.toUint8Array(encoder)
}

export function decodeLubbaData (data) {
  const decoder = decoding.createDecoder(data)
  const encodingVersion = decoding.readUint8(decoder)

  if (encodingVersion === 1) {
    const decoded = {
      isCustom: true // Assume all are custom
    }

    decoded.isMetric = decoding.readUint8(decoder) === 1
    decoded.title = decoding.readVarString(decoder)
    decoded.activityType = decoding.readUint32(decoder)
    decoded.locationType = decoding.readUint8(decoder)

    // Parts
    const amountParts = decoding.readUint8(decoder)
    decoded.parts = []
    for (let i = 0; i < amountParts; i++) {
      decoded.parts.push(decodePart(decoder))
    }

    return decoded
  }

  return null
}

// Some short encoding (base64)
export function encodeLubbaDataToHash (data, urlEncode) {
  let s = ''
  for (const byte of data) {
    s += String.fromCharCode(byte)
  }

  if (urlEncode) {
    return btoa(s).replace(/\//g, '%2F')
  } else {
    return btoa(s)
  }
}

export function decodeLubbaDataFromHash (hash) {
  const a = atob(hash)
  const bytes = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) {
    bytes[i] = a.charCodeAt(i)
  }
  return bytes
}
