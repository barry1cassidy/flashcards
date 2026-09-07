export const DECK_SORTS = [
  { value: 'NEWEST', labelKey: 'settings.sortNewest' },
  { value: 'OLDEST', labelKey: 'settings.sortOldest' },
  { value: 'NAME_ASC', labelKey: 'settings.sortNameAsc' },
  { value: 'NAME_DESC', labelKey: 'settings.sortNameDesc' },
]

export function normalizeDeckSort(value) {
  return DECK_SORTS.some((item) => item.value === value) ? value : 'NEWEST'
}

export function sortDecks(decks, sort) {
  const list = [...decks]
  const mode = normalizeDeckSort(sort)
  list.sort((left, right) => {
    if (mode === 'OLDEST') {
      return compareDates(left.createdAt, right.createdAt)
    }
    if (mode === 'NAME_ASC') {
      return compareNames(left.name, right.name)
    }
    if (mode === 'NAME_DESC') {
      return compareNames(right.name, left.name)
    }
    return compareDates(right.createdAt, left.createdAt)
  })
  return list
}

function compareDates(left, right) {
  return new Date(left || 0).getTime() - new Date(right || 0).getTime()
}

function compareNames(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}
