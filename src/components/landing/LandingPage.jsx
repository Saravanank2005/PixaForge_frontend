import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from '../common/Particles';
import '../../styles/landing.css';

const features = [
  {
    icon: 'MAP',
    title: 'Location Smart Discovery',
    description: 'Find verified designers by city, distance, skills, rates, and availability in seconds.'
  },
  {
    icon: 'CHAT',
    title: 'Contextual Collaboration',
    description: 'Project-specific messaging keeps feedback, files, and decisions organized in one thread.'
  },
  {
    icon: 'BID',
    title: 'Direct Hire + Bidding',
    description: 'Choose the hiring mode per project. Invite directly or compare proposals from multiple designers.'
  },
  {
    icon: 'PAY',
    title: 'Secure Milestone Payments',
    description: 'Track budget progress and release payments safely with transparent project state changes.'
  },
  {
    icon: 'PORT',
    title: 'Rich Portfolio Signals',
    description: 'Evaluate designers using visuals, links, ratings, specialties, and real delivery history.'
  },
  {
    icon: 'LIVE',
    title: 'Live Platform Presence',
    description: 'Know who is active, where projects stand, and what needs action right now.'
  }
];

const flow = [
  'Post your project with budget, timeline, and goals.',
  'Discover designers on map or open the project for bids.',
  'Collaborate with real-time chat and structured deliverables.',
  'Approve outcomes and complete payment with confidence.'
];

const testimonials = [
  {
    quote:
      'We cut designer sourcing time from days to hours. The map + portfolio combo made selection incredibly fast.',
    author: 'Asha Menon',
    role: 'Brand Lead, Finch Retail'
  },
  {
    quote:
      'Clients arrive with clear briefs, and project messaging keeps everything focused. It is the cleanest workflow I have used.',
    author: 'Rohit Das',
    role: 'Freelance Product Designer'
  },
  {
    quote:
      'Bidding mode helped us compare style and pricing side-by-side before committing. Huge win for our startup.',
    author: 'Kavin Raj',
    role: 'Founder, Orbit Labs'
  }
];

const videoSamples = [
  {
    title: 'Brand Identity Reel',
    designer: 'Neha S',
    duration: '0:24',
    category: 'Brand Design',
    src: 'https://cdn.coverr.co/videos/coverr-man-working-on-his-computer-1579/1080p.mp4'
  },
  {
    title: 'Mobile App UI Walkthrough',
    designer: 'Arjun V',
    duration: '0:31',
    category: 'UI/UX',
    src: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-laptop-with-code-1574/1080p.mp4'
  },
  {
    title: 'Product Launch Assets',
    designer: 'Maya R',
    duration: '0:27',
    category: 'Marketing Creative',
    src: 'https://cdn.coverr.co/videos/coverr-a-woman-work-from-home-1578/1080p.mp4'
  }
];

const nearbyShowcase = [
  {
    name: 'Aarav Joshi',
    city: 'Bengaluru · 2.3 km',
    specialty: 'SaaS Product Design',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
    sample: 'Fintech dashboard redesign with conversion-focused onboarding flow.'
  },
  {
    name: 'Priya Menon',
    city: 'Chennai · 4.8 km',
    specialty: 'Brand + Packaging',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80',
    sample: 'Skincare rebrand combining packaging mockups and social launch kit.'
  },
  {
    name: 'Rohit B',
    city: 'Hyderabad · 6.1 km',
    specialty: 'Social Content Systems',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    sample: 'Campaign visuals and reusable templates for fast content ops.'
  }
];

