// ===================================
// ADMIN PANEL LOGIC
// ===================================

// Wait for Supabase to be ready
const waitForDB = () => new Promise((resolve) => {
    const check = () => {
        if (typeof db !== 'undefined') resolve();
        else setTimeout(check, 100);
    };
    check();
});

// ===== MOBILE SIDEBAR TOGGLE =====
function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.getElementById('adminSidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// ===== AUTHENTICATION =====

async function checkAuth() {
    await waitForDB();
    const { data: { session } } = await db.auth.getSession();

    if (!session) {
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
            return false;
        }
        return false;
    }

    const { data: adminCheck } = await db
        .from('admin_users')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (!adminCheck) {
        alert('You are not authorized as an admin.');
        await db.auth.signOut();
        window.location.href = 'login.html';
        return false;
    }

    const emailEl = document.getElementById('adminEmail');
    if (emailEl) emailEl.textContent = session.user.email;

    const avatarEls = document.querySelectorAll('.admin-user-avatar');
    avatarEls.forEach(el => {
        el.textContent = session.user.email.charAt(0).toUpperCase();
    });

    return true;
}

async function logout() {
    await db.auth.signOut();
    window.location.href = 'login.html';
}

// ===== LOGIN FORM =====

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await waitForDB();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        const errorEl = document.getElementById('loginError');

        btn.disabled = true;
        btn.textContent = 'Signing in...';
        errorEl.style.display = 'none';

        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Sign In';
            return;
        }

        const { data: adminCheck } = await db
            .from('admin_users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (!adminCheck) {
            errorEl.textContent = 'You are not authorized as an admin.';
            errorEl.style.display = 'block';
            await db.auth.signOut();
            btn.disabled = false;
            btn.textContent = 'Sign In';
            return;
        }

        window.location.href = 'index.html';
    });
}

// ===== DASHBOARD =====

async function loadDashboard() {
    const [articles, artists, tracks, subscribers] = await Promise.all([
        db.from('articles').select('id', { count: 'exact', head: true }),
        db.from('artists').select('id', { count: 'exact', head: true }),
        db.from('tracks').select('id', { count: 'exact', head: true }),
        db.from('subscribers').select('id', { count: 'exact', head: true })
    ]);

    document.getElementById('statArticles').textContent = articles.count || 0;
    document.getElementById('statArtists').textContent = artists.count || 0;
    document.getElementById('statTracks').textContent = tracks.count || 0;
    document.getElementById('statSubscribers').textContent = subscribers.count || 0;

    const { data: recentArticles } = await db
        .from('articles')
        .select(`*, artists:featured_artist_id (name)`)
        .order('created_at', { ascending: false })
        .limit(5);

    const table = document.getElementById('recentArticlesTable');
    if (recentArticles && recentArticles.length > 0) {
        table.innerHTML = recentArticles.map(a => `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td data-label="Category">${a.category}</td>
                <td data-label="Artist">${a.artists ? a.artists.name : '—'}</td>
                <td data-label="Published">${new Date(a.created_at).toLocaleDateString()}</td>
                <td class="admin-table-actions">
                    <a href="../pages/article.html?slug=${a.slug}" target="_blank" class="admin-btn admin-btn-ghost admin-btn-small">View</a>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-3);">No articles yet</td></tr>';
    }
}

// ===== ARTICLES PAGE =====

async function loadArticlesPage() {
    const { data: articles } = await db
        .from('articles')
        .select(`*, artists:featured_artist_id (name)`)
        .order('created_at', { ascending: false });

    const table = document.getElementById('articlesTable');
    if (articles && articles.length > 0) {
        table.innerHTML = articles.map(a => `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td data-label="Category">${a.category}</td>
                <td data-label="Artist">${a.artists ? a.artists.name : '—'}</td>
                <td data-label="Published">${new Date(a.created_at).toLocaleDateString()}</td>
                <td class="admin-table-actions">
                    <a href="../pages/article.html?slug=${a.slug}" target="_blank" class="admin-btn admin-btn-ghost admin-btn-small">View</a>
                    <button onclick="deleteArticle(${a.id})" class="admin-btn admin-btn-danger admin-btn-small">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-3);">No articles yet. Click "New Article" to write one!</td></tr>';
    }
}

