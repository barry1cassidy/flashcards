import { api } from './api'

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

export const GRADES = [
  { status: 'LEARNING', label: 'Still practicing', hint: 'You still want to practice this scene.' },
  { status: 'LEARNED', label: 'Fully learned', hint: 'You can play this scene without help.' },
]

export const SCENES = [
  { id: 'cafe', title: 'At the cafe', line: 'Order something and talk at the counter.', image: '/scenes/scene-cafe.jpg' },
  { id: 'airport', title: 'At the airport', line: 'Check in, ask about a bag, find the gate.', image: '/scenes/scene-airport.jpg' },
  { id: 'doctor', title: 'At the doctor', line: 'Say what hurts and answer a few questions.', image: '/scenes/scene-doctor.jpg' },
  { id: 'hotel', title: 'At the hotel', line: 'Check in and ask for the room you want.', image: '/scenes/scene-hotel.jpg' },
  { id: 'pharmacy', title: 'At the pharmacy', line: 'Ask for something when you do not know the name.', image: '/scenes/scene-pharmacy.jpg' },
  { id: 'interview', title: 'A job interview', line: 'Introduce yourself and ask about the work.', image: '/scenes/scene-interview.jpg' },
]

const PLACES = {
  cafe: 'Cafe',
  airport: 'Airport',
  doctor: 'Doctor',
  hotel: 'Hotel',
  pharmacy: 'Pharmacy',
  interview: 'Interview',
  custom: 'Custom',
}

export function placeLabel(scenario) {
  return PLACES[scenario] || scenario || 'Scene'
}

export function gradeLabel(status, ratedAt) {
  if (!ratedAt) {
    return 'Not graded'
  }
  if (status === 'LEARNED') {
    return 'Fully learned'
  }
  return 'Still practicing'
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
