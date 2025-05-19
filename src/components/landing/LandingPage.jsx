import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from '../common/Particles';
import '../../styles/animations.css';
import '../../styles/landing.css';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  const featureCardsRef = useRef([]);
  const navigate = useNavigate();

  // Handle mouse movement for 3D card effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Apply 3D effect to feature cards based on mouse position
      featureCardsRef.current.forEach(card => {
        if (!card) return;
        
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from mouse to card center
        const distanceX = e.clientX - cardCenterX;
        const distanceY = e.clientY - cardCenterY;
        
        // Check if mouse is close to the card (within 300px)
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < 300) {
          // Calculate rotation based on mouse position relative to card center
          const rotateY = distanceX * 0.05; // Max rotation ±15 degrees
          const rotateX = -distanceY * 0.05;
          
          // Apply the 3D transform
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px) scale(1.05)`;
          
          // Add glow effect based on mouse position
          const icon = card.querySelector('.icon-container-modern');
          if (icon) {
            const glowX = (distanceX / rect.width) * 100;
            const glowY = (distanceY / rect.height) * 100;
            icon.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.3), ${distanceX * 0.05}px ${distanceY * 0.05}px 20px rgba(77, 171, 247, 0.4)`;
            icon.style.transform = `translateZ(40px) translateX(${distanceX * 0.02}px) translateY(${distanceY * 0.02}px)`;
          }
        } else {
          // Reset transform when mouse is far away
          card.style.transform = '';
          
          const icon = card.querySelector('.icon-container-modern');
          if (icon) {
            icon.style.boxShadow = '';
            icon.style.transform = '';
          }
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      // Navbar scroll effect
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Calculate scroll progress
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      
      // Reveal elements on scroll
      const revealElements = document.querySelectorAll('.reveal-on-scroll');
      revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('active');
        }
      });
      
      // Stagger elements animation
      const staggerItems = document.querySelectorAll('.stagger-item');
      staggerItems.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('active');
        }
      });
      
      // Parallax effect
      const parallaxElements = document.querySelectorAll('.parallax');
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.2;
        const yPos = -(window.scrollY * speed);
        element.style.setProperty('--parallax-y', `${yPos}px`);
      });
      
      // Active section detection
      const sections = [
        { ref: heroRef, id: 'hero' },
        { ref: featuresRef, id: 'features' },
        { ref: howItWorksRef, id: 'how-it-works' },
        { ref: testimonialsRef, id: 'testimonials' },
        { ref: ctaRef, id: 'cta' }
      ];
      
      for (const section of sections) {
        if (!section.ref.current) continue;
        
        const rect = section.ref.current.getBoundingClientRect();
        const sectionHeight = rect.height;
        const sectionTop = rect.top;
        
        // If the section is in view (with some buffer)
        if (sectionTop < window.innerHeight / 3 && sectionTop > -sectionHeight + 100) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Store email in localStorage for pre-filling the registration form
    if (email) {
      localStorage.setItem('prefilledEmail', email);
    }
    navigate('/register');
  };

  const scrollToSection = (sectionRef) => {
    sectionRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: "📍",
      title: 'Interactive Map',
      description: 'Find designers near you with our interactive map interface powered by Leaflet.js'
    },
    {
      icon: "🎨",
      title: 'Skilled Designers',
      description: 'Connect with talented graphic designers specializing in various design fields'
    },
    {
      icon: "💬",
      title: 'Real-time Chat',
      description: 'Communicate directly with designers through our real-time messaging system'
    },
    {
      icon: "📅",
      title: 'Project Booking',
      description: 'Easily create and manage design projects with our intuitive booking system'
    },
    {
      icon: "💳",
      title: 'Secure Payments',
      description: 'Process payments securely using our integrated Stripe payment system'
    },
    {
      icon: "⭐",
      title: 'Reviews & Ratings',
      description: 'Make informed decisions based on genuine reviews and ratings from other clients'
    },
    {
      icon: "👥",
      title: 'Designer Portfolios',
      description: 'Browse through designer portfolios to find the perfect match for your project'
    },
    {
      icon: "🔒",
      title: 'Secure Platform',
      description: 'Your data is protected with our secure authentication and encryption systems'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Sign Up',
      description: 'Create your account as a client or designer in just a few simple steps'
    },
    {
      step: 2,
      title: 'Create a Project',
      description: 'Describe your design needs, set a budget, and post your project'
    },
    {
      step: 3,
      title: 'Connect with Designers',
      description: 'Browse designers or wait for them to contact you about your project'
    },
    {
      step: 4,
      title: 'Collaborate & Pay',
      description: 'Work together through our platform and process secure payments'
    },
    {
      step: 5,
      title: 'Receive & Review',
      description: 'Get your completed designs and leave feedback for your designer'
    }
  ];

  const testimonials = [
    {
      content: "PixaForge transformed how I find design talent. The map feature made it easy to find local designers, and the portfolio system helped me choose the perfect match for my brand redesign.",
      author: "Sarah Johnson",
      role: "Marketing Director",
      avatar: "SJ"
    },
    {
      content: "As a freelance designer, this platform has connected me with clients I would never have found otherwise. The project management tools make collaboration seamless.",
      author: "Michael Chen",
      role: "UI/UX Designer",
      avatar: "MC"
    },
    {
      content: "The real-time messaging and file sharing features made my project run smoothly from start to finish. I've now used PixaForge for three different projects!",
      author: "Alex Rodriguez",
      role: "Startup Founder",
      avatar: "AR"
    }
  ];

  // Animation variants for Framer Motion
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>
      
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-3 bg-[#0a0e17] shadow-md' : 'py-5 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              <span className="text-white">Pixa</span>
              <span className="text-[#4dabf7]">Forge</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection(heroRef)} 
              className={`text-sm font-medium transition-colors ${
                activeSection === 'hero' 
                  ? 'text-[#4dabf7]' 
                  : 'text-gray-300 hover:text-[#4dabf7]'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection(featuresRef)} 
              className={`text-sm font-medium transition-colors ${
                activeSection === 'features' 
                  ? 'text-[#4dabf7]' 
                  : 'text-gray-300 hover:text-[#4dabf7]'
              }`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection(howItWorksRef)} 
              className={`text-sm font-medium transition-colors ${
                activeSection === 'how-it-works' 
                  ? 'text-[#4dabf7]' 
                  : 'text-gray-300 hover:text-[#4dabf7]'
              }`}
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection(testimonialsRef)} 
              className={`text-sm font-medium transition-colors ${
                activeSection === 'testimonials' 
                  ? 'text-[#4dabf7]' 
                  : 'text-gray-300 hover:text-[#4dabf7]'
              }`}
            >
              Testimonials
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/login" 
              className="px-4 py-2 text-sm font-medium text-[#4dabf7] hover:text-[#9775fa] transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              className="cyber-button text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-pattern"></div>
        <div className="cyber-grid"></div>
        <div className="hero-floating-element"></div>
        <div className="hero-floating-element"></div>
        <div className="hero-floating-element"></div>
        <div className="particles-container">
          <Particles 
            count={100}
            color="#4dabf7"
            size={3}
            speed={0.5}
            opacity={0.4}
            linkOpacity={0.2}
            linkDistance={150}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center">
            <motion.div 
              className="hero-content lg:w-1/2"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="hero-title">
                Connect with Talented Designers Near You
              </h1>
              <p className="hero-subtitle">
                PixaForge brings clients and designers together on a location-based platform. Find the perfect designer for your project, collaborate seamlessly, and bring your vision to life.
              </p>
              
              <div className="hero-cta">
                <Link 
                  to="/register" 
                  className="cyber-button"
                >
                  Get Started
                </Link>
                <button 
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="px-8 py-3 text-white bg-opacity-20 bg-white hover:bg-opacity-30 rounded-lg transition-all font-medium ml-4"
                >
                  Learn More
                </button>
              </div>
              
             
            </motion.div>
            
            <motion.div 
              className="hero-image-container lg:w-1/2 mt-12 lg:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="hero-image-wrapper-modern">
                <div className="hero-image-shadow"></div>
                <img 
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Designers collaborating" 
                  className="hero-image-modern"
                />
              </div>
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          className="scroll-down-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          onClick={() => scrollToSection(featuresRef)}
        >
          <span>Scroll Down</span>
          <div className="scroll-down-arrow"></div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section">
        <div className="cyber-grid"></div>
        <div className="particles-container">
          <Particles 
            count={70}
            color="#9775fa"
            size={2}
            speed={0.3}
            opacity={0.3}
            linkOpacity={0.1}
            linkDistance={120}
          />
        </div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-white mb-4 section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Powerful Features for Designers and Clients
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Everything you need to connect, collaborate, and create amazing designs
            </motion.p>
          </div>
          
          <motion.div 
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card-modern"
                variants={fadeIn}
                custom={index}
                transition={{ delay: index * 0.1 }}
                data-feature-index={index}
                ref={el => featureCardsRef.current[index] = el}
                whileHover={{ scale: 1.02 }}
              >
                <div className="card-bg-gradient"></div>
                <div className="card-slide-bg"></div>
                <div className="card-content">
                  {index === 0 && <div className="ribbon-modern">Popular</div>}
                  {index === 2 && <div className="ribbon-modern">New</div>}
                  <div className="icon-container-modern">
                    <span>{feature.icon}</span>
                    <div className="icon-glow"></div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                  <div className="feature-card-overlay"></div>
                  <div className="card-shine"></div>
                </div>
              </motion.div>
            ))}
            
            {/* Flip Card Example */}
            <motion.div 
              className="feature-card-special"
              variants={fadeIn}
              custom={features.length}
              transition={{ delay: features.length * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            >
              <div className="special-card-bg"></div>
              <div className="special-card-content">
                <div className="special-icon-container">
                  <span>✨</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Premium Support</h3>
                <p className="text-gray-300 mb-4">Get dedicated support from our team of experts to help you succeed.</p>
                <Link to="/support" className="special-card-button">Learn More</Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="how-it-works-section">
        <div className="cyber-grid"></div>
        <div className="particles-container">
          <Particles 
            count={50}
            color="#f783ac"
            size={2}
            speed={0.2}
            opacity={0.25}
            linkOpacity={0.1}
            linkDistance={100}
          />
        </div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold text-white mb-4 section-heading glow-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              How PixaForge Works
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              A simple process to connect with designers and bring your projects to life
            </motion.p>
          </div>
          
          <motion.div 
            className="process-timeline"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="timeline-line"></div>
            
            <div className="process-cards-container">
              {howItWorks.map((step, index) => (
                <motion.div 
                  key={index}
                  className="process-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ 
                    y: -10, 
                    boxShadow: '0 15px 30px rgba(77, 171, 247, 0.2), 0 0 10px rgba(77, 171, 247, 0.1)', 
                    transition: { duration: 0.3 } 
                  }}
                >
                  <div className="process-card-content">
                    <div className="process-step-number">{step.step}</div>
                    <h3 className="process-step-title">{step.title}</h3>
                    <p className="process-step-description">{step.description}</p>
                    
                    {index === howItWorks.length - 1 ? (
                      <Link to="/register" className="process-action-button">
                        Get Started
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    ) : (
                      <motion.div 
                        className="process-step-indicator"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="process-card-glow"></div>
                  <div className="process-card-border"></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link 
              to="/register" 
              className="cyber-button-large"
            >
              Start Your Design Journey
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="testimonials-section">
        <div className="cyber-grid"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-white mb-4 section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              What Our Users Say
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Hear from designers and clients who have found success on our platform
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="testimonial-card-modern"
                variants={fadeIn}
                custom={index}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star-icon">★</span>
                  ))}
                </div>
                <div className="testimonial-content-modern">
                  {testimonial.content}
                </div>
                <div className="testimonial-author-modern">
                  <div className="testimonial-avatar-modern">
                    {testimonial.avatar}
                  </div>
                  <div className="testimonial-info-modern">
                    <div className="testimonial-name-modern">{testimonial.author}</div>
                    <div className="testimonial-role-modern">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="cta-section">
        <div className="cta-pattern"></div>
        <div className="cyber-grid"></div>
        <div className="cta-glow-orb"></div>
        <div className="particles-container">
          <Particles 
            count={100}
            color="#4dabf7"
            size={3}
            speed={0.5}
            opacity={0.4}
            linkOpacity={0.2}
            linkDistance={150}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="cta-content">
            <motion.div
              className="cta-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="cta-badge-pulse"></span>
              <span>Join our community</span>
            </motion.div>
            
            <motion.h2 
              className="cta-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Ready to Connect with <span className="text-gradient">Amazing Designers</span>?
            </motion.h2>
            
            <motion.p 
              className="cta-description"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Join thousands of clients and designers already using our platform to create stunning designs
            </motion.p>
            
            <motion.form 
              className="cta-form"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSubmit}
            >
              <div className="cta-input-container">
                <span className="cta-input-icon">✉️</span>
                <input
                  type="email"
                  className="cta-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="cta-button">
                <span className="cta-button-text">Get Started</span>
                <span className="cta-button-icon">→</span>
              </button>
            </motion.form>
            
            <motion.div 
              className="mt-8 flex justify-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link to="/register" className="cyber-button mx-2">
                Sign Up Now
              </Link>
              <button onClick={() => scrollToSection(featuresRef)} className="cyber-button mx-2">
                Explore Features
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                    <path d="M2 17L12 22L22 17" fill="currentColor" />
                    <path d="M2 12L12 17L22 12" fill="currentColor" />
                  </svg>
                </div>
                <div className="footer-logo-text">PixaForge</div>
              </div>
              <p className="footer-description">
                Connecting talented designers with clients to create amazing designs together.
              </p>
              <div className="footer-social">
                <a href="#" className="footer-social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
                </a>
                <a href="#" className="footer-social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.286 3.286 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.286 3.286 0 0 0-.923-1.416A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
                </a>
                <a href="#" className="footer-social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="footer-heading">Company</h3>
              <ul className="footer-links">
                <li className="footer-link"><a href="#">About Us</a></li>
                <li className="footer-link"><a href="#">Careers</a></li>
                <li className="footer-link"><a href="#">Blog</a></li>
                <li className="footer-link"><a href="#">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="footer-heading">Resources</h3>
              <ul className="footer-links">
                <li className="footer-link"><a href="#">Support</a></li>
                <li className="footer-link"><a href="#">Documentation</a></li>
                <li className="footer-link"><a href="#">Pricing</a></li>
                <li className="footer-link"><a href="#">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="footer-heading">Legal</h3>
              <ul className="footer-links">
                <li className="footer-link"><a href="#">Terms of Service</a></li>
                <li className="footer-link"><a href="#">Privacy Policy</a></li>
                <li className="footer-link"><a href="#">Cookie Policy</a></li>
                <li className="footer-link"><a href="#">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} PixaForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;