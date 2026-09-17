import './style.css';
import './auth-theme.css';
import './playground.css';
import './letter-theme.css';
import './intro-reference.css';
import './deep-wine-theme.css';
import './auth-polish.css';
import { supabase, supabaseReady, saveProfile, compressedImageDataUrl } from './supabase.js';

const introBurst = document.querySelector('#intro-burst');
const introSkip = introBurst?.querySelector('.intro-skip');
const introWordmark = introBurst?.querySelector('.glitch-intro-wordmark');
const introParticleField = introBurst?.querySelector('.intro-particle-field');
const introParticleCanvas = introParticleField?.querySelector('.intro-particle-canvas');
if (introParticleCanvas) {
  const particleContext = introParticleCanvas.getContext('2d');
  let particleWidth = 0;
  let particleHeight = 0;
  let particles = [];
  const particleStart = performance.now();

  const buildParticleField = () => {
    const nextParticles = [];
    const count = particleWidth < 700 ? 520 : 1200;
    for (let index = 0; index < count; index += 1) {
      const fromLeft = index % 2 === 0;
      const wave = index % 5;
      const centerX = particleWidth * (.29 + Math.random() * .42);
      const centerY = particleHeight * (.39 + Math.random() * .22);
      nextParticles.push({
        x: centerX,
        y: centerY,
        fromX: fromLeft ? -particleWidth * (.08 + Math.random() * .52) : particleWidth * (1.08 + Math.random() * .52),
        fromY: centerY + (Math.random() - .5) * particleHeight * .52,
        size: 1 + Math.random() * 2.3,
        alpha: .34 + Math.random() * .66,
        color: index % 19 === 0 ? '#9b321b' : index % 7 === 0 ? '#f3c2cc' : '#fffaf7',
        delay: wave * .08 + Math.random() * .22,
        duration: 1.05 + wave * .12 + Math.random() * .3,
        drift: (Math.random() - .5) * 14,
        direction: fromLeft ? 1 : -1,
      });
    }
    particles = nextParticles;
  };

  const resizeParticleCanvas = () => {
    const rect = introParticleField.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    particleWidth = Math.max(1, rect.width);
    particleHeight = Math.max(1, rect.height);
    introParticleCanvas.width = Math.floor(particleWidth * ratio);
    introParticleCanvas.height = Math.floor(particleHeight * ratio);
    introParticleCanvas.style.width = `${particleWidth}px`;
    introParticleCanvas.style.height = `${particleHeight}px`;
    particleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildParticleField();
  };

  const drawParticleIntro = (now) => {
    if (!document.body.contains(introParticleCanvas)) return;
    const elapsed = (now - particleStart) / 1000;
    particleContext.clearRect(0, 0, particleWidth, particleHeight);
    particleContext.lineCap = 'round';
    particles.forEach((particle) => {
      const gather = Math.min(1, Math.max(0, (elapsed - particle.delay) / particle.duration));
      const eased = gather * gather * (3 - 2 * gather);
      let x = particle.fromX + (particle.x - particle.fromX) * eased;
      let y = particle.fromY + (particle.y - particle.fromY) * eased;
      let opacity = particle.alpha * Math.min(1, gather * 4);
      if (elapsed > 3.35) {
        const burst = Math.min(1, (elapsed - 3.35) / 1.05);
        x = particle.x + (particle.x - particleWidth / 2) * burst * .52;
        y = particle.y + (particle.y - particleHeight / 2) * burst * .52 + particle.drift * burst;
        opacity *= 1 - burst;
      }
      const trailStrength = Math.min(1, gather * 2.2) * (1 - Math.min(1, Math.max(0, (gather - .78) * 4)));
      if (trailStrength > 0 && opacity > 0) {
        particleContext.save();
        particleContext.globalAlpha = opacity * .28 * trailStrength;
        particleContext.strokeStyle = particle.color;
        particleContext.lineWidth = Math.max(.6, particle.size * .56);
        particleContext.shadowColor = particle.color;
        particleContext.shadowBlur = 7;
        particleContext.beginPath();
        particleContext.moveTo(x - particle.direction * (16 + particle.size * 8) * trailStrength, y);
        particleContext.lineTo(x, y);
        particleContext.stroke();
        particleContext.restore();
      }
      particleContext.save();
      particleContext.globalAlpha = opacity;
      particleContext.fillStyle = particle.color;
      particleContext.shadowColor = particle.color;
      particleContext.shadowBlur = 7;
      particleContext.fillRect(x, y, particle.size, Math.max(1, particle.size * .58));
      particleContext.restore();
    });
    if (elapsed < 4.45) window.requestAnimationFrame(drawParticleIntro);
  };

  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas, { passive: true });
  window.requestAnimationFrame(drawParticleIntro);
}
let skipIntroOnce = false;
try {
  skipIntroOnce = window.sessionStorage.getItem('brivia-skip-intro-once') === 'true';
  if (skipIntroOnce) window.sessionStorage.removeItem('brivia-skip-intro-once');
} catch {}
if (introBurst && skipIntroOnce) {
  introBurst.remove();
}
if (introBurst && !skipIntroOnce) {
  document.body.classList.add('intro-active');
  window.setTimeout(() => introWordmark?.classList.add('is-revealed'), 1320);
  const finishIntro = () => {
    document.body.classList.remove('intro-active');
    introBurst.classList.add('is-skipped');
    window.setTimeout(() => introBurst.remove(), 500);
  };
  introSkip?.addEventListener('click', finishIntro);
  window.setTimeout(finishIntro, 4200);
}

const cursor = document.querySelector('.cursor');
window.addEventListener('pointermove', (event) => {
  if (!cursor) return;
  cursor.classList.add('active');
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

const overlay = document.querySelector('.menu-overlay');
document.querySelector('.menu-trigger')?.addEventListener('click', () => overlay.classList.add('open'));
document.querySelector('.menu-close')?.addEventListener('click', () => overlay.classList.remove('open'));
overlay?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => overlay.classList.remove('open')));

document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('mouseenter', () => cursor?.classList.add('active'));
  card.addEventListener('mouseleave', () => cursor?.classList.remove('active'));
});

const orbitSection = document.querySelector('.orbit-section');
if (orbitSection && 'IntersectionObserver' in window) {
  const orbitObserver = new IntersectionObserver(([entry]) => {
    orbitSection.classList.toggle('is-visible', entry.isIntersecting);
  }, { threshold: 0.28 });
  orbitObserver.observe(orbitSection);
}

const letterSection = document.querySelector('.letter-section');
if (letterSection && 'IntersectionObserver' in window) {
  const letterObserver = new IntersectionObserver(([entry]) => {
    letterSection.classList.toggle('is-visible', entry.isIntersecting);
  }, { threshold: 0.2 });
  letterObserver.observe(letterSection);
}

