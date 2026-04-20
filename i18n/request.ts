import {headers} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {locales} from '../navigation';
 
export default getRequestConfig(async ({locale}) => {
  // If locale is missing or "undefined", try to get it from headers set by middleware
  if (!locale || locale === 'undefined') {
    const h = await headers();
    const headerLocale = h.get('x-next-intl-locale');
    if (headerLocale) {
      locale = headerLocale;
      console.log(`[i18n] Recovered locale from headers: "${locale}"`);
    }
  }
  
  console.log(`[i18n] request.ts processed locale: "${locale}"`);

  // If locale is "undefined" (string) or truly undefined, we need to handle it.
  // In some versions of next-intl, we can try to get it from the headers or just default to 'pt'
  // and hope the client-side provider handles the rest.
  
  const activeLocale = (locale && locales.includes(locale as any)) ? locale : 'pt';
  
  if (activeLocale !== locale) {
     console.log(`[i18n] Using fallback "${activeLocale}" because incoming locale was "${locale}"`);
  }

  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default
  };
}) as any;
