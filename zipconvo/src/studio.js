import { api } from './api'
import i18n from './i18n'

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

export const GRADE_STATUSES = ['LEARNING', 'LEARNED']

export const SCENES = [
  { id: 'cafe', image: '/scenes/scene-cafe.jpg' },
  { id: 'airport', image: '/scenes/scene-airport.jpg' },
  { id: 'doctor', image: '/scenes/scene-doctor.jpg' },
  { id: 'hotel', image: '/scenes/scene-hotel.jpg' },
  { id: 'pharmacy', image: '/scenes/scene-pharmacy.jpg' },
  { id: 'interview', image: '/scenes/scene-interview.jpg' },
]

export function placeLabel(scenario) {
  if (!scenario) {
    return i18n.t('places.scene')
  }
  return i18n.t(`places.${scenario}`, { defaultValue: scenario })
}

export function sceneImage(scenario) {
  return SCENES.find((scene) => scene.id === scenario)?.image || ''
}

export function gradeLabel(status, ratedAt) {
  if (!ratedAt) {
    return i18n.t('grades.none')
  }
  if (status === 'LEARNED') {
    return i18n.t('grades.learned')
  }
  return i18n.t('grades.practicing')
}

export function gradeClass(status, ratedAt) {
  if (!ratedAt) {
    return 'none'
  }
  return status === 'LEARNED' ? 'learned' : 'learning'
}

export async function generateConversation(body) {
  const started = await api('/api/language-studio/conversations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (started.conversation?.id) {
    return started.conversation
  }
  const deadline = Date.now() + 5 * 60 * 1000
  let current = started
  while (current.state === 'running') {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the conversation')
    }
    await wait(700)
    current = await api(`/api/language-studio/jobs/${started.jobId}`)
  }
  if (current.state === 'done' && current.conversation?.id) {
    return current.conversation
  }
  throw new Error(current.error || 'The conversation could not be written')
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