const principleItems = document.querySelectorAll('.principle');
const principleImages = document.querySelectorAll('.principle-image');
const principleNodes = document.querySelectorAll('[data-principle-node]');
const principlePhotos = document.querySelectorAll('[data-principle-photo]');
const principlesConstellation = document.querySelector('[data-principles-constellation]');
const photoFlightDeck = document.querySelector('[data-photo-flight-deck]');
const principlesVisual = document.querySelector('.principles-visual');
const principlesSection = document.querySelector('.principles-section');
const matchingHeroWord = document.querySelector('.matching-hero-word');
let matchingPointerFrame;
let matchingPointerEvent;
let swipeResetTimer;
const triggerMatchingSwipe = (direction) => {
  if (!photoFlightDeck && !matchingHeroWord) return;
  const swipeX = direction === 'left' ? 1 : -1;
  [photoFlightDeck, matchingHeroWord].forEach((element) => {
    if (!element) return;
    element.style.setProperty('--swipe-x', swipeX);
    element.classList.remove('is-swiping');
    void element.offsetWidth;
    element.classList.add('is-swiping');
  });
  window.clearTimeout(swipeResetTimer);
  swipeResetTimer = window.setTimeout(() => {
    photoFlightDeck?.classList.remove('is-swiping');
    matchingHeroWord?.classList.remove('is-swiping');
  }, 1120);
};
principlesSection?.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaX) < 12 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  triggerMatchingSwipe(event.deltaX > 0 ? 'left' : 'right');
}, { passive: true });
let matchingTouchStartX;
principlesSection?.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') matchingTouchStartX = event.clientX;
});
principlesSection?.addEventListener('pointerup', (event) => {
  if (event.pointerType !== 'touch' || matchingTouchStartX === undefined) return;
  const distance = event.clientX - matchingTouchStartX;
  if (Math.abs(distance) > 42) triggerMatchingSwipe(distance < 0 ? 'left' : 'right');
  matchingTouchStartX = undefined;
});
principlesSection?.addEventListener('pointercancel', () => { matchingTouchStartX = undefined; });
let matchingSceneFrame;
const updateMatchingScene = () => {
  if (!principlesSection || !principlesSection.classList.contains('is-visible')) return;
  const bounds = principlesSection.getBoundingClientRect();
  const travel = Math.max(bounds.height - window.innerHeight, 1);
  const progress = Math.max(0, Math.min(1, -bounds.top / travel));
  const drift = (progress - .5) * 90;
  const wordDrift = (progress - .5) * -54;
  principlesConstellation?.style.setProperty('--scroll-drift', `${drift * .36}px`);
  photoFlightDeck?.style.setProperty('--scroll-drift', `${drift}px`);
  matchingHeroWord?.style.setProperty('--word-drift', `${wordDrift}px`);
};
const requestMatchingSceneUpdate = () => {
  if (matchingSceneFrame) return;
  matchingSceneFrame = window.requestAnimationFrame(() => {
    matchingSceneFrame = undefined;
    updateMatchingScene();
  });
};
window.addEventListener('scroll', requestMatchingSceneUpdate, { passive: true });
window.addEventListener('resize', requestMatchingSceneUpdate);
requestMatchingSceneUpdate();
if (principlesSection && 'IntersectionObserver' in window) {
  const principlesRevealObserver = new IntersectionObserver(([entry]) => {
    principlesSection.classList.toggle('is-visible', entry.isIntersecting);
  }, { threshold: 0.12 });
  principlesRevealObserver.observe(principlesSection);
}
principlesVisual?.addEventListener('pointermove', (event) => {
  matchingPointerEvent = event;
  if (matchingPointerFrame) return;
  matchingPointerFrame = window.requestAnimationFrame(() => {
    matchingPointerFrame = undefined;
    if (!matchingPointerEvent) return;
    const bounds = principlesVisual.getBoundingClientRect();
    const x = ((matchingPointerEvent.clientX - bounds.left) / bounds.width - .5) * 18;
    const y = ((matchingPointerEvent.clientY - bounds.top) / bounds.height - .5) * 18;
    principlesConstellation?.style.setProperty('--pointer-x', `${x}px`);
    principlesConstellation?.style.setProperty('--pointer-y', `${y}px`);
    photoFlightDeck?.style.setProperty('--pointer-x', `${x}px`);
    photoFlightDeck?.style.setProperty('--pointer-y', `${y}px`);
  });
});
principlesVisual?.addEventListener('pointerleave', () => {
  principlesConstellation?.style.setProperty('--pointer-x', '0px');
  principlesConstellation?.style.setProperty('--pointer-y', '0px');
  photoFlightDeck?.style.setProperty('--pointer-x', '0px');
  photoFlightDeck?.style.setProperty('--pointer-y', '0px');
});
if (principleItems.length && principleImages.length && 'IntersectionObserver' in window) {
  const principleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const key = entry.target.dataset.principle;
      principleItems.forEach((item) => item.classList.toggle('is-active', item === entry.target));
      principleImages.forEach((image) => image.classList.toggle('is-active', image.dataset.principleImage === key));
      principleNodes.forEach((node) => node.classList.toggle('is-active', node.dataset.principleNode === key));
      principlePhotos.forEach((photo) => photo.classList.toggle('is-active', photo.dataset.principlePhoto === key));
      if (principlesConstellation) {
        principlesConstellation.classList.remove('is-pulsing');
        void principlesConstellation.offsetWidth;
        principlesConstellation.classList.add('is-pulsing');
      }
    });
  }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });

  principleItems.forEach((item) => principleObserver.observe(item));
}

const pillarItems = document.querySelectorAll('.pillar');
const pillarWords = document.querySelectorAll('.pillar-word');
const pillarImages = document.querySelectorAll('.pillar-image');
const pillarCurrent = document.querySelector('.pillar-current');
if (pillarItems.length && 'IntersectionObserver' in window) {
  const pillarObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const key = entry.target.dataset.pillar;
      const number = entry.target.querySelector(':scope > span')?.textContent || '01';
      pillarItems.forEach((item) => item.classList.toggle('is-active', item === entry.target));
      pillarWords.forEach((word) => word.classList.toggle('is-active', word.dataset.pillarWord === key));
      pillarImages.forEach((image) => image.classList.toggle('is-active', image.dataset.pillarImage === key));
      if (pillarCurrent) pillarCurrent.textContent = number;
    });
  }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });

  pillarItems.forEach((item) => pillarObserver.observe(item));
}

const playgroundStage = document.querySelector('[data-playground-stage]');
const playgroundVideo = document.querySelector('[data-playground-video]');
const playgroundAudioToggle = document.querySelector('[data-playground-audio-toggle]');
const playgroundShuttle = null;
let playgroundAudioContext;
let playgroundSoundEnabled = false;
let playgroundStarted = false;

const getPlaygroundAudio = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  playgroundAudioContext ||= new AudioContextClass();
  if (playgroundAudioContext.state === 'suspended') playgroundAudioContext.resume().catch(() => {});
  return playgroundAudioContext;
};