async function deleteArticle(id) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    const { error } = await db.from('articles').delete().eq('id', id);
    if (error) {
        alert('Error deleting article: ' + error.message);
        return;
    }
    loadArticlesPage();
}

// ===== NEW ARTICLE FORM =====

let quillEditor = null;
let selectedGradient = 'linear-gradient(135deg, #6a1b9a, #2a0845)';
let currentEditorMode = 'rich';

async function initNewArticle() {
    if (document.getElementById('richEditor') && typeof Quill !== 'undefined') {
        quillEditor = new Quill('#richEditor', {
            theme: 'snow',
            placeholder: 'Start writing your article...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });
    }

    const { data: artists } = await db
        .from('artists')
        .select('id, name')
        .order('name');

    const select = document.getElementById('articleArtist');
    if (artists) {
        artists.forEach(a => {
            const option = document.createElement('option');
            option.value = a.id;
            option.textContent = a.name;
            select.appendChild(option);
        });
    }

    document.getElementById('articleTitle').addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        document.getElementById('articleSlug').value = slug;
    });

    document.querySelectorAll('.admin-color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.admin-color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            selectedGradient = swatch.dataset.color;
        });
    });

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEditorMode = tab.dataset.tab;

            if (currentEditorMode === 'rich') {
                document.getElementById('richEditorPanel').style.display = 'block';
                document.getElementById('markdownPanel').style.display = 'none';
            } else {
                document.getElementById('richEditorPanel').style.display = 'none';
                document.getElementById('markdownPanel').style.display = 'block';
            }
        });
    });

    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        let content = '';
        if (currentEditorMode === 'rich') {
            content = quillEditor.root.innerHTML;
        } else {
            content = document.getElementById('markdownEditor').value;
        }

        if (!content || content === '<p><br></p>') {
            showMessage('Please write some content for the article', 'error');
            return;
        }

        const btn = document.getElementById('publishBtn');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        const article = {
            title: document.getElementById('articleTitle').value,
            slug: document.getElementById('articleSlug').value,
            subtitle: document.getElementById('articleSubtitle').value,
            excerpt: document.getElementById('articleExcerpt').value,
            content: content,
            category: document.getElementById('articleCategory').value,
            tag: document.getElementById('articleTag').value,
            cover_gradient: selectedGradient,
            featured_artist_id: document.getElementById('articleArtist').value || null,
            read_time: parseInt(document.getElementById('articleReadTime').value),
            is_featured: document.getElementById('articleFeatured').checked,
            is_published: true
        };

        const { data, error } = await db.from('articles').insert([article]);

        if (error) {
            showMessage('Error: ' + error.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Publish Article';
            return;
        }

        showMessage('✓ Article published successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'articles.html';
        }, 1500);
    });
}

function showMessage(text, type) {
    const msg = document.getElementById('articleMessage');
    msg.textContent = text;
    msg.className = 'admin-message ' + type;
    msg.style.display = 'block';
    msg.scrollIntoView({ behavior: 'smooth' });
}

// ===== ARTISTS PAGE =====

