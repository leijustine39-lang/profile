
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const audio = $('#audio');
  const enterBtn = $('#enterBtn');
  const intro = $('#intro');
  const playBtn = $('#playBtn');
  const status = $('#trackStatus');
  const progress = $('#progressBar');
  const repeatBtn = $('#repeatBtn');
  const volume = $('#volume');

  // One song only. The browser allows playback because play() is called
  // directly inside the user's ENTER button click.
  audio.src = 'music/ex-nihilo.m4a';
  audio.volume = Number(volume?.value || 0.7);

  function updatePlayButton(playing) {
    playBtn.textContent = playing ? 'Ⅱ' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  function startMusicFromEnter() {
    const attempt = audio.play(); // Must remain directly in the click gesture.
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => {
        updatePlayButton(true);
        status.textContent = 'Now playing · Ex Nihilo';
      }).catch(() => {
        updatePlayButton(false);
        status.textContent = 'Tap play to start the music';
      });
    }
  }

  function enterWebsite() {
    if (!intro || intro.classList.contains('hidden')) return;
    // Trigger audio before changing the page, while the click is still trusted.
    startMusicFromEnter();
    intro.classList.add('hidden');
    document.body.classList.add('entered');
    document.querySelectorAll('.section').forEach((section, index) => {
      if (index === 0) section.classList.add('revealed');
    });
  }

  enterBtn?.addEventListener('click', enterWebsite);
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.code === 'NumpadEnter') &&
        intro && !intro.classList.contains('hidden')) {
      event.preventDefault();
      enterWebsite();
    }
  });

  playBtn?.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayButton(true);
        status.textContent = 'Now playing · Ex Nihilo';
      }).catch(() => {
        status.textContent = 'Could not play the audio file. Check the music folder.';
      });
    } else {
      audio.pause();
      updatePlayButton(false);
      status.textContent = 'Paused';
    }
  });

  volume?.addEventListener('input', () => { audio.volume = Number(volume.value); });
  repeatBtn?.addEventListener('click', () => {
    audio.loop = !audio.loop;
    repeatBtn.classList.toggle('active', audio.loop);
    status.textContent = audio.loop ? 'Repeat on' : 'Repeat off';
  });
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) progress.style.width = `${audio.currentTime / audio.duration * 100}%`;
  });
  audio.addEventListener('ended', () => {
    updatePlayButton(false);
    status.textContent = 'Track finished';
  });
  audio.addEventListener('error', () => {
    status.textContent = 'Audio file missing — keep music/ex-nihilo.m4a in the repository';
  });

  // Animated network background.
  const canvas = $('#network');
  const ctx = canvas?.getContext('2d');
  let points = [];
  let width = 0, height = 0, dpr = 1;
  const pointer = { x: -1000, y: -1000 };

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(100, Math.max(38, Math.floor(width * height / 14500)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .34, vy: (Math.random() - .5) * .34,
      r: Math.random() * 1.8 + .5, phase: Math.random() * Math.PI * 2
    }));
  }

  let frame = 0;
  function animateNetwork() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    points.forEach((p, i) => {
      if (!reduced) {
        p.x += p.vx; p.y += p.vy; p.phase += .012;
        if (p.x < -5 || p.x > width + 5) p.vx *= -1;
        if (p.y < -5 || p.y > height + 5) p.vy *= -1;
      }
      const pulse = .65 + Math.sin(p.phase) * .25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(91,184,255,${.38 + pulse * .28})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(40,150,255,.8)';
      ctx.fill();
      ctx.shadowBlur = 0;

      for (let j = i + 1; j < points.length; j++) {
        const q = points[j], dx = p.x - q.x, dy = p.y - q.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 135) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(75,157,225,${(1 - distance / 135) * .2})`;
          ctx.lineWidth = .7; ctx.stroke();
        }
      }
      const md = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      if (md < 150) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pointer.x, pointer.y);
        ctx.strokeStyle = `rgba(70,185,255,${(1 - md / 150) * .35})`;
        ctx.stroke();
      }
    });
    frame = requestAnimationFrame(animateNetwork);
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  resizeCanvas();
  if (ctx) animateNetwork();

  // Scroll reveal and active navigation states.
  const sections = document.querySelectorAll('main .section');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    sections.forEach(section => revealObserver.observe(section));
  } else {
    sections.forEach(section => section.classList.add('revealed'));
  }

  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => navObserver.observe(section));
  }

  // Mobile navigation.
  const menuButton = $('#menuBtn');
  const nav = $('#nav');
  menuButton?.addEventListener('click', () => nav?.classList.toggle('open'));
  navLinks.forEach(link => link.addEventListener('click', () => nav?.classList.remove('open')));

  // Footer year.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