const playBadmintonHit = () => {
  if (!playgroundSoundEnabled) return;
  const audio = getPlaygroundAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(730, now);
  oscillator.frequency.exponentialRampToValueAtTime(160, now + .12);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.22, now + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .15);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now); oscillator.stop(now + .16);
};

const playGuitarStrum = () => {
  if (!playgroundSoundEnabled) return;
  const audio = getPlaygroundAudio();
  if (!audio) return;
  const now = audio.currentTime;
  [196, 247, 294, 392, 494].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    const start = now + index * .035;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.08, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + 1.45);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + 1.5);
  });
};

const startPlaygroundRally = () => {
  if (!playgroundStage || !playgroundShuttle || playgroundStarted) return;
  playgroundStarted = true;
  const runCycle = () => {
    playgroundStage.classList.remove('is-guitar');
    playgroundShuttle.style.animation = 'none';
    void playgroundShuttle.offsetWidth;
    playgroundShuttle.style.animation = '';
  };
  playgroundShuttle.addEventListener('animationstart', playBadmintonHit);
  playgroundShuttle.addEventListener('animationend', () => {
    playgroundStage.classList.add('is-guitar');
    playGuitarStrum();
    window.setTimeout(runCycle, 3500);
  });
  runCycle();
};

if (playgroundStage) {
  const updatePlaygroundAudioToggle = () => {
    if (!playgroundVideo || !playgroundAudioToggle) return;
    const isUnmuted = !playgroundVideo.muted;
    playgroundAudioToggle.classList.toggle('is-unmuted', isUnmuted);
    playgroundAudioToggle.setAttribute('aria-pressed', String(isUnmuted));
    playgroundAudioToggle.setAttribute('aria-label', isUnmuted ? 'Mute animation' : 'Unmute animation');
  };
  playgroundAudioToggle?.addEventListener('pointerdown', (event) => event.stopPropagation());
  playgroundAudioToggle?.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
  playgroundAudioToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!playgroundVideo) return;
    playgroundVideo.muted = !playgroundVideo.muted;
    if (!playgroundVideo.muted) playgroundVideo.play().catch(() => {});
    updatePlaygroundAudioToggle();
  });
  updatePlaygroundAudioToggle();
  playgroundStage.addEventListener('click', (event) => {
    // Keep the animation muted until the user explicitly taps the audio toggle.
    playgroundVideo?.play().catch(() => {});
    startPlaygroundRally();
  });
  if ('IntersectionObserver' in window) {
    const playgroundObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { startPlaygroundRally(); playgroundObserver.disconnect(); } }, { threshold: .28 });
    playgroundObserver.observe(playgroundStage);
  } else startPlaygroundRally();
}

const serviceSection = document.querySelector('.services-marquee');
const serviceRows = document.querySelectorAll('.service-row');
const serviceProgress = document.querySelector('.services-progress');
if (serviceSection && serviceRows.length) {
  const updateServiceProgress = () => {
    const bounds = serviceSection.getBoundingClientRect();
    const travel = Math.max(1, bounds.height - window.innerHeight);
    const amount = Math.min(100, Math.max(0, (-bounds.top / travel) * 100));
    if (serviceProgress) serviceProgress.textContent = `${Math.round(amount)}%`;
  };
  let progressTick = false;
  window.addEventListener('scroll', () => {
    if (progressTick) return;
    progressTick = true;
    requestAnimationFrame(() => {
      updateServiceProgress();
      progressTick = false;
    });
  }, { passive: true });
  updateServiceProgress();

  if ('IntersectionObserver' in window) {
    const serviceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        serviceRows.forEach((row) => row.classList.toggle('is-active', row === entry.target));
      });
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
    serviceRows.forEach((row) => serviceObserver.observe(row));
  }
}

const showreelSection = document.querySelector('.showreel-section');
const showreelToggle = document.querySelector('.showreel-toggle');
if (showreelSection && showreelToggle) {
  showreelToggle.addEventListener('click', () => {
    const paused = showreelSection.classList.toggle('is-paused');
    showreelToggle.setAttribute('aria-pressed', String(paused));
    showreelToggle.setAttribute('aria-label', paused ? 'Play showreel' : 'Pause showreel');
    const label = showreelToggle.querySelector('span:last-child');
    const icon = showreelToggle.querySelector('.showreel-toggle-icon');
    if (label) label.textContent = paused ? 'PLAY' : 'PAUSE';
    if (icon) icon.textContent = paused ? '▶' : 'Ⅱ';
  });
}

const authModal = document.querySelector('#auth-modal');
const authCta = document.querySelector('.hero-nav .cta-button');
const isStandaloneAuthPage = document.body.classList.contains('auth-page');
let authHistoryView = isStandaloneAuthPage ? 'login' : 'welcome';
if (isStandaloneAuthPage) {
  window.history.replaceState({ briviaAuthView: 'login' }, '', window.location.href);
}
const authViews = document.querySelectorAll('[data-auth-view]');
const authStep = authModal?.querySelector('.auth-step');
const authPanelKicker = authModal?.querySelector('.auth-panel-kicker');
const authShell = authModal?.querySelector('.auth-shell');
const authPanel = authModal?.querySelector('.auth-panel');
const authScrollbarThumb = authModal?.querySelector('.auth-scrollbar span');
const signupForm = document.querySelector('#signup-form');
const signupSuccess = document.querySelector('#auth-success');
const loginForm = document.querySelector('#login-form');
const loginNote = document.querySelector('#login-note');
const signupPasswordFields = signupForm?.querySelector('.signup-password-fields');
const signupStepOne = signupForm?.querySelector('[data-signup-step="1"]');
const signupStepLabel = signupForm?.querySelector('[data-signup-step-label]');
const signupProgress = signupForm?.querySelector('.signup-progress-track');
const signupProgressFill = signupForm?.querySelector('[data-signup-progress-fill]');
let signupCurrentStep = 1;
let profileCompletionUser = null;
let authCloseTimer;
let authEnvelopeTimer;
let resetSkills = () => {};
let resetLooking = () => {};
let resetPhoto = () => {};
let fillSkills = () => {};
let fillLooking = () => {};
let profileCompletionPhotoUrl = '';

