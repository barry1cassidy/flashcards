export const STUDY_ORDERS = [
  { value: 'POSITION', labelKey: 'settings.studyOrderPosition' },
  { value: 'REVERSE', labelKey: 'settings.studyOrderReverse' },
  { value: 'RANDOM', labelKey: 'settings.studyOrderRandom' },
]

export const RESTUDY_WAITS = [
  { value: 'ONE_DAY', labelKey: 'settings.restudyWaitDay' },
  { value: 'IMMEDIATE', labelKey: 'settings.restudyWaitNow' },
]

export function normalizeStudyOrder(value) {
  return STUDY_ORDERS.some((item) => item.value === value) ? value : 'POSITION'
}

export function normalizeRestudyWait(value) {
  return RESTUDY_WAITS.some((item) => item.value === value) ? value : 'ONE_DAY'
}
