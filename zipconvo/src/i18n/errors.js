import i18n from './index'

const ERROR_KEYS = {
  'Invalid email or password': 'errors.invalidCredentials',
  'An account with that email already exists': 'errors.emailExists',
  'Password must be at least 8 characters': 'errors.passwordLength',
  'Not authenticated': 'errors.notAuthenticated',
  'Verify your email': 'errors.verifyEmail',
  'Pro license required': 'errors.proRequired',
  'Out of AI credits': 'errors.outOfAiCredits',
  'AI is not configured': 'errors.aiNotConfigured',
  'Daily AI limit reached': 'errors.dailyAiLimit',
  'The AI is busy right now. You were not charged. Try again in a minute.': 'errors.aiBusy',
  'AI request failed': 'errors.aiRequestFailed',
  'The AI did not create a conversation. You were not charged.': 'errors.studioNoConversation',
  'Conversation not found': 'errors.conversationNotFound',
  'Choose two different languages': 'errors.studioLanguages',
  'Describe the scene': 'errors.studioDescribeScene',
  'Keep the extra details under 240 characters': 'errors.studioCustomPrompt',
  'Choose how the conversation went': 'errors.studioRate',
  'Unsupported locale': 'errors.unsupportedLocale',
  'Validation failed': 'errors.validationFailed',
  'Unexpected error': 'errors.unexpected',
  'Request failed': 'errors.requestFailed',
  'No connection': 'errors.noConnection',
  'Google sign-in is not configured': 'errors.googleNotConfigured',
  'Invalid Google sign-in': 'errors.googleInvalid',
  'Google email is not verified': 'errors.googleEmailUnverified',
  'This account uses Google sign-in': 'errors.useGoogleSignIn',
  'Google sign-in failed to load': 'errors.googleFailedToLoad',
  'Timed out waiting for the conversation': 'errors.timedOut',
  'The conversation could not be written': 'errors.notWritten',
  'Something went wrong': 'errors.somethingWrong',
  'This conversation has no lines to turn into cards': 'errors.noLines',
  'Deck not found': 'errors.deckNotFound',
  'Card not found': 'errors.cardNotFound',
  'You already have a deck with that name': 'errors.deckNameTaken',
  'Payment failed': 'errors.paymentFailed',
  'Samples are to and from English': 'errors.samplesEnglish',
  'This Apple subscription belongs to another Zipdeck account. Sign in with that account.': 'errors.storeOtherAccount',
  'This Google Play subscription belongs to another Zipdeck account. Sign in with that account.': 'errors.storeOtherAccount',
}

export function translateError(message) {
  const key = ERROR_KEYS[message]
  return key ? i18n.t(key) : message
}
