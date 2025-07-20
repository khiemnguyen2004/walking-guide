import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFooterSettings } from "../api/settingsApi";

function Footer() {
  const [settings, setSettings] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    getFooterSettings()
      .then(res => {
        if (mounted && res.data && res.data.success) {
          setSettings(res.data.data || {});
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const about = settings.footerDescription || t("Walking Guide là một trang web giúp bạn lên kế hoạch du lịch, và tìm kiếm các địa điểm du lịch gần bạn.");
  const copyright = settings.footerCopyright || t(`© ${new Date().getFullYear()} Walking Guide. All rights reserved.`);
  const contactEmail = settings.contactEmail || t("info@walkingguide.com");
  const contactPhone = settings.contactPhone || t("+1 234 567 890");
  const contactAddress = settings.contactAddress || t("");
  const facebookUrl = settings.facebookUrl || t("https://facebook.com");
  const instagramUrl = settings.instagramUrl || t("https://instagram.com");
  const twitterUrl = settings.twitterUrl || "https://twitter.com";
  const youtubeUrl = settings.youtubeUrl || "";

  return (
    <footer className="luxury-footer">
      <div className="container">
        <div className="row text-center text-md-start gy-4 align-items-start">
          {/* About */}
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <h5 className="mb-3" style={{color:'#b6e0fe'}}>{t("About")}</h5>
            <p style={{fontSize: '1rem', color: '#e3f0ff', margin: 0}}>
              {about}
            </p>
          </div>
          {/* Quick Links */}
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <h5 className="mb-3" style={{color:'#b6e0fe'}}>{t("Quick Links")}</h5>
            <ul className="list-unstyled" style={{fontSize: '1rem', color: '#e3f0ff', margin: 0}}>
              <li><a href="/" style={{color: '#fff', textDecoration: 'underline'}}>{t("Home")}</a></li>
              <li><a href="/tours" style={{color: '#fff', textDecoration: 'underline'}}>{t("Tours")}</a></li>
              <li><a href="/places" style={{color: '#fff', textDecoration: 'underline'}}>{t("Places")}</a></li>
              <li><a href="/articles" style={{color: '#fff', textDecoration: 'underline'}}>{t("Articles")}</a></li>
            </ul>
          </div>
          {/* Contact */}
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <h5 className="mb-3" style={{color:'#b6e0fe'}}>{t("Contact")}</h5>
            <p style={{fontSize: '1rem', color: '#e3f0ff', margin: 0}}>
              {t("Email:")} <a href={`mailto:${contactEmail}`} style={{color: '#fff', textDecoration: 'underline'}}>{contactEmail}</a><br/>
              {t("Phone:")} <a href={`tel:${contactPhone}`} style={{color: '#fff', textDecoration: 'underline'}}>{contactPhone}</a>
              {contactAddress && <><br/>{t("Address:")} <span style={{color: '#fff'}}>{contactAddress}</span></>}
            </p>
          </div>
          {/* Social */}
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <h5 className="mb-3" style={{color:'#b6e0fe'}}>{t("Follow Us")}</h5>
            <div style={{fontSize: '1.5rem'}}>
              {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{margin: '0 8px', color: '#fff'}}><i className="bi bi-facebook"></i></a>}
              {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{margin: '0 8px', color: '#fff'}}><i className="bi bi-instagram"></i></a>}
              {twitterUrl && <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{margin: '0 8px', color: '#fff'}}><i className="bi bi-twitter-x"></i></a>}
              {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{margin: '0 8px', color: '#fff'}}><i className="bi bi-youtube"></i></a>}
            </div>
            <div style={{fontSize: '0.95rem', color: '#b6e0fe', marginTop: 8}}>
              {t("Developed by")} <a href="https://github.com/yourteam" target="_blank" rel="noopener noreferrer" style={{color: '#fff', textDecoration: 'underline'}}>Walking Guide Team</a>
            </div>
          </div>
        </div>
        <hr style={{borderColor: '#b6e0fe', opacity: 0.3, margin: '1.5rem 0'}} />
        <div className="text-center" style={{fontSize: '1rem', color: '#e3f0ff'}}>
          {copyright}
        </div>
      </div>
    </footer>
  );
}

export default Footer;