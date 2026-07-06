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

// ===== MINI PLAYER =====
const miniPlayer = document.getElementById('miniPlayer');
const mpPlayBtn = document.getElementById('mpPlayBtn');
const mpProgress = document.getElementById('mpProgress');
const mpTitle = document.getElementById('mpTitle');
const mpArtist = document.getElementById('mpArtist');
const mpArt = document.getElementById('mpArt');
const mpTime = document.getElementById('mpTime');

const tracks = [
    { title: 'Adanna Rising', artist: 'Chinemerem', art: 'linear-gradient(135deg, #6a1b9a, #2a0845)' },
    { title: 'Voice (EP)', artist: 'Samira Bello', art: 'linear-gradient(135deg, #c026d3, #4a044e)' },
    { title: 'Rise 2 The Top', artist: 'Kelechi Alex', art: 'linear-gradient(135deg, #dc2626, #450a0a)' },
    { title: 'Lagos Nights', artist: 'Tobi Wave', art: 'linear-gradient(135deg, #059669, #064e3b)' },
    { title: 'Silk & Fire', artist: 'Ada Grace', art: 'linear-gradient(135deg, #ea580c, #7c2d12)' }
];

let currentTrack = 0;
let isPlaying = false;
let progress = 0;
let progressInterval;

function loadTrack(index) {
    const track = tracks[index];
    if (mpTitle) mpTitle.textContent = track.title;
    if (mpArtist) mpArtist.textContent = track.artist;
    if (mpArt) mpArt.style.background = track.art;
    progress = 0;
    updateProgress();
}

function updateProgress() {
    if (mpProgress) mpProgress.style.width = progress + '%';
    if (mpTime) {
        const current = Math.floor((progress / 100) * 204);
        const mins = Math.floor(current / 60);
        const secs = current % 60;
        mpTime.textContent = `${mins}:${secs.toString().padStart(2, '0')} / 3:24`;
    }
}

function startProgress() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        progress += 0.5;
        if (progress >= 100) {
            progress = 0;
            nextTrack();
        }
        updateProgress();
    }, 1000);
}

function togglePlayer() {
    if (!miniPlayer.classList.contains('active')) {
        miniPlayer.classList.add('active');
        loadTrack(currentTrack);
    }

    isPlaying = !isPlaying;
    if (mpPlayBtn) {
        mpPlayBtn.innerHTML = isPlaying
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }

    if (isPlaying) startProgress();
    else clearInterval(progressInterval);
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
    if (isPlaying) startProgress();
}

function prevTrack() {
    currentTrack = currentTrack === 0 ? tracks.length - 1 : currentTrack - 1;
    loadTrack(currentTrack);
    if (isPlaying) startProgress();
}

// Attach to fire play buttons
document.querySelectorAll('.fire-play, .genre-play').forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        currentTrack = i % tracks.length;
        if (!isPlaying) togglePlayer();
        else { loadTrack(currentTrack); startProgress(); }
    });
});

// ===== SMOOTH REVEAL =====
const revealElements = document.querySelectorAll('.fire-card, .genre-tile, .artist-tile, .how-card');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, i * 60);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    revealObserver.observe(el);
});

console.log('%c SpotLight loaded 🎧 Naija to the world', 'color:#e94560;font-weight:bold');
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