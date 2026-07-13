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
// REAL AUDIO MEDIA PLAYER
// ===================================

// Track database with REAL audio URLs (free royalty-free music)
const TRACKS = [
    {
        id: 1,
        title: 'Adanna Rising',
        artist: 'Chinemerem',
        genre: 'Afrobeats',
        art: 'linear-gradient(135deg, #6a1b9a, #2a0845)',
        src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'
    },
    {
        id: 2,
        title: 'Voice (EP)',
        artist: 'Samira Bello',
        genre: 'R&B',
        art: 'linear-gradient(135deg, #c026d3, #4a044e)',
        src: 'https://cdn.pixabay.com/download/audio/2023/06/15/audio_88447e769f.mp3'
    },
    {
        id: 3,
        title: 'Rise 2 The Top',
        artist: 'Kelechi Alex',
        genre: 'Hip-Hop',
        art: 'linear-gradient(135deg, #dc2626, #450a0a)',
        src: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3'
    },
    {
        id: 4,
        title: 'Lagos Nights',
        artist: 'Tobi Wave',
        genre: 'Amapiano',
        art: 'linear-gradient(135deg, #059669, #064e3b)',
        src: 'https://cdn.pixabay.com/download/audio/2024/02/05/audio_60fcbeed88.mp3'
    },
    {
        id: 5,
        title: 'Silk & Fire',
        artist: 'Ada Grace',
        genre: 'Alté',
        art: 'linear-gradient(135deg, #ea580c, #7c2d12)',
        src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc76beb.mp3'
    },
    {
        id: 6,
        title: 'Owerri Sound',
        artist: 'DJ Kream',
        genre: 'Highlife',
        art: 'linear-gradient(135deg, #0891b2, #164e63)',
        src: 'https://cdn.pixabay.com/download/audio/2023/03/28/audio_a1b41b0176.mp3'
    }
];

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.8;
        this.audio.volume = this.volume;
        this.isShuffle = false;
        this.isRepeat = false;

        this.initElements();
        this.attachEvents();
    }

    initElements() {
        this.player = document.getElementById('miniPlayer');
        this.playBtn = document.getElementById('mpPlayBtn');
        this.progressBar = document.getElementById('mpProgress');
        this.progressWrap = document.querySelector('.mp-progress');
        this.titleEl = document.getElementById('mpTitle');
        this.artistEl = document.getElementById('mpArtist');
        this.artEl = document.getElementById('mpArt');
        this.timeEl = document.getElementById('mpTime');
    }

    attachEvents() {
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateProgress());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        this.audio.addEventListener('play', () => this.updatePlayButton(true));
        this.audio.addEventListener('pause', () => this.updatePlayButton(false));

        // Progress bar seek
        if (this.progressWrap) {
            this.progressWrap.addEventListener('click', (e) => this.seek(e));
        }

        // Play buttons on cards (fire-play, artist-card-play, beat-play-p, track-btn-play)
        document.querySelectorAll('.fire-play, .artist-card-play, .beat-play-p, .track-btn-play, .genre-play').forEach((btn, i) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const trackIndex = i % TRACKS.length;
                if (this.currentIndex === trackIndex && this.isPlaying) {
                    this.pause();
                } else {
                    this.loadAndPlay(trackIndex);
                }
            });
        });
    }

    loadAndPlay(index) {
        this.currentIndex = index;
        const track = TRACKS[index];

        this.audio.src = track.src;
        this.updateUI(track);
        this.show();

        // Play with error handling
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    this.updatePlayButton(true);
                })
                .catch(err => {
                    console.log('Playback failed:', err);
                    this.showNotification('Click play again to start');
                });
        }
    }

    play() {
        if (!this.audio.src) {
            this.loadAndPlay(0);
            return;
        }
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton(true);
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton(false);
    }

    toggle() {
        if (!this.audio.src) {
            this.loadAndPlay(0);
            return;
        }
        if (this.isPlaying) this.pause();
        else this.play();
    }

    next() {
        let nextIndex;
        if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * TRACKS.length);
        } else {
            nextIndex = (this.currentIndex + 1) % TRACKS.length;
        }
        this.loadAndPlay(nextIndex);
    }

    prev() {
        // If more than 3 seconds in, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        const prevIndex = this.currentIndex === 0 ? TRACKS.length - 1 : this.currentIndex - 1;
        this.loadAndPlay(prevIndex);
    }

    seek(e) {
        if (!this.audio.duration) return;
        const rect = this.progressWrap.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
    }

    updateProgress() {
        if (!this.audio.duration) return;
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        if (this.progressBar) this.progressBar.style.width = percent + '%';

        if (this.timeEl) {
            const current = this.formatTime(this.audio.currentTime);
            const total = this.formatTime(this.audio.duration);
            this.timeEl.textContent = `${current} / ${total}`;
        }
    }

    updateUI(track) {
        if (this.titleEl) this.titleEl.textContent = track.title;
        if (this.artistEl) this.artistEl.textContent = track.artist;
        if (this.artEl) this.artEl.style.background = track.art;

        // Update all play buttons visual state
        this.highlightActiveCard();
    }

    highlightActiveCard() {
        // Reset all
        document.querySelectorAll('.fire-play, .artist-card-play, .beat-play-p, .track-btn-play, .genre-play').forEach((btn, i) => {
            const icon = btn.querySelector('svg path');
            if (icon) {
                if (i === this.currentIndex && this.isPlaying) {
                    icon.setAttribute('d', 'M6 4h4v16H6zM14 4h4v16h-4z');
                } else {
                    icon.setAttribute('d', 'M8 5v14l11-7z');
                }
            }
        });
    }

    updatePlayButton(playing) {
        this.isPlaying = playing;
        if (this.playBtn) {
            this.playBtn.innerHTML = playing
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
        this.highlightActiveCard();
    }

    handleTrackEnd() {
        if (this.isRepeat) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.next();
        }
    }

    handleError(e) {
        console.log('Audio error, trying next track');
        setTimeout(() => this.next(), 1000);
    }

    show() {
        if (this.player) this.player.classList.add('active');
    }

    hide() {
        if (this.player) this.player.classList.remove('active');
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(msg) {
        const toast = document.createElement('div');
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
        setTimeout(() => toast.remove(), 2500);
    }
}

// Initialize player
const player = new MusicPlayer();

// Global functions for HTML onclick
function togglePlayer() { player.toggle(); }
function nextTrack() { player.next(); }
function prevTrack() { player.prev(); }
function setPlayerVolume(v) { player.setVolume(v); }
function toggleShuffle() { 
    player.isShuffle = !player.isShuffle;
    const btn = document.getElementById('shuffleBtn');
    if (btn) btn.classList.toggle('active', player.isShuffle);
}
function toggleRepeat() {
    player.isRepeat = !player.isRepeat;
    const btn = document.getElementById('repeatBtn');
    if (btn) btn.classList.toggle('active', player.isRepeat);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space = play/pause (only if not typing in input)
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        player.toggle();
    }
    // Arrow right = next
    if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        player.next();
    }
    // Arrow left = previous
    if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        player.prev();
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