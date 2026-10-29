import { useTranslation } from 'react-i18next'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../support'

export const APPLE_STANDARD_EULA =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

export default function TermsPage() {
  const { t } = useTranslation()
  return (
    <div className="marketing">
      <MarketingHeader />
      <article className="marketing-wrap legal-doc">
        <h1>{t('terms.title')}</h1>
        <p className="muted">{t('terms.updated')}</p>
        <p>{t('terms.intro')}</p>

        <h2>{t('terms.whoHeading')}</h2>
        <p>{t('terms.whoBody')}</p>

        <h2>{t('terms.accountsHeading')}</h2>
        <p>{t('terms.accountsBody')}</p>

        <h2>{t('terms.subscriptionsHeading')}</h2>
        <p>{t('terms.subscriptionsBody')}</p>
        <p>
          {t('terms.eulaBody')}{' '}
          <a href={APPLE_STANDARD_EULA} rel="noopener noreferrer" target="_blank">
            {t('terms.eulaLink')}
          </a>
        </p>

        <h2>{t('terms.acceptableHeading')}</h2>
        <p>{t('terms.acceptableBody')}</p>

        <h2>{t('terms.contentHeading')}</h2>
        <p>{t('terms.contentBody')}</p>

        <h2>{t('terms.aiHeading')}</h2>
        <p>{t('terms.aiBody')}</p>

        <h2>{t('terms.changesHeading')}</h2>
        <p>{t('terms.changesBody')}</p>

        <h2>{t('terms.contactHeading')}</h2>
        <p>{t('terms.contactBody')}</p>
        <p>
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
      </article>
      <MarketingFooter />
    </div>
  )
}