const photoUpload = document.querySelector('[data-photo-upload]');
if (photoUpload) {
  const photoInput = photoUpload.querySelector('.photo-input');
  const photoPreview = photoUpload.querySelector('.photo-preview');
  const photoFileName = photoUpload.querySelector('.photo-file-name');
  const photoRemove = photoUpload.querySelector('.photo-remove');
  const photoTitle = photoUpload.querySelector('.photo-copy strong');
  let previewUrl = '';
  const defaultPhotoText = 'Optional · A clear photo helps people recognise you.';
  const imageExtension = /\.(jpg|jpeg|png|webp|gif|svg|avif|heic|heif|bmp|tif|tiff)$/i;

  photoInput?.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    photoUpload.classList.add('has-file');
    photoRemove?.removeAttribute('hidden');
    if (photoTitle) photoTitle.textContent = 'CHANGE PROFILE PHOTO';
    if (file.type.startsWith('image/') || imageExtension.test(file.name)) {
      if (photoPreview) {
        photoPreview.textContent = '';
        photoPreview.style.backgroundImage = `url("${previewUrl}")`;
      }
    } else if (photoPreview) {
      photoPreview.textContent = 'FILE';
      photoPreview.style.backgroundImage = '';
    }
    if (photoFileName) photoFileName.textContent = file.name;
  });

  resetPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    if (photoInput) photoInput.value = '';
    photoUpload.classList.remove('has-file');
    photoRemove?.setAttribute('hidden', '');
    if (photoTitle) photoTitle.textContent = 'ADD A PROFILE PHOTO';
    if (photoPreview) {
      photoPreview.textContent = '＋';
      photoPreview.style.backgroundImage = '';
    }
    if (photoFileName) photoFileName.textContent = defaultPhotoText;
  };
  photoRemove?.addEventListener('click', () => {
    resetPhoto();
    photoInput?.focus();
  });
}

const skillOptions = [
  'Python', 'SQL', 'Data Structures & Algorithms', 'Git', 'GitHub', 'REST APIs', 'JavaScript', 'React', 'Linux', 'AWS',
  'Generative AI', 'Prompt Engineering', 'LLMs', 'RAG', 'AI Agents', 'AI Automation', 'n8n', 'Docker', 'Data Analysis',
  'Power BI', 'Tableau', 'Excel', 'Problem Solving', 'Critical Thinking', 'English Communication', 'Public Speaking',
  'Presentation Skills', 'Professional Email Writing', 'Resume Building', 'Interview Skills', 'LinkedIn Networking',
  'Personal Branding', 'Project Management', 'Business Communication', 'Sales', 'Negotiation', 'Time Management',
  'Personal Finance', 'Budgeting', 'Digital Security', 'Password Management', 'Google Maps', 'Navigation', 'Trip Planning',
  'Public Transport', 'Travel Budgeting', 'Packing', 'First Aid', 'Cooking', 'Geography', 'Cross-Cultural Communication',
  'Photography', 'Adaptability', 'Other',
];

const skillsPicker = document.querySelector('[data-skills-picker]');
if (skillsPicker) {
  const skillsSearch = skillsPicker.querySelector('.skills-search');
  const skillsOtherInput = skillsPicker.querySelector('.skills-other-input');
  const skillsResults = skillsPicker.querySelector('.skills-results');
  const skillsSelected = skillsPicker.querySelector('.skills-selected');
  const skillsValue = skillsPicker.querySelector('.skills-value');
  const selectedSkills = [];
  let customSkillsMode = false;

  const syncSkills = () => {
    if (skillsValue) skillsValue.value = selectedSkills.join(', ');
    if (skillsSearch) skillsSearch.setCustomValidity(selectedSkills.length ? '' : 'Select at least one skill.');
    if (skillsSelected) {
      skillsSelected.innerHTML = selectedSkills.map((skill) => `<button type="button" class="skill-chip" data-remove-skill="${skill.replace(/"/g, '&quot;')}">${skill}<span aria-hidden="true">×</span></button>`).join('');
      skillsSelected.querySelectorAll('[data-remove-skill]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = selectedSkills.indexOf(button.dataset.removeSkill);
          if (index > -1) selectedSkills.splice(index, 1);
          syncSkills();
          renderSkills();
          skillsSearch?.focus();
        });
      });
    }
  };

  const addSkill = (skill) => {
    const cleanSkill = skill.trim();
    if (!cleanSkill || selectedSkills.some((item) => item.toLowerCase() === cleanSkill.toLowerCase())) return;
    selectedSkills.push(cleanSkill);
    customSkillsMode = false;
    skillsOtherInput?.setAttribute('hidden', '');
    if (skillsOtherInput) skillsOtherInput.value = '';
    if (skillsSearch) skillsSearch.value = '';
    if (skillsSearch) skillsSearch.placeholder = 'Search and select skills...';
    syncSkills();
    renderSkills();
    skillsSearch?.focus();
  };

  const renderSkills = () => {
    if (!skillsResults || !skillsSearch) return;
    const query = skillsSearch.value.trim().toLowerCase();
    const matches = skillOptions.filter((skill) => skill.toLowerCase().includes(query));
    const hasExactMatch = skillOptions.some((skill) => skill.toLowerCase() === query);
    if (query && !hasExactMatch) matches.push(`__custom__${skillsSearch.value.trim()}`);
    skillsResults.innerHTML = matches.length ? matches.map((skill) => {
      if (skill.startsWith('__custom__')) return `<button type="button" class="skill-option skill-option--custom" data-custom-skill="${skill.slice(10).replace(/"/g, '&quot;')}">ADD “${skill.slice(10)}” AS OTHER <span>＋</span></button>`;
      const isSelected = selectedSkills.includes(skill);
      return `<button type="button" class="skill-option${isSelected ? ' is-selected' : ''}" data-skill="${skill.replace(/"/g, '&quot;')}" role="option" aria-selected="${isSelected}">${skill}<span>${isSelected ? '✓' : '＋'}</span></button>`;
    }).join('') : '<p class="skills-empty">No matching skill. Type a skill and press Enter to add it as Other.</p>';
    skillsResults.querySelectorAll('[data-skill]').forEach((button) => {
      button.addEventListener('click', () => {
        const skill = button.dataset.skill;
        if (skill === 'Other') {
          customSkillsMode = true;
          skillsPicker.classList.remove('is-open');
          skillsOtherInput?.removeAttribute('hidden');
          skillsOtherInput?.focus();
          return;
        }
        customSkillsMode = false;
        skillsSearch.placeholder = 'Search and select skills...';
        const index = selectedSkills.indexOf(skill);
        if (index > -1) selectedSkills.splice(index, 1); else selectedSkills.push(skill);
        syncSkills();
        renderSkills();
        skillsSearch.focus();
      });
    });
    skillsResults.querySelectorAll('[data-custom-skill]').forEach((button) => button.addEventListener('click', () => addSkill(button.dataset.customSkill)));
  };

  resetSkills = () => {
    selectedSkills.splice(0, selectedSkills.length);
    customSkillsMode = false;
    skillsOtherInput?.setAttribute('hidden', '');
    if (skillsOtherInput) skillsOtherInput.value = '';
    if (skillsSearch) skillsSearch.value = '';
    if (skillsSearch) skillsSearch.placeholder = 'Search and select skills...';
    syncSkills();
    renderSkills();
  };
  fillSkills = (value) => {
    selectedSkills.splice(0, selectedSkills.length, ...String(value || '').split(',').map((item) => item.trim()).filter(Boolean));
    syncSkills();
    renderSkills();
  };
  skillsSearch?.addEventListener('focus', () => { skillsPicker.classList.add('is-open'); renderSkills(); });
  skillsSearch?.addEventListener('input', () => { skillsPicker.classList.add('is-open'); renderSkills(); });
  skillsSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !skillsSearch.value.trim()) return;
    event.preventDefault();
    const query = skillsSearch.value.trim();
    if (!customSkillsMode && !skillOptions.some((skill) => skill.toLowerCase() === query.toLowerCase())) addSkill(query);
  });
  skillsOtherInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !skillsOtherInput.value.trim()) return;
    event.preventDefault();
    addSkill(skillsOtherInput.value);
  });
  document.addEventListener('click', (event) => {
    const clickedInsidePicker = event.composedPath().includes(skillsPicker);
    if (!clickedInsidePicker) {
      skillsPicker.classList.remove('is-open');
      skillsSearch?.setAttribute('aria-expanded', 'false');
    } else skillsSearch?.setAttribute('aria-expanded', String(skillsPicker.classList.contains('is-open')));
  });
  renderSkills();
}

