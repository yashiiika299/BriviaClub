import './style.css';
import './auth-theme.css';
import './playground.css';
import { supabase, supabaseReady, saveProfile, saveLoginCredentials, compressedImageDataUrl } from './supabase.js';

const introBurst = document.querySelector('#intro-burst');
const introSkip = introBurst?.querySelector('.intro-skip');
if (introBurst) {
  document.body.classList.add('intro-active');
  const finishIntro = () => {
    document.body.classList.remove('intro-active');
    introBurst.classList.add('is-skipped');
    window.setTimeout(() => introBurst.remove(), 500);
  };
  introSkip?.addEventListener('click', finishIntro);
  window.setTimeout(finishIntro, 10200);
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

const flowerHug = document.querySelector('.flower-hug');
const flowerSection = document.querySelector('.flower-section');
if (flowerHug && flowerSection && 'IntersectionObserver' in window) {
      const nextSection = flowerSection.nextElementSibling;
  let flowerTimer;
  let bubbleTimer;

  const flowerObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      clearTimeout(flowerTimer);
      clearTimeout(bubbleTimer);
      flowerSection.classList.add('is-visible');
      flowerSection.classList.remove('bubbles-active');
      flowerHug.classList.remove('is-visible');
      void flowerHug.offsetWidth;
      flowerHug.classList.add('is-visible');

      flowerTimer = setTimeout(() => {
        if (!flowerSection.classList.contains('is-visible')) return;
        flowerSection.classList.add('bubbles-active');
        bubbleTimer = setTimeout(() => {
          if (nextSection && flowerSection.classList.contains('is-visible')) {
            window.scrollTo({ top: nextSection.offsetTop, behavior: 'smooth' });
          }
        }, 3600);
      }, 5000);
    } else {
      clearTimeout(flowerTimer);
      clearTimeout(bubbleTimer);
      flowerSection.classList.remove('is-visible');
      flowerSection.classList.remove('bubbles-active');
      flowerHug.classList.remove('is-visible');
    }
  }, { threshold: 0.05 });
  flowerObserver.observe(flowerSection);
}

const principleItems = document.querySelectorAll('.principle');
const principleImages = document.querySelectorAll('.principle-image');
if (principleItems.length && principleImages.length && 'IntersectionObserver' in window) {
  const principleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const key = entry.target.dataset.principle;
      principleItems.forEach((item) => item.classList.toggle('is-active', item === entry.target));
      principleImages.forEach((image) => image.classList.toggle('is-active', image.dataset.principleImage === key));
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
const authViews = document.querySelectorAll('[data-auth-view]');
const authStep = authModal?.querySelector('.auth-step');
const authPanelKicker = authModal?.querySelector('.auth-panel-kicker');
const authPanel = authModal?.querySelector('.auth-panel');
const authScrollbarThumb = authModal?.querySelector('.auth-scrollbar span');
const signupForm = document.querySelector('#signup-form');
const signupSuccess = document.querySelector('#auth-success');
const loginForm = document.querySelector('#login-form');
const loginNote = document.querySelector('#login-note');
let authCloseTimer;
let resetSkills = () => {};
let resetLooking = () => {};
let resetPhoto = () => {};

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
    if (!skillsPicker.contains(event.target)) {
      skillsPicker.classList.remove('is-open');
      skillsSearch?.setAttribute('aria-expanded', 'false');
    } else skillsSearch?.setAttribute('aria-expanded', 'true');
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
    if (!lookingPicker.contains(event.target)) {
      lookingPicker.classList.remove('is-open');
      lookingSearch?.setAttribute('aria-expanded', 'false');
    } else lookingSearch?.setAttribute('aria-expanded', 'true');
  });
  renderLooking();
}

if (authCta && authModal) {
  authCta.classList.add('auth-trigger');
  authCta.setAttribute('href', '/auth.html');
  authCta.setAttribute('aria-haspopup', 'dialog');
  authCta.innerHTML = 'START SWIPING <span class="button-arrows">→</span>';
}

const resetSignup = () => {
  signupForm?.reset();
  resetSkills();
  resetLooking();
  resetPhoto();
  signupForm?.removeAttribute('hidden');
  signupSuccess?.setAttribute('hidden', '');
  const backButton = authModal?.querySelector('.auth-back-trigger');
  if (backButton) backButton.removeAttribute('hidden');
};

const randomCredential = (characters, length) => {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => characters[value % characters.length]).join('');
};

const createMemberCredentials = () => ({
  password: `${randomCredential('ABCDEFGHJKLMNPQRSTUVWXYZ', 4)}-${randomCredential('abcdefghijkmnopqrstuvwxyz', 4)}-${randomCredential('23456789', 4)}!`,
});

const signupFeedback = signupForm ? document.createElement('p') : null;
if (signupFeedback && signupForm) {
  signupFeedback.className = 'auth-note';
  signupFeedback.id = 'signup-feedback';
  signupFeedback.setAttribute('aria-live', 'polite');
  signupForm.setAttribute('novalidate', '');
  signupForm.after(signupFeedback);
}

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

