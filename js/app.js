// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
}

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('[data-count]').forEach(animateCounter);
            counterObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats-row');
if (heroStats) counterObserver.observe(heroStats);

// ===================================
// MEDIA PLAYER — STABLE VERSION
// ===================================

const TRACKS = [
    {
        id: 1,
        title: 'Adanna Rising',
        artist: 'Chinemerem',
        genre: 'Afrobeats',
        art: 'linear-gradient(135deg, #6a1b9a, #2a0845)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
        id: 2,
        title: 'Voice (EP)',
        artist: 'Samira Bello',
        genre: 'R&B',
        art: 'linear-gradient(135deg, #c026d3, #4a044e)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
        id: 3,
        title: 'Rise 2 The Top',
        artist: 'Kelechi Alex',
        genre: 'Hip-Hop',
        art: 'linear-gradient(135deg, #dc2626, #450a0a)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    },
    {
        id: 4,
        title: 'Lagos Nights',
        artist: 'Tobi Wave',
        genre: 'Amapiano',
        art: 'linear-gradient(135deg, #059669, #064e3b)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    },
    {
        id: 5,
        title: 'Silk & Fire',
        artist: 'Ada Grace',
        genre: 'Alté',
        art: 'linear-gradient(135deg, #ea580c, #7c2d12)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
    },
    {
        id: 6,
        title: 'Owerri Sound',
        artist: 'DJ Kream',
        genre: 'Highlife',
        art: 'linear-gradient(135deg, #0891b2, #164e63)',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
    }
];

// Single audio instance
const audio = new Audio();
audio.preload = 'metadata';
audio.volume = 0.8;

// State
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isLoading = false;      // Prevent rapid clicks
let userInteracted = false; // Track if user has clicked play

// DOM
const miniPlayer = document.getElementById('miniPlayer');
const mpPlayBtn = document.getElementById('mpPlayBtn');
const mpProgressWrap = document.getElementById('mpProgressWrap');
const mpProgress = document.getElementById('mpProgress');
const mpTitle = document.getElementById('mpTitle');
const mpArtist = document.getElementById('mpArtist');
const mpArt = document.getElementById('mpArt');
const mpTime = document.getElementById('mpTime');

// ===== AUDIO EVENTS =====

audio.addEventListener('loadstart', () => {
    isLoading = true;
    setPlayButtonLoading(true);
});

audio.addEventListener('canplay', () => {
    isLoading = false;
    setPlayButtonLoading(false);
});

audio.addEventListener('playing', () => {
    isLoading = false;
    isPlaying = true;
    updatePlayButton();
    highlightActiveCard();
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton();
    highlightActiveCard();
});

audio.addEventListener('timeupdate', () => {
    updateProgress();
});

audio.addEventListener('ended', () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } else {
        nextTrack();
    }
});

// IMPORTANT: Don't auto-skip on errors anymore
audio.addEventListener('error', (e) => {
    isLoading = false;
    setPlayButtonLoading(false);
    console.warn('Audio load issue for:', audio.src);
    // Don't auto-skip - just show error and let user decide
    showToast('⚠️ Track cannot be loaded');
});

audio.addEventListener('stalled', () => {
    console.log('Audio stalled (buffering)');
});

audio.addEventListener('waiting', () => {
    setPlayButtonLoading(true);
});

audio.addEventListener('canplaythrough', () => {
    setPlayButtonLoading(false);
});

// Progress bar click
if (mpProgressWrap) {
    mpProgressWrap.addEventListener('click', (e) => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const rect = mpProgressWrap.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });
}

// ===== CORE PLAYER FUNCTIONS =====

function loadAndPlay(index) {
    // Prevent rapid clicks while a track is loading
    if (isLoading) {
        return;
    }

    // If clicking the SAME track that's already playing → just pause
    if (index === currentIndex && isPlaying) {
        audio.pause();
        return;
    }

    // If clicking the SAME track that's paused → resume
    if (index === currentIndex && !isPlaying && audio.src) {
        audio.play().catch(err => handlePlayError(err));
        return;
    }

    // NEW track — load it
    currentIndex = index;
    const track = TRACKS[index];
    if (!track) return;

    userInteracted = true;
    isLoading = true;

    // Update UI immediately
    if (mpTitle) mpTitle.textContent = track.title;
    if (mpArtist) mpArtist.textContent = track.artist;
    if (mpArt) mpArt.style.background = track.art;
    if (mpProgress) mpProgress.style.width = '0%';
    if (mpTime) mpTime.textContent = '0:00 / 0:00';

    // Show player bar
    if (miniPlayer) miniPlayer.classList.add('active');

    // Load and play
    audio.src = track.src;
    audio.load();

    // Wait for canplay before playing (mobile-safe)
    const onReady = () => {
        audio.removeEventListener('canplay', onReady);
        audio.play()
            .then(() => {
                isLoading = false;
            })
            .catch(err => {
                isLoading = false;
                handlePlayError(err);
            });
    };
    audio.addEventListener('canplay', onReady);
}

function togglePlayer() {
    if (isLoading) return;

    // First time — load first track
    if (currentIndex === -1) {
        loadAndPlay(0);
        return;
    }

    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(err => handlePlayError(err));
    }
}

