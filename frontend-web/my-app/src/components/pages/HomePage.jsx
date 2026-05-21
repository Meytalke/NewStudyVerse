import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('home.hero.title')}</h1>
          <p className="hero-subtitle">{t('home.hero.subtitle')}</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">{t('home.hero.join_now')}</Link>
            <Link to="/groups" className="btn btn-secondary">{t('home.hero.explore_groups')}</Link>
          </div>
        </div>
      </div>

        <section className="features-section">
          {/* <h1 className="section-title">{t('home.features.section_title')}</h1> */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>{t('home.features.summary_title')}</h3>
              <p>{t('home.features.summary_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>{t('home.features.chat_title')}</h3>
              <p>{t('home.features.chat_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>{t('home.features.groups_title')}</h3>
              <p>{t('home.features.groups_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t('home.features.stats_title')}</h3>
              <p>{t('home.features.stats_desc')}</p>
            </div>
          </div>
        </section>

        <section className="join-cta-section">
          <div className="cta-content">
            <h2>{t('home.cta.ready_title')}</h2>
            <p>{t('home.cta.ready_desc')}</p>
            <Link to="/register" className="btn btn-cta">{t('home.cta.sign_up_free')}</Link>
          </div>
        </section>
    </div>   
  );
};

export default HomePage;