async function loadArtistsPage() {
    const { data: artists } = await db
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

    const table = document.getElementById('artistsTable');
    if (artists && artists.length > 0) {
        table.innerHTML = artists.map(a => `
            <tr>
                <td>
                    <div class="admin-table-artist">
                        <div class="admin-table-avatar" style="background: ${a.color_gradient};">${a.initial}</div>
                        <strong>${a.name}</strong>
                    </div>
                </td>
                <td data-label="Genre">${a.genre}</td>
                <td data-label="City">${a.city}</td>
                <td data-label="Verified">${a.is_verified ? '✓ Yes' : '— No'}</td>
                <td class="admin-table-actions">
                    <a href="../pages/artist-profile.html?slug=${a.slug}" target="_blank" class="admin-btn admin-btn-ghost admin-btn-small">View</a>
                    <button onclick='editArtist(${JSON.stringify(a).replace(/'/g, "&apos;")})' class="admin-btn admin-btn-ghost admin-btn-small">Edit</button>
                    <button onclick="deleteArtist(${a.id})" class="admin-btn admin-btn-danger admin-btn-small">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-3);">No artists yet.</td></tr>';
    }
}

let selectedArtistGradient = 'linear-gradient(135deg, #6a1b9a, #2a0845)';

function openArtistModal(artist = null) {
    document.getElementById('artistModal').style.display = 'flex';
    if (artist) {
        document.getElementById('artistModalTitle').textContent = 'Edit Artist';
        document.getElementById('artistId').value = artist.id;
        document.getElementById('artistName').value = artist.name;
        document.getElementById('artistInitial').value = artist.initial;
        document.getElementById('artistSlug').value = artist.slug;
        document.getElementById('artistGenre').value = artist.genre;
        document.getElementById('artistCity').value = artist.city;
        document.getElementById('artistBio').value = artist.bio || '';
        document.getElementById('artistInstagram').value = artist.instagram || '';
        document.getElementById('artistTwitter').value = artist.twitter || '';
        document.getElementById('artistYoutube').value = artist.youtube || '';
        document.getElementById('artistVerified').checked = artist.is_verified;
        selectedArtistGradient = artist.color_gradient;

        document.querySelectorAll('#artistColorPicker .admin-color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === artist.color_gradient);
        });
    } else {
        document.getElementById('artistModalTitle').textContent = 'Add New Artist';
        document.getElementById('artistForm').reset();
        document.getElementById('artistId').value = '';
        selectedArtistGradient = 'linear-gradient(135deg, #6a1b9a, #2a0845)';
        document.querySelectorAll('#artistColorPicker .admin-color-swatch').forEach((s, i) => {
            s.classList.toggle('active', i === 0);
        });
    }
}

function editArtist(artist) {
    openArtistModal(artist);
}

function closeArtistModal() {
    document.getElementById('artistModal').style.display = 'none';
}

async function deleteArtist(id) {
    if (!confirm('Delete this artist? This will also delete all their tracks!')) return;
    const { error } = await db.from('artists').delete().eq('id', id);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    loadArtistsPage();
}

async function saveArtist(e) {
    e.preventDefault();

    const btn = document.getElementById('saveArtistBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const artist = {
        name: document.getElementById('artistName').value,
        initial: document.getElementById('artistInitial').value.toUpperCase(),
        slug: document.getElementById('artistSlug').value,
        genre: document.getElementById('artistGenre').value,
        city: document.getElementById('artistCity').value,
        bio: document.getElementById('artistBio').value,
        instagram: document.getElementById('artistInstagram').value,
        twitter: document.getElementById('artistTwitter').value,
        youtube: document.getElementById('artistYoutube').value,
        color_gradient: selectedArtistGradient,
        is_verified: document.getElementById('artistVerified').checked
    };

    const artistId = document.getElementById('artistId').value;
    let result;

    if (artistId) {
        result = await db.from('artists').update(artist).eq('id', artistId);
    } else {
        result = await db.from('artists').insert([artist]);
    }

    if (result.error) {
        alert('Error: ' + result.error.message);
        btn.disabled = false;
        btn.textContent = 'Save Artist';
        return;
    }

    closeArtistModal();
    loadArtistsPage();
}

// ===== TRACK FILE UPLOAD =====

let uploadedFileUrl = null;
let uploadedFileDuration = null;

function initTrackFileUpload() {
    const fileInput = document.getElementById('trackFile');
    const dropZone = document.getElementById('fileDropZone');

    if (!fileInput || !dropZone) return;

    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e94560';
        dropZone.style.background = 'rgba(233, 69, 96, 0.05)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById('filePanel').style.display = tabName === 'file' ? 'block' : 'none';
            document.getElementById('urlPanel').style.display = tabName === 'url' ? 'block' : 'none';
        });
    });
}

async function handleFileSelect(file) {
    if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, M4A)');
        return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File too large! Maximum size is 50MB.');
        return;
    }

    try {
        const duration = await getAudioDuration(file);
        uploadedFileDuration = duration;
        document.getElementById('trackDuration').value = duration;
    } catch (err) {
        console.log('Could not detect duration');
    }

    document.getElementById('dropZoneContent').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadedFile').style.display = 'none';

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;

    try {
        const { data, error } = await db.storage
            .from('tracks')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            alert('Upload failed: ' + error.message);
            resetFileUpload();
            return;
        }

        const { data: urlData } = db.storage
            .from('tracks')
            .getPublicUrl(fileName);

        uploadedFileUrl = urlData.publicUrl;
        document.getElementById('trackAudioUrlFromFile').value = uploadedFileUrl;

        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadedFile').style.display = 'block';
        document.getElementById('uploadedName').textContent = file.name;

    } catch (err) {
        alert('Upload error: ' + err.message);
        resetFileUpload();
    }
}

function getAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            const totalSeconds = Math.floor(audio.duration);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            resolve(`${mins}:${secs.toString().padStart(2, '0')}`);
        };
        audio.onerror = () => reject('Could not read duration');
        audio.src = URL.createObjectURL(file);
    });
}

function resetFileUpload() {
    uploadedFileUrl = null;
    const fileInput = document.getElementById('trackFile');
    if (fileInput) fileInput.value = '';
    const urlFromFile = document.getElementById('trackAudioUrlFromFile');
    if (urlFromFile) urlFromFile.value = '';
    const dropContent = document.getElementById('dropZoneContent');
    if (dropContent) dropContent.style.display = 'block';
    const progress = document.getElementById('uploadProgress');
    if (progress) progress.style.display = 'none';
    const uploaded = document.getElementById('uploadedFile');
    if (uploaded) uploaded.style.display = 'none';
}

// ===== TRACKS PAGE =====

async function loadTracksPage() {
    const { data: tracks } = await db
        .from('tracks')
        .select(`*, artists (name)`)
        .order('created_at', { ascending: false });

    const table = document.getElementById('tracksTable');
    if (tracks && tracks.length > 0) {
        table.innerHTML = tracks.map(t => `
            <tr>
                <td>
                    <div class="admin-table-artist">
                        <div class="admin-table-avatar" style="background: ${t.color_gradient};">♪</div>
                        <strong>${t.title}</strong>
                    </div>
                </td>
                <td data-label="Artist">${t.artists ? t.artists.name : '—'}</td>
                <td data-label="Genre">${t.genre}</td>
                <td data-label="Duration">${t.duration}</td>
                <td class="admin-table-actions">
                    <button onclick='editTrack(${JSON.stringify(t).replace(/'/g, "&apos;")})' class="admin-btn admin-btn-ghost admin-btn-small">Edit</button>
                    <button onclick="deleteTrack(${t.id})" class="admin-btn admin-btn-danger admin-btn-small">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-3);">No tracks yet.</td></tr>';
    }

    const { data: artists } = await db.from('artists').select('id, name').order('name');
    const select = document.getElementById('trackArtist');
    if (select) {
        select.innerHTML = '<option value="">Choose artist</option>';
        if (artists) {
            artists.forEach(a => {
                const option = document.createElement('option');
                option.value = a.id;
                option.textContent = a.name;
                select.appendChild(option);
            });
        }
    }
}