function nextTrack() {
    if (isLoading) return;
    let next;
    if (isShuffle) {
        do {
            next = Math.floor(Math.random() * TRACKS.length);
        } while (next === currentIndex && TRACKS.length > 1);
    } else {
        next = (currentIndex + 1) % TRACKS.length;
    }
    loadAndPlay(next);
}

function prevTrack() {
    if (isLoading) return;
    // Restart current if more than 3 seconds in
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    const prev = currentIndex <= 0 ? TRACKS.length - 1 : currentIndex - 1;
    loadAndPlay(prev);
}

function setPlayerVolume(v) {
    audio.volume = parseFloat(v);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffleBtn');
    if (btn) btn.classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    const btn = document.getElementById('repeatBtn');
    if (btn) btn.classList.toggle('active', isRepeat);
}

function handlePlayError(err) {
    console.warn('Play blocked:', err.message);
    if (err.name === 'NotAllowedError') {
        showToast('Tap play to start audio');
    }
}

// ===== UI UPDATES =====

function updateProgress() {
    if (!audio.duration || isNaN(audio.duration)) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    if (mpProgress) mpProgress.style.width = percent + '%';

    if (mpTime) {
        const current = formatTime(audio.currentTime);
        const total = formatTime(audio.duration);
        mpTime.textContent = `${current} / ${total}`;
    }
}

function updatePlayButton() {
    if (!mpPlayBtn) return;
    mpPlayBtn.innerHTML = isPlaying
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
}

function setPlayButtonLoading(loading) {
    if (!mpPlayBtn) return;
    if (loading) {
        mpPlayBtn.classList.add('loading');
        mpPlayBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9" stroke-dasharray="45" stroke-linecap="round"/></svg>';
    } else {
        mpPlayBtn.classList.remove('loading');
        updatePlayButton();
    }
}

function highlightActiveCard() {
    // Remove playing state from all buttons
    document.querySelectorAll('.play-active').forEach(btn => {
        btn.classList.remove('play-active');
    });

    // Add to currently playing card
    if (isPlaying && currentIndex >= 0) {
        const allButtons = document.querySelectorAll(
            '.fire-play, .artist-card-play, .beat-play-p, .track-btn-play, .genre-play'
        );
        allButtons.forEach((btn, i) => {
            if (i % TRACKS.length === currentIndex) {
                btn.classList.add('play-active');
            }
        });
    }
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let toastTimeout;
function showToast(msg) {
    const existing = document.querySelector('.player-toast');
    if (existing) existing.remove();
    clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = 'player-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(23, 23, 37, 0.98);
        backdrop-filter: blur(20px);
        color: #fff;
        padding: 12px 22px;
        border-radius: 100px;
        font-size: 0.85rem;
        font-family: 'Inter', sans-serif;
        z-index: 10000;
        border: 1px solid rgba(233, 69, 96, 0.3);
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        animation: toastSlide 0.3s ease;
    `;
    document.body.appendChild(toast);
    toastTimeout = setTimeout(() => toast.remove(), 2000);
}

// ===== ATTACH CLICK HANDLERS =====

function initPlayButtons() {
    const allPlayButtons = document.querySelectorAll(
        '.fire-play, .artist-card-play, .beat-play-p, .track-btn-play, .genre-play'
    );

    allPlayButtons.forEach((btn, i) => {
        // Remove old listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const trackIndex = i % TRACKS.length;
            loadAndPlay(trackIndex);
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayButtons);
} else {
    initPlayButtons();
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayer();
    }
    if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        nextTrack();
    }
    if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        prevTrack();
    }
});

// ===== AUTH TOGGLE =====
document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        document.querySelectorAll('.auth-toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
    });
});

// ===== ROLE SELECT =====
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ===== FILTER CHIPS =====
document.querySelectorAll('.chip-row').forEach(row => {
    row.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
});

// ===== UPLOAD HANDLER =====
function handleUpload(e) {
    e.preventDefault();
    const form = e.target;
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';

    setTimeout(() => {
        form.innerHTML = `
            <div style="text-align:center; padding: 60px 20px;">
                <div style="width:70px; height:70px; margin:0 auto 20px; background:rgba(233,69,96,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e94560" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 style="font-family:'Sora',sans-serif; font-size:1.8rem; font-weight:800; letter-spacing:-0.02em; margin-bottom:10px;">Submission Received</h2>
                <p style="color:#a1a1b0; max-width:400px; margin:0 auto 30px; line-height:1.6;">Your track is now with our curators. We'll notify you within 48 hours via email.</p>
                <a href="../index.html" class="btn btn-primary btn-lg">Back to Home</a>
            </div>
        `;
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
    }, 900);
}

// ===== FILE UPLOAD PREVIEW =====
document.querySelectorAll('.drop-zone input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const zone = input.closest('.drop-zone');
            const title = zone.querySelector('.drop-zone-title');
            const sub = zone.querySelector('.drop-zone-sub');
            const icon = zone.querySelector('.drop-zone-icon');

            title.textContent = e.target.files[0].name;
            sub.innerHTML = '<span style="color:#10b981">✓ File ready to upload</span>';
            icon.style.background = 'rgba(16, 185, 129, 0.1)';
            icon.style.color = '#10b981';
            zone.style.borderColor = '#10b981';
            zone.style.background = 'rgba(16, 185, 129, 0.03)';
        }
    });
});

console.log('%c🎧 SpotLight loaded — Naija to the world', 'color:#e94560;font-weight:bold;font-size:14px');