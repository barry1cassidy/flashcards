import { useTranslation } from 'react-i18next'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

export default function PrivacyPage() {
  const { t } = useTranslation()
  return (
    <div className="marketing">
      <MarketingHeader />
      <article className="marketing-wrap legal-doc">
        <h1>{t('privacy.title')}</h1>
        <p className="muted">{t('privacy.updated')}</p>
        <p>{t('privacy.intro')}</p>

        <h2>{t('privacy.whoHeading')}</h2>
        <p>{t('privacy.whoBody')}</p>

        <h2>{t('privacy.googleHeading')}</h2>
        <p>{t('privacy.googleBody')}</p>
        <ul>
          <li>{t('privacy.googleItemName')}</li>
          <li>{t('privacy.googleItemEmail')}</li>
          <li>{t('privacy.googleItemId')}</li>
        </ul>
        <p>{t('privacy.googleUse')}</p>
        <p>{t('privacy.googleNot')}</p>

        <h2>{t('privacy.accountHeading')}</h2>
        <p>{t('privacy.accountBody')}</p>

        <h2>{t('privacy.studyHeading')}</h2>
        <p>{t('privacy.studyBody')}</p>

        <h2>{t('privacy.aiHeading')}</h2>
        <p>{t('privacy.aiBody')}</p>

        <h2>{t('privacy.hostingHeading')}</h2>
        <p>{t('privacy.hostingBody')}</p>

        <h2>{t('privacy.shareHeading')}</h2>
        <p>{t('privacy.shareBody')}</p>

        <h2>{t('privacy.rightsHeading')}</h2>
        <p>{t('privacy.rightsBody')}</p>

        <h2>{t('privacy.childrenHeading')}</h2>
        <p>{t('privacy.childrenBody')}</p>

        <h2>{t('privacy.changesHeading')}</h2>
        <p>{t('privacy.changesBody')}</p>

        <h2>{t('privacy.contactHeading')}</h2>
        <p>{t('privacy.contactBody')}</p>
      </article>
      <MarketingFooter />
    </div>
  )
}