let selectedTrackGradient = 'linear-gradient(135deg, #6a1b9a, #2a0845)';

function openTrackModal(track = null) {
    document.getElementById('trackModal').style.display = 'flex';
    resetFileUpload();
    uploadedFileUrl = null;
    
    if (track) {
        document.getElementById('trackModalTitle').textContent = 'Edit Track';
        document.getElementById('trackId').value = track.id;
        document.getElementById('trackTitle').value = track.title;
        document.getElementById('trackArtist').value = track.artist_id;
        document.getElementById('trackGenre').value = track.genre;
        document.getElementById('trackAudioUrl').value = track.audio_url;
        document.getElementById('trackDuration').value = track.duration;
        document.getElementById('trackFeatured').checked = track.is_featured;
        selectedTrackGradient = track.color_gradient;
        
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        const urlTab = document.querySelector('.upload-tab[data-tab="url"]');
        if (urlTab) urlTab.classList.add('active');
        document.getElementById('filePanel').style.display = 'none';
        document.getElementById('urlPanel').style.display = 'block';
        
        document.querySelectorAll('#trackColorPicker .admin-color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === track.color_gradient);
        });
    } else {
        document.getElementById('trackModalTitle').textContent = 'Add New Track';
        document.getElementById('trackForm').reset();
        document.getElementById('trackId').value = '';
        selectedTrackGradient = 'linear-gradient(135deg, #6a1b9a, #2a0845)';
        
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        const fileTab = document.querySelector('.upload-tab[data-tab="file"]');
        if (fileTab) fileTab.classList.add('active');
        document.getElementById('filePanel').style.display = 'block';
        document.getElementById('urlPanel').style.display = 'none';
        
        document.querySelectorAll('#trackColorPicker .admin-color-swatch').forEach((s, i) => {
            s.classList.toggle('active', i === 0);
        });
    }
}

