document.addEventListener('DOMContentLoaded', function () {
    // Function to load the header from header.html
    function loadHeader() {
        let headerPath = '';
    
        if (window.location.pathname.includes('pages')) {
            headerPath = '../pages/header.html';
        } else {
            headerPath = 'pages/header.html';
        }

        fetch(headerPath)
            .then(response => response.text())
            .then(data => {
                document.body.insertAdjacentHTML('afterbegin', data);
                updateAvatarImage();
            })
            .catch(error => console.error('Error loading header:', error));
    }

    // Function to check if the user is logged in
    function isUserLoggedIn() {
        // Replace with actual logic to check user's login status

        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            return true;
        } else {
            return false;
        }
    }

    // Function to update avatar image based on login status
    function updateAvatarImage() {
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (isUserLoggedIn()) {
                userAvatar.src = '/assets/user.png'; // Path to the logged-in user's avatar
            } else {
                userAvatar.src = '/assets/nouser.png';
            }
        }
    }

    // Load the header on page load
    loadHeader();
});

function handleLogout() {
    // Replace with actual logout logic
    localStorage.removeItem('userSession');

    if (window.location.pathname.includes('pages')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}
