import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { Monogram } from '../components/Brand';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-q flex min-h-[75vh] flex-col items-center justify-center text-center">
      <Monogram className="h-20 w-20" draw />
      <p className="mt-8 font-display text-[clamp(100px,18vw,260px)] leading-none italic gold-text">404</p>
      <h1 className="mt-4 font-display text-3xl italic">{t('notfound')}</h1>
      <Link to="/" className="btn btn-noir mt-10">{t('back_home')}</Link>
    </div>
  );
}