const lookingOptions = [
  'Hackathon Buddy', 'SIH Buddy', 'Travelling Buddy', 'Study Partner', 'Project Partner', 'Coding Partner', 'Startup Partner',
  'Co-founder', 'Teammate', 'Mentor', 'Mentee', 'Freelancer', 'Intern', 'Research Partner', 'Open Source Contributor',
  'Developer', 'Designer', 'AI Enthusiast', 'ML Enthusiast', 'Entrepreneur', 'Photographer', 'Content Creator', 'Video Editor',
  'UI/UX Designer', 'Data Analyst', 'Business Analyst', 'Marketer', 'Public Speaker', 'Writer', 'Volunteer', 'Event Participant',
  'Networking Contact', 'Career Mentor', 'Job Referral', 'Internship Referral', 'Accountability Partner', 'Language Exchange Partner',
  'Travel Companion', 'Trekking Partner', 'Sports Partner', 'Gaming Partner', 'Photography Partner', 'Event Companion',
  'Conference Companion', 'Workshop Partner', 'Competition Teammate', 'Roommate', 'Local Guide', 'Community Member', 'Collaborator', 'Other',
];

const lookingPicker = document.querySelector('[data-looking-picker]');
if (lookingPicker) {
  const lookingSearch = lookingPicker.querySelector('.looking-search');
  const lookingOtherInput = lookingPicker.querySelector('.looking-other-input');
  const lookingResults = lookingPicker.querySelector('.looking-results');
  const lookingSelected = lookingPicker.querySelector('.looking-selected');
  const lookingValue = lookingPicker.querySelector('.looking-value');
  const selectedLooking = [];
  let customLookingMode = false;

  const syncLooking = () => {
    if (lookingValue) lookingValue.value = selectedLooking.join(', ');
    if (lookingSearch) lookingSearch.setCustomValidity(selectedLooking.length ? '' : 'Choose at least one option.');
    if (lookingSelected) {
      lookingSelected.innerHTML = selectedLooking.map((item) => `<button type="button" class="skill-chip" data-remove-looking="${item.replace(/"/g, '&quot;')}">${item}<span aria-hidden="true">×</span></button>`).join('');
      lookingSelected.querySelectorAll('[data-remove-looking]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = selectedLooking.indexOf(button.dataset.removeLooking);
          if (index > -1) selectedLooking.splice(index, 1);
          syncLooking();
          renderLooking();
          lookingSearch?.focus();
        });
      });
    }
  };

  const addLooking = (value) => {
    const cleanValue = value.trim();
    if (!cleanValue || selectedLooking.some((item) => item.toLowerCase() === cleanValue.toLowerCase())) return;
    selectedLooking.push(cleanValue);
    customLookingMode = false;
    lookingOtherInput?.setAttribute('hidden', '');
    if (lookingOtherInput) lookingOtherInput.value = '';
    if (lookingSearch) {
      lookingSearch.value = '';
      lookingSearch.placeholder = 'Search what brings you here...';
    }
    syncLooking();
    renderLooking();
    lookingSearch?.focus();
  };

  const renderLooking = () => {
    if (!lookingResults || !lookingSearch) return;
    const query = lookingSearch.value.trim().toLowerCase();
    const matches = lookingOptions.filter((item) => item.toLowerCase().includes(query));
    const hasExactMatch = lookingOptions.some((item) => item.toLowerCase() === query);
    if (query && !hasExactMatch) matches.push(`__custom__${lookingSearch.value.trim()}`);
    lookingResults.innerHTML = matches.length ? matches.map((item) => {
      if (item.startsWith('__custom__')) return `<button type="button" class="skill-option skill-option--custom" data-custom-looking="${item.slice(10).replace(/"/g, '&quot;')}">ADD “${item.slice(10)}” AS OTHER <span>＋</span></button>`;
      const isSelected = selectedLooking.includes(item);
      return `<button type="button" class="skill-option${isSelected ? ' is-selected' : ''}" data-looking-option="${item.replace(/"/g, '&quot;')}" role="option" aria-selected="${isSelected}">${item}<span>${isSelected ? '✓' : '＋'}</span></button>`;
    }).join('') : '<p class="skills-empty">No match. Type your own option and press Enter.</p>';
    lookingResults.querySelectorAll('[data-looking-option]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.dataset.lookingOption;
        if (item === 'Other') {
          customLookingMode = true;
          lookingPicker.classList.remove('is-open');
          lookingOtherInput?.removeAttribute('hidden');
          lookingOtherInput?.focus();
          return;
        }
        customLookingMode = false;
        lookingSearch.placeholder = 'Search what brings you here...';
        const index = selectedLooking.indexOf(item);
        if (index > -1) selectedLooking.splice(index, 1); else selectedLooking.push(item);
        syncLooking();
        renderLooking();
        lookingSearch.focus();
      });
    });
    lookingResults.querySelectorAll('[data-custom-looking]').forEach((button) => button.addEventListener('click', () => addLooking(button.dataset.customLooking)));
  };

  resetLooking = () => {
    selectedLooking.splice(0, selectedLooking.length);
    customLookingMode = false;
    lookingOtherInput?.setAttribute('hidden', '');
    if (lookingOtherInput) lookingOtherInput.value = '';
    if (lookingSearch) {
      lookingSearch.value = '';
      lookingSearch.placeholder = 'Search what brings you here...';
    }
    syncLooking();
    renderLooking();
  };
  fillLooking = (value) => {
    selectedLooking.splice(0, selectedLooking.length, ...String(value || '').split(',').map((item) => item.trim()).filter(Boolean));
    syncLooking();
    renderLooking();
  };
  lookingSearch?.addEventListener('focus', () => { lookingPicker.classList.add('is-open'); renderLooking(); });
  lookingSearch?.addEventListener('input', () => { lookingPicker.classList.add('is-open'); renderLooking(); });
  lookingSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !lookingSearch.value.trim()) return;
    event.preventDefault();
    addLooking(lookingSearch.value);
  });
  lookingOtherInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !lookingOtherInput.value.trim()) return;
    event.preventDefault();
    addLooking(lookingOtherInput.value);
  });
  document.addEventListener('click', (event) => {
    const clickedInsidePicker = event.composedPath().includes(lookingPicker);
    if (!clickedInsidePicker) {
      lookingPicker.classList.remove('is-open');
      lookingSearch?.setAttribute('aria-expanded', 'false');
    } else lookingSearch?.setAttribute('aria-expanded', String(lookingPicker.classList.contains('is-open')));
  });
  renderLooking();
}