const trustItems = ['Tech Startups', 'D2C Brands', 'Agencies', 'Indie Creators', 'Product Teams', 'Founders'];

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  const sectionRefs = {
    home: useRef(null),
    features: useRef(null),
    workflow: useRef(null),
    videos: useRef(null),
    nearby: useRef(null),
    testimonials: useRef(null),
    cta: useRef(null)
  };

  const sectionOrder = useMemo(() => Object.keys(sectionRefs), []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.4, rootMargin: '-20% 0px -30% 0px' }
    );

    sectionOrder.forEach((key) => {
      const el = sectionRefs[key].current;
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionOrder]);

  const scrollToSection = (key) => {
    const target = sectionRefs[key]?.current;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      localStorage.setItem('prefilledEmail', email.trim());
    }
    navigate('/register');
  };

  return (
    <div className="lpx-page">
      <div className="lpx-progress" style={{ width: `${scrollProgress}%` }} />

      <header className={`lpx-nav ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="lpx-nav-inner">
          <button className="lpx-brand" onClick={() => scrollToSection('home')} type="button">
            <span className="lpx-brand-dot" />
            <span className="lpx-brand-text">BidLance</span>
          </button>

          <nav className="lpx-links" aria-label="Landing sections">
            {sectionOrder.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => scrollToSection(key)}
                className={activeSection === key ? 'active' : ''}
              >
                {key === 'cta' ? 'Start' : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </nav>

          <div className="lpx-auth">
            <Link to="/login" className="lpx-login">
              Log in
            </Link>
            <Link to="/register" className="lpx-signup">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section id="home" ref={sectionRefs.home} className="lpx-hero">
        <div className="lpx-hero-particles" aria-hidden="true">
          <Particles count={70} color="#0ea5e9" size={2} speed={0.45} opacity={0.35} linkOpacity={0.18} linkDistance={120} />
        </div>
        <div className="lpx-hero-glow lpx-hero-glow-a" />
        <div className="lpx-hero-glow lpx-hero-glow-b" />

        <div className="lpx-container lpx-hero-grid">
          <motion.div
            className="lpx-hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="lpx-badge">Design Sourcing, Rebuilt</span>
            <h1>Build design projects with speed, clarity, and better talent matches.</h1>
            <p>
              BidLance connects clients and designers through location intelligence, structured collaboration,
              and project-first communication that actually scales.
            </p>

            <div className="lpx-hero-actions">
              <Link to="/register" className="lpx-primary-cta">
                Launch your first project
              </Link>
              <button type="button" className="lpx-secondary-cta" onClick={() => scrollToSection('workflow')}>
                See the workflow
              </button>
            </div>

            <div className="lpx-metrics">
              <div>
                <strong>20k+</strong>
                <span>Design deliveries</span>
              </div>
              <div>
                <strong>95%</strong>
                <span>On-time milestone close</span>
              </div>
              <div>
                <strong>4.8/5</strong>
                <span>Average project rating</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lpx-hero-panel"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="lpx-panel-head">
              <span>Live Project Board</span>
              <span className="pulse">active</span>
            </div>
            <div className="lpx-panel-card">
              <h3>Brand refresh for D2C skincare line</h3>
              <p>Shortlisted 4 designers · awaiting final concept round</p>
              <div className="lpx-chip-row">
                <span>Logo</span>
                <span>Packaging</span>
                <span>Social Kit</span>
              </div>
              <div className="lpx-bid-row">
                <div>
                  <small>Budget</small>
                  <strong>Rs 75,000</strong>
                </div>
                <div>
                  <small>Timeline</small>
                  <strong>12 days</strong>
                </div>
                <div>
                  <small>Status</small>
                  <strong>Review</strong>
                </div>
              </div>
            </div>
            <div className="lpx-panel-list">
              <article>
                <span>New bid</span>
                <p>UI specialist submitted a revised proposal.</p>
              </article>
              <article>
                <span>Milestone update</span>
                <p>Wireframes approved. Moving to hi-fi design.</p>
              </article>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="lpx-trust" aria-label="Teams using platform">
        <div className="lpx-container">
          <p className="lpx-trust-title">Used by growing teams across branding, product, and marketing</p>
          <div className="lpx-trust-row">
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" ref={sectionRefs.features} className="lpx-section">
        <div className="lpx-container">
          <div className="lpx-section-head">
            <h2>Advanced features designed for real project velocity</h2>
            <p>Purpose-built tooling for clients and designers, not generic freelance marketplace noise.</p>
          </div>

          <div className="lpx-feature-grid">
            {features.map((item, index) => (
              <motion.article
                key={item.title}
                className="lpx-feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <div className="lpx-feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" ref={sectionRefs.workflow} className="lpx-section lpx-section-alt">
        <div className="lpx-container">
          <div className="lpx-section-head">
            <h2>A project workflow that feels structured from day one</h2>
            <p>Every stage is explicit so both sides know what happens next and why.</p>
          </div>

          <div className="lpx-flow-wrap">
            {flow.map((step, index) => (
              <motion.div
                key={step}
                className="lpx-flow-step"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <span className="lpx-flow-index">0{index + 1}</span>
                <p>{step}</p>
              </motion.div>
            ))}
          </div>

          <div className="lpx-audience-grid">
            <article>
              <h3>For clients</h3>
              <ul>
                <li>Source faster using location + skills + proof of work.</li>
                <li>Choose direct hire or open bidding per project.</li>
                <li>Track budget, files, and approvals in one place.</li>
              </ul>
            </article>
            <article>
              <h3>For designers</h3>
              <ul>
                <li>Get qualified opportunities with clear briefs.</li>
                <li>Showcase your portfolio and pricing transparently.</li>
                <li>Close projects with less friction and clearer feedback.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="videos" ref={sectionRefs.videos} className="lpx-section">
        <div className="lpx-container">
          <div className="lpx-section-head">
            <h2>Video samplings from real design delivery styles</h2>
            <p>Preview how different creators think, present, and execute before you start a conversation.</p>
          </div>

          <div className="lpx-video-grid">
            {videoSamples.map((sample, index) => (
              <motion.article
                key={sample.title}
                className="lpx-video-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="lpx-video-shell">
                  <video autoPlay muted loop playsInline preload="metadata" src={sample.src} />
                  <span className="lpx-video-time">{sample.duration}</span>
                </div>
                <div className="lpx-video-meta">
                  <div>
                    <h3>{sample.title}</h3>
                    <p>{sample.designer}</p>
                  </div>
                  <span>{sample.category}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="nearby" ref={sectionRefs.nearby} className="lpx-section lpx-section-alt lpx-nearby-section">
        <div className="lpx-container">
          <div className="lpx-section-head">
            <h2>Nearby designer portfolios, surfaced faster</h2>
            <p>A Fiverr-like discovery lane built around location plus quality signals, not random browsing.</p>
          </div>

          <div className="lpx-nearby-grid">
            {nearbyShowcase.map((item, index) => (
              <motion.article
                key={item.name}
                className="lpx-nearby-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <div className="lpx-nearby-media" style={{ backgroundImage: `url(${item.image})` }}>
                  <span>{item.city}</span>
                </div>
                <div className="lpx-nearby-body">
                  <h3>{item.name}</h3>
                  <strong>{item.specialty}</strong>
                  <p>{item.sample}</p>
                  <Link to="/register" className="lpx-nearby-link">Explore similar portfolios</Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" ref={sectionRefs.testimonials} className="lpx-section">
        <div className="lpx-container">
          <div className="lpx-section-head">
            <h2>Trusted by teams and independent creators</h2>
            <p>People choose BidLance for quality matching and a cleaner collaboration model.</p>
          </div>

          <div className="lpx-testimonial-grid">
            {testimonials.map((item, index) => (
              <motion.blockquote
                key={item.author}
                className="lpx-quote"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <p>"{item.quote}"</p>
                <footer>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" ref={sectionRefs.cta} className="lpx-cta">
        <div className="lpx-container">
          <motion.div
            className="lpx-cta-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2>Start your first project in minutes</h2>
            <p>Join now and turn ideas into shipped design outcomes with less uncertainty.</p>

            <form className="lpx-cta-form" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                required
              />
              <button type="submit">Get Started</button>
            </form>

            <div className="lpx-cta-links">
              <Link to="/register">Create account</Link>
              <Link to="/login">I already have an account</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="lpx-footer">
        <div className="lpx-container lpx-footer-inner">
          <div>
            <h3>BidLance</h3>
            <p>Design collaboration platform for modern client-designer workflows.</p>
          </div>
          <div className="lpx-footer-nav">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection('workflow'); }}>Workflow</a>
            <a href="#cta" onClick={(e) => { e.preventDefault(); scrollToSection('cta'); }}>Start</a>
          </div>
          <div className="lpx-copy">© {new Date().getFullYear()} BidLance. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
