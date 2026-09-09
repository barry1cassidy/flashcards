const ERROR_KEYS = {
  'Unsupported language': 'errors.unsupportedLanguage',
  'An account with that email already exists': 'errors.emailExists',
  'Invalid email or password': 'errors.invalidCredentials',
  'Not authenticated': 'errors.notAuthenticated',
  'Deck not found': 'errors.deckNotFound',
  'Group not found': 'errors.groupNotFound',
  'Set not found': 'errors.groupNotFound',
  'Library group not found': 'errors.libraryGroupNotFound',
  'Library deck not found': 'errors.libraryDeckNotFound',
  'Card not found': 'errors.cardNotFound',
  'CSV file is required': 'errors.csvRequired',
  'Could not read CSV file': 'errors.csvUnreadable',
  'CSV file is empty': 'errors.csvEmpty',
  'Each row needs a front and back column': 'errors.csvColumns',
  'Each card needs both a front and a back': 'errors.csvCardFields',
  'No cards found in CSV': 'errors.csvNoCards',
  'Card list does not match this deck': 'errors.cardOrderMismatch',
  'That deck is not in this group': 'errors.deckNotInGroup',
  'That deck is not in this set': 'errors.deckNotInGroup',
  'Password must be at least 8 characters': 'errors.passwordLength',
  'Unsupported locale': 'errors.unsupportedLocale',
  'Validation failed': 'errors.validationFailed',
  'Unexpected error': 'errors.unexpected',
  'Request failed': 'errors.requestFailed',
  'Google sign-in is not configured': 'errors.googleNotConfigured',
  'Invalid Google sign-in': 'errors.googleInvalid',
  'Google email is not verified': 'errors.googleEmailUnverified',
  'This account uses Google sign-in': 'errors.useGoogleSignIn',
  'Google sign-in failed to load': 'errors.googleFailedToLoad',
  'Billing stub is disabled': 'errors.billingStubDisabled',
  'Pro license required': 'errors.proRequired',
  'AI is not configured': 'errors.aiNotConfigured',
  'Daily AI limit reached': 'errors.dailyAiLimit',
  'AI request failed': 'errors.aiRequestFailed',
  'The AI did not create a deck': 'errors.aiDidNotCreateDeck',
  'Agent job not found': 'errors.agentJobNotFound',
  'Timed out waiting for AI': 'errors.aiTimedOut',
}

export function translateError(t, message) {
  if (!message) {
    return t('errors.requestFailed')
  }
  const key = ERROR_KEYS[message]
  return key ? t(key) : message
}