if (authCta && authModal) {
  authCta.classList.add('auth-trigger');
  authCta.setAttribute('href', '/auth.html');
  authCta.setAttribute('aria-haspopup', 'dialog');
  authCta.innerHTML = '<span class="button-label">START SWIPING</span><span class="button-arrows">→</span>';
}

const resetSignup = () => {
  signupForm?.reset();
  resetSkills();
  resetLooking();
  resetPhoto();
  profileCompletionUser = null;
  profileCompletionPhotoUrl = '';
  signupForm?.elements.namedItem('email')?.removeAttribute('readonly');
  setSignupPasswordMode(true);
  setSignupStep(1, false);
  const submit = signupForm?.querySelector('[type="submit"]');
  if (submit) submit.innerHTML = 'CREATE MY PROFILE <span>→</span>';
  signupForm?.removeAttribute('hidden');
  signupSuccess?.setAttribute('hidden', '');
  const backButton = authModal?.querySelector('.auth-back-trigger');
  if (backButton) {
    backButton.removeAttribute('hidden');
    backButton.textContent = '← BACK TO LOGIN';
  }
};

function setSignupPasswordMode(enabled) {
  if (!signupPasswordFields) return;
  signupPasswordFields.toggleAttribute('hidden', !enabled);
  signupPasswordFields.querySelectorAll('input').forEach((input) => {
    input.required = enabled;
    if (!enabled) input.value = '';
  });
}

function setSignupStep(step, focusFirst = true) {
  signupCurrentStep = step === 2 ? 2 : 1;
  signupForm?.querySelectorAll('[data-signup-step]').forEach((panel) => {
    panel.toggleAttribute('hidden', Number(panel.dataset.signupStep) !== signupCurrentStep);
  });
  if (signupStepLabel) signupStepLabel.textContent = signupCurrentStep === 1 ? 'STEP 1 OF 2 · THE BASICS' : 'STEP 2 OF 2 · YOUR SIGNALS';
  if (signupProgress) signupProgress.setAttribute('aria-valuenow', String(signupCurrentStep));
  if (signupProgressFill) signupProgressFill.style.width = signupCurrentStep === 1 ? '50%' : '100%';
  authPanel?.scrollTo({ top: 0, behavior: 'smooth' });
  if (focusFirst) {
    const activeStep = signupForm?.querySelector(`[data-signup-step="${signupCurrentStep}"]`);
    const firstVisibleField = [...(activeStep?.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select, textarea') || [])]
      .find((field) => field.getClientRects().length && !field.disabled);
    firstVisibleField?.focus({ preventScroll: true });
  }
}

const signupNextButton = signupForm?.querySelector('.signup-next');
const signupPrevButton = signupForm?.querySelector('.signup-step-prev');
const validateSignupStepOne = () => {
  if (!signupStepOne) return true;
  const fields = [...signupStepOne.querySelectorAll('input, select, textarea')].filter((field) => field.type !== 'hidden' && !field.disabled);
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
};
signupNextButton?.addEventListener('click', () => {
  if (validateSignupStepOne()) setSignupStep(2);
});
signupPrevButton?.addEventListener('click', () => setSignupStep(1));

const signupFeedback = signupForm ? document.createElement('p') : null;
if (signupFeedback && signupForm) {
  signupFeedback.className = 'auth-note';
  signupFeedback.id = 'signup-feedback';
  signupFeedback.setAttribute('aria-live', 'polite');
  signupForm.setAttribute('novalidate', '');
  signupForm.after(signupFeedback);
}

const signupSuccessTitle = signupSuccess?.querySelector('h2');
const signupSuccessMessage = signupSuccess?.querySelector('p');
signupSuccessTitle?.setAttribute('data-auth-success-title', '');
signupSuccessMessage?.setAttribute('data-auth-success-message', '');
signupSuccess?.querySelector('[data-credential="member-password"]')?.closest('.credential-row')?.remove();
if (signupSuccessMessage) signupSuccessMessage.textContent = 'We sent a verification link. Your email is your login ID; your password stays private and is never shown here.';

signupSuccess?.querySelectorAll('[data-copy-credential]').forEach((button) => {
  button.addEventListener('click', async () => {
    const key = button.dataset.copyCredential;
    const value = signupSuccess.querySelector(`[data-credential="${key}"]`)?.textContent || '';
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'COPIED';
      window.setTimeout(() => { button.textContent = 'COPY'; }, 1600);
    } catch {
      button.textContent = 'SELECT & COPY';
    }
  });
});

const setAuthView = (view, historyMode = 'push') => {
  if (isStandaloneAuthPage && view !== authHistoryView && historyMode !== 'none') {
    const state = { briviaAuthView: view };
    if (historyMode === 'replace') window.history.replaceState(state, '', window.location.href);
    else window.history.pushState(state, '', window.location.href);
  }
  authHistoryView = view;
  authViews.forEach((item) => {
    const isActive = item.dataset.authView === view;
    item.classList.toggle('is-active', isActive);
    item.toggleAttribute('hidden', !isActive);
  });
  if (authStep) authStep.textContent = view === 'welcome' ? 'WELCOME' : view === 'login' ? '01 / 02' : '02 / 02';
  if (authPanelKicker) authPanelKicker.textContent = view === 'welcome' ? 'THE BRIVIA CLUB' : view === 'login' ? 'RETURNING MEMBER' : 'YOUR APPLICATION';
  const authTopSignup = authModal?.querySelector('.auth-top-signup');
  if (authTopSignup) authTopSignup.innerHTML = view === 'signup' ? 'ALREADY A MEMBER? <b>LOG IN</b>' : 'NEW HERE? <b>CREATE ACCOUNT</b>';
  if (authShell) authShell.setAttribute('aria-labelledby', view === 'welcome' ? 'auth-welcome-title' : view === 'login' ? 'auth-title' : 'signup-title');
  if (view === 'signup') signupForm?.querySelector('input')?.focus();
};

if (isStandaloneAuthPage) {
  window.addEventListener('popstate', (event) => {
    setAuthView(event.state?.briviaAuthView || 'welcome', 'none');
  });
}

const startGoogleAuth = async () => {
  if (!supabaseReady || !supabase) {
    if (loginNote) loginNote.textContent = 'Google sign-in is not configured yet. Please use email and password.';
    if (signupFeedback) signupFeedback.textContent = 'Google sign-in is not configured yet. Please use email and password.';
    return;
  }
  const buttons = authModal?.querySelectorAll('.auth-google-trigger') || [];
  buttons.forEach((button) => { button.disabled = true; });
  if (loginNote) loginNote.textContent = 'Connecting to Google...';
  if (signupFeedback) signupFeedback.textContent = 'Connecting to Google...';
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth.html`, queryParams: { prompt: 'select_account' } },
    });
    if (!error) return;
    buttons.forEach((button) => { button.disabled = false; });
    if (loginNote) loginNote.textContent = error.message || 'Google sign-in could not start.';
    if (signupFeedback) signupFeedback.textContent = error.message || 'Google sign-in could not start.';
  } catch (error) {
    buttons.forEach((button) => { button.disabled = false; });
    if (loginNote) loginNote.textContent = error.message || 'Google sign-in could not start.';
    if (signupFeedback) signupFeedback.textContent = error.message || 'Google sign-in could not start.';
  }
};

const showProfileCompletion = (user, savedProfile = null) => {
  if (!signupForm || !user) return;
  resetSignup();
  profileCompletionUser = user;
  const metadata = user.user_metadata || {};
  const profile = savedProfile || {};
  const values = {
    name: profile.name || metadata.name || metadata.full_name || '',
    email: user.email || profile.email || '',
    phone: profile.phone || metadata.phone || '',
    city: profile.city || metadata.city || '',
    state: profile.state || metadata.state || '',
    experience: profile.experience || metadata.experience || '',
  };
  Object.entries(values).forEach(([name, value]) => {
    const field = signupForm.elements.namedItem(name);
    if (field && value) field.value = value;
  });
  const emailField = signupForm.elements.namedItem('email');
  emailField?.setAttribute('readonly', '');
  fillSkills(profile.skills || metadata.skills || '');
  fillLooking(profile.lookingFor || profile.looking_for || metadata.lookingFor || metadata.looking_for || '');
  profileCompletionPhotoUrl = profile.photoUrl || metadata.avatar_url || metadata.picture || '';
  setSignupPasswordMode(false);
  const submit = signupForm.querySelector('[type="submit"]');
  if (submit) submit.innerHTML = 'COMPLETE MY PROFILE <span>→</span>';
  const backButton = authModal?.querySelector('.auth-back-trigger');
  if (backButton) backButton.textContent = 'SIGN OUT / BACK TO LOGIN';
  if (signupFeedback) signupFeedback.textContent = 'Finish your Brivia profile to unlock the club. Your email is verified with Google.';
  setAuthView('signup');
};

const restoreAuthPageSession = async () => {
  if (!document.body.classList.contains('auth-page') || !supabaseReady || !supabase) return;
  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError) {
    setAuthView('login');
    if (loginNote) loginNote.textContent = oauthError.replaceAll('+', ' ');
    window.history.replaceState({ briviaAuthView: 'login' }, '', '/auth.html');
    return;
  }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) return;
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if (error) {
    setAuthView('login');
    if (loginNote) loginNote.textContent = `We couldn't verify your Brivia profile: ${error.message}`;
    return;
  }
  if (profile) {
    window.location.replace('/app.html');
    return;
  }
  const pending = JSON.parse(window.localStorage.getItem('brivia-pending-profile') || 'null');
  const pendingMatches = pending?.email?.toLowerCase() === session.user.email?.toLowerCase();
  showProfileCompletion(session.user, pendingMatches ? pending : null);
  window.history.replaceState({ briviaAuthView: 'signup' }, '', '/auth.html');
};

