const SUPABASE_URL = 'https://test.supabase.co';
const SUPABASE_KEY = '';
var _supabase = null;
var isAuthenticated = false;

try {
    const { createClient } = supabase;
    _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    _supabase = null;
}

//document.addEventListener('DOMContentLoaded', function () {
//});

function checkAuth() {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        document.getElementById('auth-content').style.display = 'block';
        document.getElementById('no-auth-content').style.display = 'none';
    } else {
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'block';
        // Only redirect to index.html if not already there to avoid infinite loop
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
}
