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

// ===================================
// MEDIA PLAYER
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

const audio = new Audio();
audio.preload = 'metadata';
audio.volume = 0.8;

let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isLoading = false;

const miniPlayer = document.getElementById('miniPlayer');
const mpPlayBtn = document.getElementById('mpPlayBtn');
const mpProgressWrap = document.getElementById('mpProgressWrap');
const mpProgress = document.getElementById('mpProgress');
const mpTitle = document.getElementById('mpTitle');
const mpArtist = document.getElementById('mpArtist');
const mpArt = document.getElementById('mpArt');
const mpTime = document.getElementById('mpTime');

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
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton();
});

audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('ended', () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } else {
        nextTrack();
    }
});

audio.addEventListener('error', () => {
    isLoading = false;
    setPlayButtonLoading(false);
});

if (mpProgressWrap) {
    mpProgressWrap.addEventListener('click', (e) => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const rect = mpProgressWrap.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });
}

function loadAndPlay(index) {
    if (isLoading) return;

    if (index === currentIndex && isPlaying) {
        audio.pause();
        return;
    }

    if (index === currentIndex && !isPlaying && audio.src) {
        audio.play().catch(() => {});
        return;
    }

    currentIndex = index;
    const track = TRACKS[index];
    if (!track) return;

    isLoading = true;

    if (mpTitle) mpTitle.textContent = track.title;
    if (mpArtist) mpArtist.textContent = track.artist;
    if (mpArt) mpArt.style.background = track.art;
    if (mpProgress) mpProgress.style.width = '0%';
    if (mpTime) mpTime.textContent = '0:00 / 0:00';

    if (miniPlayer) miniPlayer.classList.add('active');

    audio.src = track.src;
    audio.load();

    const onReady = () => {
        audio.removeEventListener('canplay', onReady);
        audio.play()
            .then(() => { isLoading = false; })
            .catch(() => { isLoading = false; });
    };
    audio.addEventListener('canplay', onReady);
}

function togglePlayer() {
    if (isLoading) return;
    if (currentIndex === -1) {
        loadAndPlay(0);
        return;
    }
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
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

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Attach play buttons
function initPlayButtons() {
    const allPlayButtons = document.querySelectorAll(
        '.embed-play-btn, .listen-card-play, .track-btn-play'
    );
    allPlayButtons.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
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

// Keyboard
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayer();
    }
});

// Filter chips
document.querySelectorAll('.story-cat-row').forEach(row => {
    row.addEventListener('click', (e) => {
        if (e.target.classList.contains('story-cat')) {
            row.querySelectorAll('.story-cat').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
});

console.log('%c🎧 SpotLight — The Voice of New Naija Music', 'color:#e94560;font-weight:bold;font-size:14px');