const updateAuthScrollbar = () => {
  if (!authPanel || !authScrollbarThumb) return;
  const scrollable = authPanel.scrollHeight - authPanel.clientHeight;
  const visibleRatio = scrollable > 0 ? authPanel.clientHeight / authPanel.scrollHeight : 1;
  const thumbSize = Math.max(18, visibleRatio * 100);
  const scrollRatio = scrollable > 0 ? authPanel.scrollTop / scrollable : 0;
  authScrollbarThumb.style.height = `${thumbSize}%`;
  authScrollbarThumb.style.top = `${scrollRatio * (100 - thumbSize)}%`;
};

authPanel?.addEventListener('scroll', updateAuthScrollbar, { passive: true });
window.addEventListener('resize', updateAuthScrollbar);
window.requestAnimationFrame(updateAuthScrollbar);

const openAuth = () => {
  if (!authModal) return;
  window.clearTimeout(authCloseTimer);
  window.clearTimeout(authEnvelopeTimer);
  authShell?.classList.remove('is-envelope-opening');
  resetSignup();
  setAuthView(authModal.querySelector('[data-auth-view="login"]') ? 'login' : 'welcome');
  authModal.removeAttribute('hidden');
  document.body.classList.add('auth-open');
  window.requestAnimationFrame(() => authModal.classList.add('is-open'));
  window.setTimeout(() => authModal.querySelector('input')?.focus(), 350);
};

const closeAuth = () => {
  if (!authModal) return;
  window.clearTimeout(authEnvelopeTimer);
  authShell?.classList.remove('is-envelope-opening');
  if (document.body.classList.contains('auth-page')) {
    try { window.sessionStorage.setItem('brivia-skip-intro-once', 'true'); } catch {}
    window.location.href = '/';
    return;
  }
  authModal.classList.remove('is-open');
  document.body.classList.remove('auth-open');
  authCloseTimer = window.setTimeout(() => authModal.setAttribute('hidden', ''), 420);
  authCta?.focus();
};

if (document.body.classList.contains('auth-page')) {
  window.addEventListener('pagehide', () => {
    try { window.sessionStorage.setItem('brivia-skip-intro-once', 'true'); } catch {}
  });
}

const openAuthEnvelope = (view) => {
  if (!authShell || authShell.classList.contains('is-envelope-opening')) return;
  window.clearTimeout(authEnvelopeTimer);
  authShell.classList.add('is-envelope-opening');
  authEnvelopeTimer = window.setTimeout(() => {
    setAuthView(view);
    authShell.classList.remove('is-envelope-opening');
  }, 1420);
};

