// ===================================
// SUPABASE CONNECTION
// This is what talks to your database
// ===================================

const SUPABASE_URL = 'https://dhheupxbkfukstxdtfpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoaGV1cHhia2Z1a3N0eGR0ZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTEzNTUsImV4cCI6MjEwMDEyNzM1NX0.JXU2gXD2scEC3038NhfFnLtbJV5tSE5TY1-McFfflO0';

// Initialize Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================================
// DATABASE FUNCTIONS
// These fetch data from your database
// ===================================

// Get all artists
async function getAllArtists() {
    const { data, error } = await db
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching artists:', error);
        return [];
    }
    return data;
}

// Get single artist by slug (like "chinemerem")
async function getArtistBySlug(slug) {
    const { data, error } = await db
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching artist:', error);
        return null;
    }
    return data;
}

// Get all tracks (with artist info joined)
async function getAllTracks() {
    const { data, error } = await db
        .from('tracks')
        .select(`
            *,
            artists (
                id,
                name,
                slug,
                genre,
                city
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tracks:', error);
        return [];
    }
    return data;
}

// Get tracks for a specific artist
async function getTracksByArtistId(artistId) {
    const { data, error } = await db
        .from('tracks')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching artist tracks:', error);
        return [];
    }
    return data;
}

// Get all articles (with featured artist info joined)
async function getAllArticles() {
    const { data, error } = await db
        .from('articles')
        .select(`
            *,
            artists:featured_artist_id (
                id,
                name,
                slug,
                city,
                initial,
                color_gradient
            )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
    return data;
}

// Get featured article (for homepage hero)
async function getFeaturedArticle() {
    const { data, error } = await db
        .from('articles')
        .select(`
            *,
            artists:featured_artist_id (
                id,
                name,
                slug,
                initial,
                color_gradient
            )
        `)
        .eq('is_featured', true)
        .eq('is_published', true)
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching featured article:', error);
        return null;
    }
    return data;
}

// Get single article by slug
async function getArticleBySlug(slug) {
    const { data, error } = await db
        .from('articles')
        .select(`
            *,
            artists:featured_artist_id (
                id,
                name,
                slug,
                city,
                initial,
                color_gradient,
                play_count
            )
        `)
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching article:', error);
        return null;
    }

    // Also get tracks for the featured artist
    if (data && data.artists) {
        const tracks = await getTracksByArtistId(data.artists.id);
        data.artist_tracks = tracks;
    }

    return data;
}

// Increment play count for a track
async function incrementPlayCount(trackId) {
    const { data, error } = await db.rpc('increment_play_count', {
        track_id: trackId
    });
    // If the function doesn't exist yet, just log it
    if (error) console.log('Play tracking:', trackId);
}

// Subscribe to newsletter
async function subscribeToNewsletter(email) {
    const { data, error } = await db
        .from('subscribers')
        .insert([{ email: email }]);

    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Already subscribed!' };
        }
        return { success: false, message: 'Error subscribing. Try again.' };
    }
    return { success: true, message: '✓ Subscribed!' };
}

console.log('%c✅ Supabase connected!', 'color:#10b981;font-weight:bold');