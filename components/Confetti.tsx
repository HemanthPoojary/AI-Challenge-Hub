'use client';

import { useEffect, useRef } from 'react';

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti: any[] = [];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotationVel: (Math.random() - 0.5) * 0.1,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa500', '#ff006e'][Math.floor(Math.random() * 5)],
        size: Math.random() * 4 + 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.rotation += particle.rotationVel;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      // Remove particles that are off-screen
      for (let i = confetti.length - 1; i >= 0; i--) {
        if (confetti[i].y > canvas.height) {
          confetti.splice(i, 1);
        }
      }

      if (confetti.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