function editTrack(track) {
    openTrackModal(track);
}

function closeTrackModal() {
    document.getElementById('trackModal').style.display = 'none';
}

async function deleteTrack(id) {
    if (!confirm('Delete this track?')) return;
    const { error } = await db.from('tracks').delete().eq('id', id);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    loadTracksPage();
}

async function saveTrack(e) {
    e.preventDefault();

    const btn = document.getElementById('saveTrackBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    let audioUrl = uploadedFileUrl || document.getElementById('trackAudioUrl').value;

    if (!audioUrl) {
        alert('Please upload a file or enter an audio URL');
        btn.disabled = false;
        btn.textContent = 'Save Track';
        return;
    }

    const track = {
        title: document.getElementById('trackTitle').value,
        artist_id: parseInt(document.getElementById('trackArtist').value),
        genre: document.getElementById('trackGenre').value,
        audio_url: audioUrl,
        duration: document.getElementById('trackDuration').value || '3:24',
        color_gradient: selectedTrackGradient,
        is_featured: document.getElementById('trackFeatured').checked
    };

    const trackId = document.getElementById('trackId').value;
    let result;

    if (trackId) {
        result = await db.from('tracks').update(track).eq('id', trackId);
    } else {
        result = await db.from('tracks').insert([track]);
    }

    if (result.error) {
        alert('Error: ' + result.error.message);
        btn.disabled = false;
        btn.textContent = 'Save Track';
        return;
    }

    closeTrackModal();
    loadTracksPage();
}

// ===== INITIALIZE PAGES =====

window.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    if (path.endsWith('login.html')) {
        return;
    }

    const authed = await checkAuth();
    if (!authed) return;

    if (path.endsWith('/admin/') || path.endsWith('/admin/index.html')) {
        loadDashboard();
    } else if (path.endsWith('articles.html')) {
        loadArticlesPage();
    } else if (path.endsWith('new-article.html')) {
        initNewArticle();
    } else if (path.endsWith('/admin/artists.html')) {
        loadArtistsPage();
        document.querySelectorAll('#artistColorPicker .admin-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('#artistColorPicker .admin-color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                selectedArtistGradient = swatch.dataset.color;
            });
        });
        document.getElementById('artistForm').addEventListener('submit', saveArtist);
    } else if (path.endsWith('tracks.html')) {
        loadTracksPage();
        initTrackFileUpload();
        document.querySelectorAll('#trackColorPicker .admin-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('#trackColorPicker .admin-color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                selectedTrackGradient = swatch.dataset.color;
            });
        });
        document.getElementById('trackForm').addEventListener('submit', saveTrack);
    }
});