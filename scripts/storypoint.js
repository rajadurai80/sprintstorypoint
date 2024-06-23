var anomLoggedIn = false;

document.addEventListener('DOMContentLoaded', async () => {

    const userJoinButton = document.getElementById('join-in-user');
    const walkOutUserButton = document.getElementById('walk-out-user');
    const anomLoginNameInput = document.getElementById('login-name-anom');
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const storyInfoDiv = document.getElementById('story-info');
    const participantsListDiv = document.getElementById('participants-list');
    const currentUserTile = document.getElementById('current-user-tile');

    var currentStoryId = null;
    var currentUserName = null;


    localStorage.removeItem('participantId');

    //for testing purposes, generate a random participantId
    //localStorage.setItem('participantId', Math.floor(Math.random() * 1000));
    const participantId = localStorage.getItem('participantId');

    sessionStorage.setItem('sessionId', sessionId);
    //const storyId = urlParams.get('storyId');

    if (!sessionId) {
        console.error('Session ID is required.');
        return;
    }

    if (_supabase === null) {
        console.error('Supabase is not defined');
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'none';
        document.getElementById('db-error').style.display = 'block';
        return;
    }

    const sendMessage = async (evnt, pmesg) => {
        const channelB = _supabase.channel(`session-${sessionId}`);

        channelB.subscribe((status) => {
            // Wait for successful connection
            if (status !== 'SUBSCRIBED') {
                console.error('Channel not yet subscribed')
                return null
            }

            // Send a message once the client is subscribed
            channelB.send({
                type: 'broadcast',
                event: evnt,
                payload: { message: pmesg },
            })
        })


        //_supabase.removeChannel(channelB)
    }

    //check if sessionId is valid
    const { data: session, error: sessionError } = await _supabase
        .from('play_sessions')
        .select('id')
        .eq('id', sessionId);
    if (sessionError || session.length === 0) {
        console.error(sessionError);
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'none';
        document.getElementById('no-auth-content-error').style.display = 'block';
        return;
    }

    // Join a room/topic. Can be anything except for 'realtime'.
    const channelA = _supabase.channel(`session-${sessionId}`);

    // Simple function to log any messages we receive
    function messageJoined(payload) {
        loadParticipants();
    }

    function messageLeft(payload) {
        loadParticipants();
    }

    function messageStory(payload) {
        loadStory();
    }

    function messageEstimate(payload) {
        loadParticipants();
    }

    // Subscribe to the Channel
    channelA
        .on(
            'broadcast',
            { event: 'join' },
            (payload) => messageJoined(payload)
        ).
        on(
            'broadcast',
            { event: 'leave' },
            (payload) => messageLeft(payload)
        ).
        on(
            'broadcast',
            { event: 'story' },
            (payload) => messageStory(payload)
        ).
        on(
            'broadcast',
            { event: 'estimate' },
            (payload) => messageEstimate(payload)
        ).
        subscribe()

    if (participantId !== null) {
        //check if participantId exists in session_participants
        const { data: participant, error: participantError } = await _supabase
            .from('session_participants')
            .select('id')
            .eq('session_id', sessionId)
            .eq('user_id', participantId);
        if (participantError || participant.length === 0) {
            //get user name from participants
            const { data: user, error: userError } = await _supabase
                .from('participants')
                .select('name')
                .eq('id', participantId);
            if (userError || user.length === 0) {
                console.error(userError);
                localStorage.removeItem('participantId');
                console.error('User not found');
                document.getElementById('auth-content').style.display = 'none';
                document.getElementById('no-auth-content').style.display = 'block';
                document.getElementById('no-auth-content-error').style.display = 'none';
            } else {
                //add user to session_participants
                const { data, error } = await _supabase
                    .from('session_participants')
                    .insert({ session_id: sessionId, user_id: participantId, user_name: user[0].name })
                    .select();
                if (error) {
                    console.error(error);
                    document.getElementById('auth-content').style.display = 'none';
                    document.getElementById('no-auth-content').style.display = 'none';
                    document.getElementById('no-auth-content-error').style.display = 'block';
                } else {
                    sendMessage('join', 'Joined new user');
                }
            }
        }
    } else {
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'block';
        document.getElementById('no-auth-content-error').style.display = 'none';
    }

    const loadParticipants = async () => {
        const { data, error } = await _supabase
            .from('session_participants')
            .select('*')
            .eq('session_id', sessionId);
        if (error) console.error(error);
        else {
            participantsListDiv.innerHTML = '';
            data.forEach(participant => {
                const imageNumber = Math.floor(Math.random() * 16) + 1;
                const userName = participant.user_name.length > 20 ? participant.user_name.substring(0, 20) : participant.user_name;

                if (participant.user_id === participantId) {
                    if (participant.point !== null && participant.point !== '' && participant.point !== undefined && participant.point >= 0) {
                        currentUserTile.style.backgroundImage = 'none';
                        currentUserTile.innerHTML = `
                            <div class="participant-overlay">
                                <span>${userName}</span>
                            </div>
                            <div class="estimate-display">
                                ${participant.point}
                            </div>
                        `;
                    } else {
                        currentUserTile.style.backgroundImage = `url('/assets/participants/${imageNumber}.png')`;
                        currentUserTile.innerHTML = `<div class="participant-overlay"><span>${userName}</span></div>`;
                    }
                    currentUserName = userName;
                } else {
                    const div = document.createElement('div');
                    div.className = 'participant-tile';
                    if (participant.point !== null && participant.point !== '' && participant.point !== undefined && participant.point >= 0) {
                        var point = '?'
                        if (participant.show_point === true) {
                            point = participant.point;
                        }
                        div.style.backgroundImage = 'none';
                        div.innerHTML = `
                            <div class="participant-overlay">
                                <span>${userName}</span>
                            </div>
                            <div class="estimate-display">
                            ${point}
                            </div>
                        `;
                    } else {
                        div.style.backgroundImage = `url('/assets/participants/${imageNumber}.png')`;
                        div.innerHTML = `<div class="participant-overlay"><span>${userName}</span></div>`;
                    }
                    participantsListDiv.appendChild(div);
                }
            });
        }
    };

    const loadStory = async () => {
        //session_participants containts story_id, get story id from session_participants and get story name from stories
        const { data, error } = await _supabase
            .from('session_participants')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', participantId);

        if (error) console.error(error);
        else {
            const storyId = data[0].story_id;

            if (!storyId) {
                currentStoryId = null;
                //no story selected highlight in red

                storyInfoDiv.innerHTML = `
                <p>Story: <span class="badge badge-sm custom-bage rounded-pill text-bg-danger">No story selected</span>
                     </p>
                `;


            } else {

                currentStoryId = storyId;

                const { data: story, error: storyError } = await _supabase
                    .from('stories')
                    .select('*')
                    .eq('id', storyId);
                if (storyError) console.error(storyError);
                else {
                    storyInfoDiv.innerHTML = `
                    <p>Story: <span class="badge badge-sm custom-bage rounded-pill text-bg-success">${story[0].title}</span></p>
                `;
                }
            }
        }
    }

    const checkParticipant = async () => {
        if (!participantId) {
            document.getElementById('auth-content').style.display = 'none';
            document.getElementById('no-auth-content').style.display = 'block';
        } else {
            const { data, error } = await _supabase
                .from('session_participants')
                .select('*')
                .eq('session_id', sessionId)
                .eq('user_id', participantId);
            if (error || data.length === 0) {
                localStorage.removeItem('participantId');
                console.error('Participant not found');
                console.error(error);

                document.getElementById('auth-content').style.display = 'none';
                document.getElementById('no-auth-content').style.display = 'block';
            } else {
                document.getElementById('auth-content').style.display = 'block';
                document.getElementById('no-auth-content').style.display = 'none';
                loadParticipants();
            }
        }
    };

    userJoinButton.addEventListener('click', async () => {

        if (!anomLoginNameInput.value) {
            alert('Name is required.');
            return;
        }

        anomLoggedIn = true;
        //refesh the page to show the user as logged in
        //sotre the user session in local storage
        //localStorage.setItem('participantId', JSON.stringify(user));

        //userSession = data;

        const { data: userSession, error } = await _supabase
            .from('participants')
            .insert({ name: anomLoginNameInput.value })
            .select();

        if (error) {
            console.error('Anom login error:', error);
        } else {
            localStorage.setItem('participantId', userSession[0].id);

            const { data, error } = await _supabase
                .from('session_participants')
                .insert({ session_id: sessionId, user_id: userSession[0].id, user_name: userSession[0].name })
                .select();
            sendMessage('join', 'Joined new user');

            //location.reload();
        }

    });

    const removeUserFromSession = async () => {
        if (!_supabase) {
            localStorage.removeItem('participantId');
            console.error('Supabase is not defined');
            return;
        }

        const sessionId = sessionStorage.getItem('sessionId');
        const participantId = localStorage.getItem('participantId');

        const { data, error } = await _supabase
            .from('session_participants')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', participantId);
        if (error) {
            console.error(error);
        } else {
            sendMessage('leave', 'Left user'); // Call this before deleting from session_participants in async function
        }

        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'none';
        document.getElementById('no-auth-content-error').style.display = 'none';
        document.getElementById('no-auth-content-logged-out').style.display = 'block';
        //window.location.href = '/index.html';
        //location.reload();
    };

    // Function to update the current user's tile with the selected point
    const updateCurrentUserTile = (point) => {
        const currentUserTile = document.getElementById('current-user-tile');
        currentUserTile.style.backgroundImage = 'none';
        currentUserTile.innerHTML = `
            <div class="participant-overlay">
                <span>${currentUserName}</span>
            </div>
            <div class="estimate-display">
                ${point}
            </div>
        `;
    };

    // Event listener for the button click
    walkOutUserButton.addEventListener('click', async () => {
        await removeUserFromSession();
    });

    // Event listener for the browser close or tab close
    window.addEventListener('beforeunload', async (event) => {
        //await removeUserFromSession();
        // Optional: Show a confirmation dialog to the user
        event.returnValue = 'Are you sure you want to leave?';
    });

    window.submitEstimate = async (estimate) => {
        if (estimate === '') {
            alert('Please enter a valid estimate');
            return;
        }

        if (currentStoryId === null) {
            alert('Please select a story');
            return;
        }
        const { data, error } = await _supabase
            .from('session_participants')
            .update({ point: estimate })
            .eq('session_id', sessionId)
            .eq('user_id', participantId);
        if (error) {
            console.error(error);
        } else {
            sendMessage('estimate', 'Estimate submitted');
        }

        updateCurrentUserTile(estimate);
    };


    //loadParticipants();
    if (participantId) {
        loadStory();
        checkParticipant();
    }
});

function checkStoryPointSession() {
    const participantSession = localStorage.getItem('participantId');
    if (participantSession) {
        // User is logged in, show the avatar dropdown and update the avatar image
        document.getElementById('auth-content').style.display = 'block';
        document.getElementById('no-auth-content').style.display = 'none';
    } else {
        // User is not logged in, ensure avatar image is set to nouser.png
        document.getElementById('auth-content').style.display = 'none';
        document.getElementById('no-auth-content').style.display = 'block';
    }
}
