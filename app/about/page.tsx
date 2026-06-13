import AboutClient from './AboutClient';

export const metadata = {
  title: 'О проекте · Долина Элегий',
  description: 'О неспешности, внимании и свете, который прячется в обычном дне.',
};

export default function AboutPage() {
  return (
    <div className="page page-enter">
      <div className="container">
        <AboutClient />
      </div>
    </div>
  );
}
