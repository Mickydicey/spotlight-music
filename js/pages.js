// ===================================
// PAGE LOADERS
// Each function loads data for a specific page
// ===================================

// ===== HOMEPAGE LOADER =====
async function loadHomepage() {
    // Load featured article
    const featured = await getFeaturedArticle();
    if (featured) {
        const featuredEl = document.getElementById('homeFeaturedStory');
        if (featuredEl) {
            featuredEl.href = `pages/article.html?slug=${featured.slug}`;
            featuredEl.innerHTML = `
                <div class="featured-story-image" style="background: ${featured.cover_gradient};">
                    <span class="featured-badge">FEATURED SPOTLIGHT</span>
                    <div class="featured-artist-name">${featured.artists ? featured.artists.name.toUpperCase() : ''}</div>
                </div>
                <div class="featured-story-content">
                    <span class="story-category">${featured.category}</span>
                    <h2 class="featured-story-title">${featured.title}</h2>
                    <p class="featured-story-excerpt">${featured.excerpt}</p>
                    <div class="featured-story-meta">
                        <div class="story-author">
                            <div class="story-author-avatar">S</div>
                            <div>
                                <span class="story-author-name">SpotLight Editorial</span>
                                <span class="story-date">${timeAgo(featured.created_at)} · ${featured.read_time} min read</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Load latest stories (skip the featured one)
    const articles = await getAllArticles();
    const nonFeatured = articles.filter(a => !a.is_featured).slice(0, 3);
    const grid = document.getElementById('homeLatestStories');
    if (grid && nonFeatured.length > 0) {
        grid.innerHTML = nonFeatured.map(article => `
            <a href="pages/article.html?slug=${article.slug}" class="story-card">
                <div class="story-card-image" style="background: ${article.cover_gradient};">
                    <span class="story-card-tag">${article.tag || article.category}</span>
                </div>
                <div class="story-card-content">
                    <h3 class="story-card-title">${article.title}</h3>
                    <p class="story-card-excerpt">${article.excerpt}</p>
                    <div class="story-card-meta">
                        <span>${article.read_time} min read</span>
                        <span class="dot-sep"></span>
                        <span>${timeAgo(article.created_at)}</span>
                    </div>
                </div>
            </a>
        `).join('');
    }

    // Load spotlighted artists
    const artists = await getAllArtists();
    const spotlightGrid = document.getElementById('homeSpotlightArtists');
    if (spotlightGrid && artists.length > 0) {
        spotlightGrid.innerHTML = artists.slice(0, 4).map(artist => `
            <a href="pages/artist-profile.html?slug=${artist.slug}" class="spotlight-artist">
                <div class="spotlight-artist-img" style="background: ${artist.color_gradient};">
                    <span>${artist.initial}</span>
                </div>
                <div class="spotlight-artist-info">
                    <h3>${artist.name}</h3>
                    <p>${artist.genre} · ${artist.city.split(',')[0]}</p>
                </div>
            </a>
        `).join('');
    }
}

// ===== STORIES PAGE LOADER =====
async function loadStoriesPage() {
    // Load featured article
    const featured = await getFeaturedArticle();
    const featuredEl = document.getElementById('storiesFeatured');
    if (featuredEl && featured) {
        featuredEl.href = `article.html?slug=${featured.slug}`;
        featuredEl.innerHTML = `
            <div class="featured-story-image" style="background: ${featured.cover_gradient};">
                <span class="featured-badge">FEATURED SPOTLIGHT</span>
                <div class="featured-artist-name">${featured.artists ? featured.artists.name.toUpperCase() : ''}</div>
            </div>
            <div class="featured-story-content">
                <span class="story-category">${featured.category}</span>
                <h2 class="featured-story-title">${featured.title}</h2>
                <p class="featured-story-excerpt">${featured.excerpt}</p>
                <div class="featured-story-meta">
                    <div class="story-author">
                        <div class="story-author-avatar">S</div>
                        <div>
                            <span class="story-author-name">SpotLight Editorial</span>
                            <span class="story-date">${timeAgo(featured.created_at)} · ${featured.read_time} min read</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load all articles grid
    const articles = await getAllArticles();
    const nonFeatured = articles.filter(a => !a.is_featured);
    const grid = document.getElementById('storiesGrid');
    if (grid && nonFeatured.length > 0) {
        grid.innerHTML = nonFeatured.map(article => `
            <a href="article.html?slug=${article.slug}" class="story-card">
                <div class="story-card-image" style="background: ${article.cover_gradient};">
                    <span class="story-card-tag">${article.tag || article.category}</span>
                </div>
                <div class="story-card-content">
                    <h3 class="story-card-title">${article.title}</h3>
                    <p class="story-card-excerpt">${article.excerpt}</p>
                    <div class="story-card-meta">
                        <span>${article.read_time} min read</span>
                        <span class="dot-sep"></span>
                        <span>${timeAgo(article.created_at)}</span>
                    </div>
                </div>
            </a>
        `).join('');
    } else if (grid) {
        grid.innerHTML = '<p style="color: var(--text-3); grid-column: 1/-1; text-align: center; padding: 40px;">No stories yet. Check back soon!</p>';
    }
}

// ===== ARTICLE PAGE LOADER =====
async function loadArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'the-voice-from-enugu';

    const article = await getArticleBySlug(slug);
    if (!article) {
        document.querySelector('.article-page').innerHTML = `
            <div class="container" style="padding: 200px 20px; text-align: center;">
                <h1>Article not found</h1>
                <p style="margin: 20px 0;">This story doesn't exist yet.</p>
                <a href="stories.html" class="btn btn-primary">Back to Stories</a>
            </div>
        `;
        return;
    }

    // Update page title
    document.title = `${article.title} — SpotLight`;

    // Update header
    const headerBg = document.querySelector('.article-header-bg');
    if (headerBg) headerBg.style.background = article.cover_gradient;

    const titleEl = document.querySelector('.article-title');
    if (titleEl) titleEl.textContent = article.title;

    const subtitleEl = document.querySelector('.article-subtitle');
    if (subtitleEl) subtitleEl.textContent = article.subtitle;

    const categoryEl = document.querySelector('.article-category-tag');
    if (categoryEl) categoryEl.textContent = article.category;

    const dateEl = document.querySelector('.article-date-text');
    if (dateEl) dateEl.textContent = `Published ${new Date(article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${article.read_time} min read`;

    // Build article body from content
    const bodyEl = document.querySelector('.article-body');
    if (bodyEl && article.content) {
        const paragraphs = article.content.split('\n\n').filter(p => p.trim());
        let html = '';
        let isFirst = true;

        paragraphs.forEach((para, i) => {
            const trimmed = para.trim();
            if (trimmed.startsWith('## ')) {
                html += `<h2>${trimmed.substring(3)}</h2>`;
            } else if (isFirst) {
                html += `<p class="article-lead">${formatParagraph(trimmed)}</p>`;
                isFirst = false;
            } else {
                html += `<p>${formatParagraph(trimmed)}</p>`;
            }

            // Add track embeds after certain paragraphs if artist has tracks
            if (i === 2 && article.artist_tracks && article.artist_tracks.length > 0) {
                const track = article.artist_tracks[0];
                html += buildTrackEmbed(track, 'FEATURED TRACK', article.artists.name);
            }
            if (i === 5 && article.artist_tracks && article.artist_tracks.length > 1) {
                const track = article.artist_tracks[1];
                html += buildTrackEmbed(track, 'ALSO LISTEN', article.artists.name);
            }
        });

        html += `
            <div class="article-footer-tags">
                <span class="article-tag">#${article.category.replace(/\s/g, '')}</span>
                <span class="article-tag">#Naija</span>
                <span class="article-tag">#NewMusic</span>
            </div>
        `;

        bodyEl.innerHTML = html;
    }

    // Update sidebar artist card
    if (article.artists) {
        const artistCard = document.querySelector('.sidebar-artist-card');
        if (artistCard) {
            artistCard.href = `artist-profile.html?slug=${article.artists.slug}`;
            artistCard.innerHTML = `
                <div class="sidebar-artist-img" style="background: ${article.artists.color_gradient};">
                    <span>${article.artists.initial}</span>
                </div>
                <div class="sidebar-artist-info">
                    <h4>${article.artists.name}</h4>
                    <p>${article.artists.city}</p>
                    <div class="sidebar-artist-stats">
                        <span>${article.artist_tracks ? article.artist_tracks.length : 0} tracks</span>
                    </div>
                </div>
                <div class="sidebar-view-profile">View Profile →</div>
            `;
        }
    }

    // Load related stories
    const allArticles = await getAllArticles();
    const related = allArticles.filter(a => a.slug !== slug).slice(0, 2);
    const relatedContainer = document.querySelector('.sidebar-block:nth-child(2)');
    if (relatedContainer && related.length > 0) {
        relatedContainer.innerHTML = `
            <span class="sidebar-label">RELATED STORIES</span>
            ${related.map(a => `
                <a href="article.html?slug=${a.slug}" class="sidebar-related">
                    <div class="sidebar-related-img" style="background: ${a.cover_gradient};"></div>
                    <div>
                        <h5>${a.title}</h5>
                        <span>${a.read_time} min read</span>
                    </div>
                </a>
            `).join('')}
        `;
    }

    // Attach play buttons after content loads
    initPlayButtons();
}

function buildTrackEmbed(track, label, artistName) {
    // Find the track index in the loaded TRACKS array
    const trackIndex = TRACKS.findIndex(t => t.id === track.id);
    return `
        <div class="article-track-embed">
            <div class="embed-header">
                <span class="embed-label">${label}</span>
                <h3 class="embed-title">Listen: "${track.title}"</h3>
            </div>
            <div class="embed-player">
                <div class="embed-art" style="background: ${track.color_gradient};">
                    <button class="embed-play-btn" data-track-index="${trackIndex}">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
                <div class="embed-info">
                    <span class="embed-artist-name">${artistName}</span>
                    <span class="embed-track-name">${track.title}</span>
                    <span class="embed-track-meta">${track.genre} · ${track.duration}</span>
                </div>
            </div>
        </div>
    `;
}

function formatParagraph(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// ===== ARTISTS DIRECTORY LOADER =====
async function loadArtistsPage() {
    const artists = await getAllArtists();
    const grid = document.getElementById('artistsGrid');
    if (grid && artists.length > 0) {
        grid.innerHTML = artists.map(artist => {
            const badges = ['TRENDING', 'EDITOR\'S PICK', 'RISING', 'NEW', 'SPOTLIGHTED', 'VERIFIED'];
            const badge = artist.is_verified ? 'VERIFIED' : badges[artist.id % badges.length];
            return `
                <a href="artist-profile.html?slug=${artist.slug}" class="artist-directory-card">
                    <div class="artist-directory-img" style="background: ${artist.color_gradient};">
                        <span class="artist-directory-badge">${badge}</span>
                        <div class="artist-directory-initial">${artist.initial}</div>
                    </div>
                    <div class="artist-directory-info">
                        <h3>${artist.name}</h3>
                        <p class="artist-directory-meta">${artist.genre} · ${artist.city.split(',')[0]}</p>
                        <div class="artist-directory-stats">
                            <span>${artist.play_count} plays</span>
                            <span class="dot-sep"></span>
                            <span>View profile</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
}

// ===== ARTIST PROFILE LOADER =====
async function loadArtistProfilePage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'chinemerem';

    const artist = await getArtistBySlug(slug);
    if (!artist) {
        document.body.innerHTML = '<div style="padding: 200px 20px; text-align: center;"><h1>Artist not found</h1><a href="artists.html">Back to Artists</a></div>';
        return;
    }

    document.title = `${artist.name} — SpotLight`;

    // Update hero
    const heroBg = document.querySelector('.profile-hero-bg');
    if (heroBg) heroBg.style.background = artist.color_gradient;

    const avatar = document.querySelector('.profile-avatar-lg');
    if (avatar) {
        avatar.style.background = artist.color_gradient;
        avatar.innerHTML = `<span>${artist.initial}</span>`;
    }

    const nameEl = document.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = artist.name;

    const taglineEl = document.querySelector('.profile-tagline');
    if (taglineEl) taglineEl.textContent = `${artist.genre} · ${artist.city}`;

    // Load artist's tracks
    const tracks = await getTracksByArtistId(artist.id);
    const tracksList = document.querySelector('.track-list-premium');
    if (tracksList && tracks.length > 0) {
        tracksList.innerHTML = tracks.map((track, i) => {
            // Find index in main TRACKS array
            const globalIndex = TRACKS.findIndex(t => t.id === track.id);
            return `
                <div class="track-row">
                    <span class="track-rank">${String(i + 1).padStart(2, '0')}</span>
                    <div class="track-thumb" style="background: ${track.color_gradient};"></div>
                    <div class="track-main">
                        <h4>${track.title}</h4>
                        <p>${artist.name}</p>
                    </div>
                    <span class="track-tag">${track.genre}</span>
                    <span class="track-len">${track.duration}</span>
                    <button class="track-btn-play" data-track-index="${globalIndex}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
            `;
        }).join('');
    } else if (tracksList) {
        tracksList.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-3);">No tracks yet</div>';
    }

    // Update bio in sidebar
    const bioEl = document.querySelector('.profile-bio-text');
    if (bioEl) bioEl.textContent = artist.bio || 'No bio available yet.';

    // Update social links
    if (artist.instagram) {
        const igLink = document.querySelector('.profile-side-block a[href="#"]');
        if (igLink) {
            const span = igLink.querySelector('span:last-child');
            if (span) span.textContent = artist.instagram;
        }
    }

    // Attach play buttons after content loads
    initPlayButtons();
}

// ===== LISTEN PAGE LOADER =====
async function loadListenPage() {
    const tracks = await getAllTracks();
    const grid = document.getElementById('listenGrid');
    if (grid && tracks.length > 0) {
        grid.innerHTML = tracks.map((track, i) => `
            <div class="listen-card">
                <div class="listen-card-art" style="background: ${track.color_gradient};">
                    <span class="listen-card-genre">${track.genre}</span>
                    <button class="listen-card-play" data-track-index="${i}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
                <div class="listen-card-info">
                    <h3>${track.title}</h3>
                    <p class="listen-card-artist">${track.artists ? track.artists.name : 'Unknown'}</p>
                </div>
            </div>
        `).join('');
    }
}

// ===== TIME AGO HELPER =====
function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return 'just now';
}

// ===== AUTO-DETECT WHICH PAGE WE'RE ON =====
window.addEventListener('DOMContentLoaded', async () => {
    // Wait a tiny moment for tracks to load
    setTimeout(async () => {
        const path = window.location.pathname;

        if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
            await loadHomepage();
        } else if (path.includes('stories.html')) {
            await loadStoriesPage();
        } else if (path.includes('article.html')) {
            await loadArticlePage();
        } else if (path.includes('artists.html')) {
            await loadArtistsPage();
        } else if (path.includes('artist-profile.html')) {
            await loadArtistProfilePage();
        } else if (path.includes('listen.html')) {
            await loadListenPage();
        }

        // Re-init play buttons after content is loaded
        setTimeout(initPlayButtons, 500);
    }, 300);
});