const setAuthView = (view) => {
  authViews.forEach((item) => {
    const isActive = item.dataset.authView === view;
    item.classList.toggle('is-active', isActive);
    item.toggleAttribute('hidden', !isActive);
  });
  if (authStep) authStep.textContent = view === 'login' ? '01 / 02' : '02 / 02';
  if (authPanelKicker) authPanelKicker.textContent = view === 'login' ? 'WELCOME IN' : 'MEMBER APPLICATION';
  if (view === 'signup') signupForm?.querySelector('input')?.focus();
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
  resetSignup();
  setAuthView('login');
  authModal.removeAttribute('hidden');
  document.body.classList.add('auth-open');
  window.requestAnimationFrame(() => authModal.classList.add('is-open'));
  window.setTimeout(() => authModal.querySelector('input')?.focus(), 350);
};

const closeAuth = () => {
  if (!authModal) return;
  if (document.body.classList.contains('auth-page')) {
    window.location.href = '/';
    return;
  }
  authModal.classList.remove('is-open');
  document.body.classList.remove('auth-open');
  authCloseTimer = window.setTimeout(() => authModal.setAttribute('hidden', ''), 420);
  authCta?.focus();
};

authModal?.querySelector('.auth-close')?.addEventListener('click', closeAuth);
authModal?.querySelector('[data-auth-close]')?.addEventListener('click', closeAuth);
authModal?.querySelector('.auth-create-trigger')?.addEventListener('click', () => setAuthView('signup'));
authModal?.querySelector('.auth-back-trigger')?.addEventListener('click', () => setAuthView('login'));
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
    // Keep the exact password the member just proved, including for accounts
    // created before the private credentials table was added.
    await saveLoginCredentials(data.user.id, data.user.email || email, password);
    const pending = JSON.parse(window.localStorage.getItem('brivia-pending-profile') || 'null');
    const pendingBelongsToUser = pending?.email?.toLowerCase() === data.user?.email?.toLowerCase();
    if (pending && data.user && pendingBelongsToUser) {
      const { error: profileError } = await saveProfile(data.user.id, pending, null);
      if (profileError) throw profileError;
      window.localStorage.removeItem('brivia-pending-profile');
      window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...pending, id: data.user.id, loginPassword: pending.loginPassword || password }));
    } else if (pending && !pendingBelongsToUser) {
      window.localStorage.removeItem('brivia-pending-profile');
    }
    // The password just accepted by Supabase is the source of truth. Keep it
    // in the local profile as an immediate fallback until the private table is
    // available (and so an old cached password can never remain displayed).
    const currentCachedProfile = JSON.parse(window.localStorage.getItem('brivia-member-profile') || 'null') || {};
    window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...currentCachedProfile, id: data.user.id, email: data.user.email || email, loginPassword: password }));
    window.location.href = '/app.html';
  } catch (error) {
    if (loginNote) loginNote.textContent = error.message || 'Could not sign you in. Check your email and password.';
  } finally {
    if (submit) submit.disabled = false;
  }
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
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
  const profile = Object.fromEntries(new FormData(signupForm).entries());
  const photoFile = signupForm.querySelector('.photo-input')?.files?.[0] || null;
  profile.photoName = photoFile?.name || '';
  if (photoFile) {
    try { profile.photoUrl = await compressedImageDataUrl(photoFile); } catch { profile.photoUrl = ''; }
  }
  const credentials = createMemberCredentials();
  profile.loginPassword = credentials.password;
  const submit = signupForm.querySelector('.auth-submit');
  if (submit) submit.disabled = true;
  if (signupFeedback) signupFeedback.textContent = 'Saving your profile...';
  try {
    if (!supabaseReady || !supabase) throw new Error('Supabase is not configured.');
    let userId = '';
    let sessionAvailable = false;
    const { data, error } = await supabase.auth.signUp({ email: profile.email, password: credentials.password, options: { data: { name: profile.name } } });
    if (error) throw error;
    userId = data.user?.id || '';
    sessionAvailable = Boolean(data.session);
    if (userId && sessionAvailable) {
      const { error: profileError } = await saveProfile(userId, profile, photoFile);
      if (profileError) throw profileError;
    } else if (userId) {
      window.localStorage.setItem('brivia-pending-profile', JSON.stringify(profile));
    }
    window.localStorage.setItem('brivia-member-profile', JSON.stringify({ ...profile, id: userId }));
    const accountEmail = signupSuccess?.querySelector('[data-credential="account-email"]');
    const memberPassword = signupSuccess?.querySelector('[data-credential="member-password"]');
    if (accountEmail) accountEmail.textContent = profile.email;
    if (memberPassword) memberPassword.textContent = credentials.password;
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && authModal?.classList.contains('is-open')) closeAuth();
});
