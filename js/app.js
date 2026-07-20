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
// MEDIA PLAYER - CONNECTED TO DATABASE
// ===================================

let TRACKS = []; // Starts empty, loaded from database

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

// LOAD TRACKS FROM DATABASE
async function loadTracksFromDB() {
    if (typeof getAllTracks !== 'function') {
        console.log('Supabase not loaded yet, using fallback');
        return;
    }

    const dbTracks = await getAllTracks();
    if (dbTracks && dbTracks.length > 0) {
        // Transform database format to player format
        TRACKS = dbTracks.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artists ? track.artists.name : 'Unknown Artist',
            genre: track.genre,
            art: track.color_gradient,
            src: track.audio_url,
            duration: track.duration
        }));
        console.log(`✅ Loaded ${TRACKS.length} tracks from database`);
    }
}

// Audio event listeners
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
    if (!TRACKS || TRACKS.length === 0) {
        console.warn('No tracks loaded yet');
        return;
    }

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
    if (isLoading || TRACKS.length === 0) return;
    if (currentIndex === -1) {
        loadAndPlay(0);
        return;
    }
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
}

function nextTrack() {
    if (isLoading || TRACKS.length === 0) return;
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
    if (isLoading || TRACKS.length === 0) return;
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

// Attach play buttons (after tracks load)
function initPlayButtons() {
    const allPlayButtons = document.querySelectorAll(
        '.embed-play-btn, .listen-card-play, .track-btn-play'
    );
    allPlayButtons.forEach((btn) => {
        // Get track index from data attribute or default to sequential
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const trackIndex = parseInt(btn.dataset.trackIndex || '0');
            loadAndPlay(trackIndex);
        });
    });
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

// ===== NEWSLETTER SIGNUP =====
document.querySelectorAll('.newsletter-form-inline').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const button = form.querySelector('button');
        const email = input.value.trim();

        if (!email) return;

        button.textContent = '...';
        
        if (typeof subscribeToNewsletter === 'function') {
            const result = await subscribeToNewsletter(email);
            button.textContent = result.message;
            if (result.success) {
                input.value = '';
                setTimeout(() => { button.textContent = 'Subscribe'; }, 3000);
            }
        } else {
            button.textContent = '✓ Subscribed';
        }
    });
});

// Initialize everything when page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Load tracks from database first
    await loadTracksFromDB();
    // Then initialize play buttons
    initPlayButtons();
});

console.log('%c🎧 SpotLight — The Voice of New Naija Music', 'color:#e94560;font-weight:bold;font-size:14px');