authModal?.querySelector('.auth-close')?.addEventListener('click', closeAuth);
authModal?.querySelector('[data-auth-close]')?.addEventListener('click', closeAuth);
authModal?.querySelector('.auth-welcome-login')?.addEventListener('click', () => openAuthEnvelope('login'));
authModal?.querySelector('.auth-welcome-signup')?.addEventListener('click', () => openAuthEnvelope('signup'));
authModal?.querySelector('.auth-top-signup')?.addEventListener('click', () => setAuthView(authHistoryView === 'signup' ? 'login' : 'signup'));
authModal?.querySelector('.auth-create-trigger')?.addEventListener('click', () => setAuthView('signup'));
authModal?.querySelectorAll('.auth-google-trigger').forEach((button) => button.addEventListener('click', startGoogleAuth));
authModal?.querySelector('.auth-back-trigger')?.addEventListener('click', async () => {
  if (profileCompletionUser && supabase) {
    await supabase.auth.signOut();
    window.localStorage.removeItem('brivia-pending-profile');
  }
  resetSignup();
  setAuthView('login');
});
authModal?.querySelector('.auth-close-success')?.addEventListener('click', closeAuth);

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const submit = loginForm.querySelector('.auth-submit');
  if (submit) submit.disabled = true;
  if (loginNote) loginNote.textContent = 'Checking your membership...';
  try {
    if (!supabaseReady || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const pending = JSON.parse(window.localStorage.getItem('brivia-pending-profile') || 'null');
    const pendingBelongsToUser = pending?.email?.toLowerCase() === data.user?.email?.toLowerCase();
    if (pending && data.user && pendingBelongsToUser) {
      const safePending = { ...pending };
      delete safePending.loginPassword;
      delete safePending.password;
      delete safePending.passwordConfirm;
      const { error: profileError } = await saveProfile(data.user.id, safePending, null);
      if (profileError) throw profileError;
      window.localStorage.removeItem('brivia-pending-profile');
      window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...safePending, id: data.user.id }));
    } else if (pending && !pendingBelongsToUser) {
      window.localStorage.removeItem('brivia-pending-profile');
    }
    const { data: ownProfile, error: ownProfileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (ownProfileError) throw ownProfileError;
    if (!ownProfile) {
      showProfileCompletion(data.user, pendingBelongsToUser ? pending : null);
      return;
    }
    window.localStorage.setItem('brivia-member-profile', JSON.stringify({ id: data.user.id, email: data.user.email || email }));
    window.location.href = '/app.html';
  } catch (error) {
    if (loginNote) loginNote.textContent = error.message || 'Could not sign you in. Check your email and password.';
  } finally {
    if (submit) submit.disabled = false;
  }
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (signupCurrentStep === 1) {
    if (validateSignupStepOne()) setSignupStep(2);
    return;
  }
  signupForm.elements.namedItem('passwordConfirm')?.setCustomValidity('');
  if (!signupForm.checkValidity()) {
    signupForm.reportValidity();
    if (signupFeedback) signupFeedback.textContent = 'Please complete all required fields.';
    return;
  }
  const skillsValue = signupForm.querySelector('.skills-value');
  const lookingValue = signupForm.querySelector('.looking-value');
  if (!skillsValue?.value || !lookingValue?.value) {
    signupForm.querySelector('.skills-search')?.reportValidity();
    signupForm.querySelector('.looking-search')?.reportValidity();
    if (signupFeedback) signupFeedback.textContent = 'Select at least one skill and one thing you are looking for.';
    return;
  }
  const formData = new FormData(signupForm);
  const password = String(formData.get('password') || '');
  const passwordConfirm = String(formData.get('passwordConfirm') || '');
  if (!profileCompletionUser && password !== passwordConfirm) {
    const confirmField = signupForm.elements.namedItem('passwordConfirm');
    confirmField?.setCustomValidity('Passwords do not match.');
    confirmField?.reportValidity();
    confirmField?.addEventListener('input', () => confirmField.setCustomValidity(''), { once: true });
    if (signupFeedback) signupFeedback.textContent = 'Your passwords do not match.';
    return;
  }
  const profile = Object.fromEntries(formData.entries());
  delete profile.password;
  delete profile.passwordConfirm;
  const photoFile = signupForm.querySelector('.photo-input')?.files?.[0] || null;
  profile.photoName = photoFile?.name || '';
  if (photoFile) {
    try { profile.photoUrl = await compressedImageDataUrl(photoFile); } catch { profile.photoUrl = ''; }
  } else if (profileCompletionPhotoUrl) profile.photoUrl = profileCompletionPhotoUrl;
  const submit = signupForm.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  if (signupFeedback) signupFeedback.textContent = 'Saving your profile...';
  try {
    if (!supabaseReady || !supabase) throw new Error('Supabase is not configured.');
    let sessionUser = profileCompletionUser;
    if (sessionUser) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.user || sessionData.session.user.id !== sessionUser.id) throw new Error('Your sign-in session expired. Please continue with Google or log in again.');
      sessionUser = sessionData.session.user;
      if (profile.email.toLowerCase() !== sessionUser.email?.toLowerCase()) throw new Error('Use the verified email attached to this account.');
      const { error: profileError } = await saveProfile(sessionUser.id, profile, photoFile);
      if (profileError) throw profileError;
      window.localStorage.removeItem('brivia-pending-profile');
      window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...profile, id: sessionUser.id }));
      window.location.href = '/app.html';
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: profile.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth.html`,
        data: {
          name: profile.name,
          full_name: profile.name,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          experience: profile.experience,
          skills: profile.skills,
          lookingFor: profile.lookingFor,
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('We could not create your account. Please try again.');
    if (data.session) {
      profileCompletionUser = data.user;
      signupForm.elements.namedItem('email')?.setAttribute('readonly', '');
      setSignupPasswordMode(false);
      if (submit) submit.innerHTML = 'COMPLETE MY PROFILE <span>→</span>';
      const { error: profileError } = await saveProfile(data.user.id, profile, photoFile);
      if (profileError) throw profileError;
      window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...profile, id: data.user.id }));
      window.location.href = '/app.html';
      return;
    }
    window.localStorage.setItem('brivia-pending-profile', JSON.stringify(profile));
    const accountEmail = signupSuccess?.querySelector('[data-credential="account-email"]');
    if (accountEmail) accountEmail.textContent = profile.email;
    const successTitle = signupSuccess?.querySelector('[data-auth-success-title]');
    const successMessage = signupSuccess?.querySelector('[data-auth-success-message]');
    if (successTitle) successTitle.textContent = 'Check your email.';
    if (successMessage) successMessage.textContent = 'We sent a verification link. Verify your email, then sign in to finish activating your Brivia profile. Supabase manages your password securely; Brivia never displays it or saves it in your profile.';
    signupForm.setAttribute('hidden', '');
    if (signupFeedback) signupFeedback.textContent = '';
    signupSuccess?.removeAttribute('hidden');
    authModal?.querySelector('.auth-back-trigger')?.setAttribute('hidden', '');
    signupSuccess?.querySelector('button')?.focus();
  } catch (error) {
    if (loginNote) loginNote.textContent = error.message || 'Could not create your account. Please try again.';
    if (signupFeedback) signupFeedback.textContent = error.message || 'Could not create your account. Please try again.';
    if (authPanelKicker) authPanelKicker.textContent = error.message || 'ACCOUNT CREATION FAILED';
  } finally {
    if (submit) submit.disabled = false;
  }
});

if (document.body.classList.contains('auth-page')) void restoreAuthPageSession();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && authModal?.classList.contains('is-open')) closeAuth();
});
