
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');

    const sessionInfoDiv = document.getElementById('session-info');
    const storyInfoDiv = document.getElementById('story-info');
    const participantsListDiv = document.getElementById('participants-list');

    const storyTitleInput = document.getElementById('story-title');
    const storyDescriptionInput = document.getElementById('story-description');
    const addStoryBtn = document.getElementById('add-story-btn');
    const clearParticipantsBtn = document.getElementById('clear-participants-btn');
    const showParticipantsPointsBtn = document.getElementById('show-participants-points-btn');

    if (_supabase === null) {
        console.error('Supabase is not defined');
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

    const channelMain = _supabase.channel(`session-${sessionId}`);

    var currentStory = null;

    var gameInProgress = false;

    // Simple function to log any messages we receive
    function messageJoined(payload) {
        loadParticipants();
    }

    function messageLeft(payload) {
        loadParticipants();
    }

    // Subscribe to the Channel
    channelMain
        .on(
            'broadcast',
            { event: 'join' },
            (payload) => messageJoined(payload)
        ).
        on(
            'broadcast',
            { event: 'leave' },
            (payload) => messageLeft(payload)
        ).subscribe()

    const loadSessionInfo = async () => {
        const { data, error } = await _supabase
            .from('play_sessions')
            .select('name, created_at')
            .eq('id', sessionId);
        if (error) console.error(error);
        else {
            sessionInfoDiv.innerHTML = `
                <p>Session Name: ${data[0].name}</p>
                <p>Created At: ${new Date(data[0].created_at).toLocaleString()}</p>
            `;
            const roomId = _supabase.channel(`session-${sessionId}`);
        }
    };

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
            });
            
        }
    };

    const displayCurrentStory = async () => {
        storyInfoDiv.innerHTML = `
        Selected Story: ${currentStory.title}
                
                                        <button type="button" class="btn btn-sm btn-outline-danger rounded-pill" onclick="stopGame('${currentStory.id}')">
                            <svg class="icon me-2">
                                <use xlink:href="/node_modules/@coreui/icons/sprites/free.svg#cil-delete"></use>
                            </svg>
                    Delete Story
                        </button>
    `;
    }

    const loadStories = async () => {
        const { data, error } = await _supabase
            .from('stories')
            .select('*')
            .eq('session_id', sessionId);
        if (error) {
            console.error(error);
        } else {
            const storiesTbody = document.getElementById('stories-tbody');
            storiesTbody.innerHTML = '';

            data.forEach(story => {

                if (story.is_active) {
                    currentStory = story;
                    displayCurrentStory();
                }

                const tr = document.createElement('tr');

                const deleteButton = `
                    <button id="deleteBtn-${story.id}" type="button" class="btn btn-sm rounded-pill" onclick="deleteStory('${story.id}')" ${story.is_active ? 'disabled' : ''}>
                        <svg class="icon me-2">
                            <use xlink:href="/node_modules/@coreui/icons/sprites/free.svg#cil-trash"></use>
                        </svg>
                    </button>
                `;

                const startButton = `
                    <button id="startBtn-${story.id}" class="btn ${story.is_active ? 'btn-danger' : 'btn-success'} btn-sm" onclick="startGame('${story.id}','${story.title}')" ${story.is_active ? 'disabled' : ''}>
                        ${story.is_active ? 'InProgress' : 'Start'}
                    </button>
                `;

                tr.innerHTML = `
                    <td class="story-title">
                        ${deleteButton}
                        ${story.title}
                    </td>
                    <td class="story-description">${story.description}</td>
                    <td>
                        ${startButton}
                    </td>
                `;
                storiesTbody.appendChild(tr);
            });
        }
    };

    addStoryBtn.addEventListener('click', async () => {
        const { data, error } = await _supabase
            .from('stories')
            .insert([{ session_id: sessionId, title: storyTitleInput.value, description: storyDescriptionInput.value }]);
        if (error) {
            console.error(error);
        } else {
            loadStories();
        }
    });

    clearParticipantsBtn.addEventListener('click', async () => {
        const { data, error } = await _supabase
            .from('session_participants')
            .delete()
            .eq('session_id', sessionId);
        if (error) {
            console.error(error);
        } else {
            loadParticipants();
        }
    });

    showParticipantsPointsBtn.addEventListener('click', async () => { 
        //update session_participants table with show_points to true
        const { data, error } = await _supabase
            .from('session_participants')
            .update({ show_point: true })
            .eq('session_id', sessionId);
        if (error) {
            console.error(error);
        } else {
            loadParticipants();
            sendMessage('show', 'showing points');
        }
    });

    window.startGame = async (storyId, storyTitle) => {

        if (gameInProgress) {
            alert('Game already in progress');
            return;
        }

        gameInProgress = true;

        // Logic to start the game game for the story
        // Redirect to a game game page or update the UI to show the game game for the story
        //window.location.href = `/pages/storypoint.html?sessionId=${sessionId}&storyId=${storyId}`;
        storyInfoDiv.innerHTML = `
        Selected Story: ${storyTitle}
                
                                        <button type="button" class="btn btn-sm btn-outline-danger rounded-pill" onclick="stopGame('${storyId}')">
                            <svg class="icon me-2">
                                <use xlink:href="/node_modules/@coreui/icons/sprites/free.svg#cil-delete"></use>
                            </svg>
                    Delete Story
                        </button>
    `;

        const startButton = document.getElementById(`startBtn-${storyId}`);
        const deleteButton = document.getElementById(`deleteBtn-${storyId}`);
        if (startButton) {
            startButton.className = 'btn btn-danger btn-sm';
            startButton.textContent = 'InProgress';
            startButton.disabled = true; // Optionally, disable the button after starting the game
            deleteButton.disabled = true;
        }

        //update stories "is_active" to "true"
        const { data, error } = await _supabase
            .from('stories')
            .update({ is_active: true })
            .eq('id', storyId);

        if (error) {
            console.error(error);
        } else {
            //update session_participants table with story_id and point to be null
            const { data: udata, error } = await _supabase
                .from('session_participants')
                .update({ story_id: storyId, point: null, show_point: false })
                .eq('session_id', sessionId);

            if (error) {
                console.error(error);
            }
        }

        sendMessage('story', 'started story game');
    };

    window.stopGame = async (storyId) => {

        gameInProgress = false;
        // Logic to stop the game for the story
        storyInfoDiv.innerHTML = ''; // Clear the current story information

        // Re-enable the start button and update its class and text
        const startButton = document.getElementById(`startBtn-${storyId}`);
        const deleteButton = document.getElementById(`deleteBtn-${storyId}`);
        if (startButton) {
            startButton.className = 'btn btn-success btn-sm';
            startButton.textContent = 'Start';
            startButton.disabled = false;
            deleteButton.disabled = false;
        }
        const { data, error } = await _supabase
            .from('stories')
            .update({ is_active: false })
            .eq('id', storyId);

        if (error) {
            console.error(error);
        } else {
            //update session_participants table with story_id
            const { data: udata, error } = await _supabase
                .from('session_participants')
                .update({ story_id: null, point: null, show_point: false })
                .eq('session_id', sessionId);

            if (error) {
                console.error(error);
            }
        }

        sendMessage('story', 'stopped story game');
    };

    window.deleteStory = async (storyId) => {
        const { data, error } = await _supabase
            .from('stories')
            .delete()
            .eq('id', storyId);
        if (error) {
            console.error(error);
        } else {
            loadStories();
        }
    }

    window.copySessionLink = () => {
        const link = `${window.location.origin}/pages/storypoint.html?sessionId=${sessionId}`;
        navigator.clipboard.writeText(link).then(() => {

            alert('Session link copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    loadSessionInfo();
    loadParticipants();
    loadStories();
});