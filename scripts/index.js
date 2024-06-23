document.addEventListener('DOMContentLoaded', function () {

    const sessionNameInput = document.getElementById('inputSessionName');
    const createSessionBtn = document.getElementById('create-session-btn');
    const sessionsListDiv = document.getElementById('sessions-list');
    const sessionsTbody = document.getElementById('sessions-tbody');

    const checkAuth = async () => {
        const userSession = localStorage.getItem('userSession');    
        if (userSession) {
            loadSessions();
        } 
    };

    createSessionBtn.addEventListener('click', async () => {

        if (!sessionNameInput.value) {
            alert('Session name is required.');
            return;
        }

        if (!_supabase) {
            console.error('Supabase is not defined');
            return;
        }
        const { data, error } = await _supabase
            .from('play_sessions')
            .insert([{ name: sessionNameInput.value }]).select();
        if (error) {
            console.error(error);
        } else {
            const sessionId = data[0].id;
            window.location.href = `/pages/session.html?sessionId=${sessionId}`;
        }
    });

    const loadSessions = async () => {
        const { data, error } = await _supabase
            .from('play_sessions')
            .select('*');
        if (error) {
            console.error(error);
        } else {
            sessionsTbody.innerHTML = '';
            data.forEach(session => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${session.name}</td>
                    <td>${new Date(session.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteSession('${session.id}')">Delete</button>
                        <a class="btn btn-info btn-sm" href="/pages/session.html?sessionId=${session.id}">Join Session</a>
                        <button class="btn btn-warning btn-sm" onclick="copySessionLink('${session.id}')">Copy</button>
                    </td>
                `;
                sessionsTbody.appendChild(tr);
            });
        }
    };

    window.deleteSession = async (sessionId) => {
        const { error } = await _supabase
            .from('play_sessions')
            .delete()
            .eq('id', sessionId);
        if (error) {
            console.error(error);
        } else {
            loadSessions();
        }
    };

    window.copySessionLink = (sessionId) => {
        const link = `${window.location.origin}/pages/storypoint.html?sessionId=${sessionId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Session link copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    checkAuth();
});

function handleLogin() {
    // Get email and password values
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;

    // Use Supabase to sign in with email and password
    _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    }).then(({ data, error }) => {
        if (error) {
            console.error('Error logging in:', error.message);
            alert('Invalid email or password. Please try again.');
        } else {
            isAuthenticated = true;
            // Store session information in localStorage
            localStorage.setItem('userSession', JSON.stringify(data));
            // Update avatar image
            document.getElementById('userAvatar').src = '/assets/user.png';
            // Redirect to the game game page
            //window.location.href = '/pages/game_auth.html';
            if (isAuthenticated) {
                var loginModel = document.getElementById('loginModel')
                if (loginModel) {
                    loginModel.style.display = 'none';
                }
                window.location.href = 'index.html';
            } else {
                document.getElementById('no-auth-content').style.display = 'block';
            }
        }
    }).catch((error) => {
        console.error('Error logging in:', error.message);
        alert('An error occurred. Please try again.');
    });
}

function checkLoginOnLogin() {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        // User is logged in, update avatar and redirect to the game game page
        document.getElementById('userAvatar').src = '/assets/user.png';
        //window.location.href = '/pages/game_auth.html';
        if (isAuthenticated) {
            document.getElementById('auth-content').style.display = 'block';
        } else {
            document.getElementById('no-auth-content').style.display = 'block';
        }
    }
}



function handleSignup() {
    var email = document.getElementById('registerEmail').value;
    var password = document.getElementById('registerPassword').value;

    if (!email || !password) {
        alert('Email and password are required.');
        return;
    }

    // Use Supabase to sign up with email and password
    if (!_supabase) {
        console.error('Supabase is not defined');
        return;
    }
    _supabase.auth.signUp({
        email: email,
        password: password,
    }).then(({ data, error }) => {
        if (error) {
            console.error('Error signing up:', error.message);
            alert('An error occurred. Please try again.');
        } else {
            // Redirect to the login page
            window.location.href = 'index.html';
        }
    });
}

function handleLogout() {
    // Clear user session from localStorage
    localStorage.removeItem('userSession');
    // Optionally, sign out from Supabase

    if (!_supabase) {
        console.error('Supabase is not defined');
        return;
    }
    _supabase.auth.signOut().then(() => {
        // Ensure avatar image is set to nouser.png
        document.getElementById('userAvatar').src = '/assets/nouser.png';
        // Redirect to the login page or home page
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error logging out:', error.message);
    });
}

function createSession() {
    // Use Supabase to create a new session
}