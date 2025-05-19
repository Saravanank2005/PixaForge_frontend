import { useState, useEffect } from 'react';

const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = document.documentElement.scrollTop;
      
      if (totalScroll) {
        setScrollProgress((currentScroll / totalScroll) * 100);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div 
      className="scroll-progress" 
      style={{ width: `${scrollProgress}%` }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgress;
