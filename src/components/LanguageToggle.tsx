import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors min-h-[44px]"
      title={language === 'en' ? 'Switch to Dutch' : 'Schakel naar Engels'}
    >
      <Languages size={18} />
      <span className="text-sm font-semibold">{language === 'en' ? 'EN' : 'NL'}</span>
    </button>
  );
}
