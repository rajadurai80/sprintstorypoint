/**
 * Room Page Logic for Sprint Story Point
 */

// Parse URL parameters from hash (to survive clean-URL server redirects)
function getUrlParams() {
    const hash = window.location.hash;

    // Parse hash as query string: #room=ABC&secret=XYZ
    const hashParams = new URLSearchParams(hash.substring(1)); // remove the #

    const roomId = hashParams.get('room');
    const roomSecret = hashParams.get('secret');

    return { roomId, roomSecret };
}

// DOM Elements
const elements = {
    // Modal
    nameModal: document.getElementById('name-modal'),
    nameInput: document.getElementById('name-input'),
    joinBtn: document.getElementById('join-btn'),

    // Containers
    roomUI: document.getElementById('room-ui'),
    loadingContainer: document.getElementById('loading-container'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),

    // Header
    roomCode: document.getElementById('room-code'),
    copyLinkBtn: document.getElementById('copy-link-btn'),
    shareBtn: document.getElementById('share-btn'),
    shareMenu: document.getElementById('share-menu'),
    shareSlack: document.getElementById('share-slack'),
    shareTeams: document.getElementById('share-teams'),
    shareEmail: document.getElementById('share-email'),
    shareNative: document.getElementById('share-native'),
    qrBtn: document.getElementById('qr-btn'),
    qrModal: document.getElementById('qr-modal'),
    qrCode: document.getElementById('qr-code'),
    qrRoomCode: document.getElementById('qr-room-code'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),

    // Edit Story Modal
    editStoryModal: document.getElementById('edit-story-modal'),
    editModalTitle: document.getElementById('edit-modal-title'),
    editLockedNotice: document.getElementById('edit-locked-notice'),
    editStoryTitle: document.getElementById('edit-story-title'),
    editStoryNotes: document.getElementById('edit-story-notes'),
    editSaveBtn: document.getElementById('edit-save-btn'),
    editCancelBtn: document.getElementById('edit-cancel-btn'),
    deleteStoryBtn: document.getElementById('delete-story-btn'),

    // Purchase Modal (for AI suggest upsell)
    purchaseModal: document.getElementById('purchase-modal'),
    purchaseCloseBtn: document.getElementById('purchase-close-btn'),
    purchaseUpgradeBtn: document.getElementById('purchase-upgrade-btn'),

    // Fun elements
    confettiContainer: document.getElementById('confetti-container'),
    celebrationOverlay: document.getElementById('celebration-overlay'),
    celebrationEmoji: document.getElementById('celebration-emoji'),
    celebrationText: document.getElementById('celebration-text'),
    celebrationSubtext: document.getElementById('celebration-subtext'),

    // Avatar modal
    avatarModal: document.getElementById('avatar-modal'),
    avatarGrid: document.getElementById('avatar-grid'),
    avatarCancelBtn: document.getElementById('avatar-cancel-btn'),

    // Fortune toast
    fortuneToast: document.getElementById('fortune-toast'),
    fortuneEmoji: document.getElementById('fortune-emoji'),
    fortuneText: document.getElementById('fortune-text'),
    fortuneClose: document.getElementById('fortune-close'),

    // === Focused Layout Elements ===

    // Drawer
    drawer: document.getElementById('drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerToggle: document.getElementById('drawer-toggle'),
    drawerClose: document.getElementById('drawer-close'),
    drawerToggleStories: document.getElementById('drawer-toggle-stories'),
    drawerToggleStoriesCount: document.getElementById('drawer-toggle-stories-count'),
    drawerToggleChat: document.getElementById('drawer-toggle-chat'),
    drawerToggleChatDot: document.getElementById('drawer-toggle-chat-dot'),

    // Drawer Tabs & Panels
    drawerTabs: document.querySelectorAll('.drawer-tab'),
    drawerPanelStories: document.getElementById('drawer-panel-stories'),
    drawerPanelSettings: document.getElementById('drawer-panel-settings'),
    drawerPanelChat: document.getElementById('drawer-panel-chat'),
    drawerChatBadge: document.getElementById('drawer-chat-badge'),

    // Drawer Stories
    drawerStoriesList: document.getElementById('drawer-stories-list'),
    drawerStoryCount: document.getElementById('drawer-story-count'),
    drawerNewStoryInput: document.getElementById('drawer-new-story-input'),
    drawerAddStoryBtn: document.getElementById('drawer-add-story-btn'),
    drawerImportBtn: document.getElementById('drawer-import-btn'),
    drawerImportFileInput: document.getElementById('drawer-import-file-input'),

    // Drawer Settings
    drawerDeckSelect: document.getElementById('drawer-deck-select'),
    drawerFunModeToggle: document.getElementById('drawer-fun-mode-toggle'),
    drawerCustomDeckInput: document.getElementById('drawer-custom-deck-input'),
    drawerCustomDeckValues: document.getElementById('drawer-custom-deck-values'),
    drawerApplyCustomDeck: document.getElementById('drawer-apply-custom-deck'),
    drawerExportCsvBtn: document.getElementById('drawer-export-csv-btn'),
    drawerFinishBtn: document.getElementById('drawer-finish-btn'),

    // Drawer Chat
    drawerChatMessages: document.getElementById('drawer-chat-messages'),
    drawerChatEmpty: document.getElementById('drawer-chat-empty'),
    drawerChatInput: document.getElementById('drawer-chat-input'),
    drawerChatSendBtn: document.getElementById('drawer-chat-send-btn'),

    // Zone A: Current Story
    zoneStory: document.getElementById('zone-story'),
    zoneStoryEmpty: document.getElementById('zone-story-empty'),
    zoneStoryActive: document.getElementById('zone-story-active'),
    zoneStoryTitle: document.getElementById('zone-story-title'),
    zoneStoryEditBtn: document.getElementById('zone-story-edit-btn'),
    zonePhaseBadge: document.getElementById('zone-phase-badge'),
    zoneStoryProgress: document.getElementById('zone-story-progress'),
    zoneProgressText: document.getElementById('zone-progress-text'),
    zoneProgressFill: document.getElementById('zone-progress-fill'),
    zoneStoryNotesWrapper: document.getElementById('zone-story-notes-wrapper'),
    zoneStoryNotes: document.getElementById('zone-story-notes'),
    zoneContextChips: document.getElementById('zone-context-chips'),
    chipDiscuss: document.getElementById('chip-discuss'),

    // Zone B: Card Selection
    zoneCards: document.getElementById('zone-cards'),
    zoneVotingCards: document.getElementById('zone-voting-cards'),
    zoneVoteIndicator: document.getElementById('zone-vote-indicator'),
    zoneMyVoteValue: document.getElementById('zone-my-vote-value'),
    zoneVotePrompt: document.getElementById('zone-vote-prompt'),
    zoneEmojiReactions: document.getElementById('zone-emoji-reactions'),

    // Zone C: Participants
    zoneParticipants: document.getElementById('zone-participants'),
    zoneParticipantCount: document.getElementById('zone-participant-count'),
    zoneParticipantsTable: document.getElementById('zone-participants-table'),

    // Contextual Footer
    contextualFooter: document.getElementById('contextual-footer'),
    footerStats: document.getElementById('footer-stats'),
    footerStatMin: document.getElementById('footer-stat-min'),
    footerStatMedian: document.getElementById('footer-stat-median'),
    footerStatMax: document.getElementById('footer-stat-max'),
    footerVotingControls: document.getElementById('footer-voting-controls'),
    footerRevealedControls: document.getElementById('footer-revealed-controls'),
    footerLockedControls: document.getElementById('footer-locked-controls'),
    footerRevealBtn: document.getElementById('footer-reveal-btn'),
    footerClearBtn: document.getElementById('footer-clear-btn'),
    footerLockValue: document.getElementById('footer-lock-value'),
    footerLockBtn: document.getElementById('footer-lock-btn'),
    footerAutoCalcBtn: document.getElementById('footer-auto-calc-btn'),
    footerRevoteBtn: document.getElementById('footer-revote-btn'),
    footerNextBtn: document.getElementById('footer-next-btn')
};

// State
let client = null;
let hasJoined = false;
const { roomId, roomSecret } = getUrlParams();

// Drawer state
let drawerState = {
    isOpen: false,
    activeTab: 'stories',
    unreadChatCount: 0
};

// Load drawer state from localStorage
function loadDrawerState() {
    try {
        const saved = localStorage.getItem('drawerState_' + roomId);
        if (saved) {
            const parsed = JSON.parse(saved);
            drawerState.isOpen = parsed.isOpen || false;
            drawerState.activeTab = parsed.activeTab || 'stories';
        }
    } catch (e) { /* ignore */ }
}

// Save drawer state to localStorage
function saveDrawerState() {
    try {
        localStorage.setItem('drawerState_' + roomId, JSON.stringify({
            isOpen: drawerState.isOpen,
            activeTab: drawerState.activeTab
        }));
    } catch (e) { /* ignore */ }
}

// Fun state tracking
let previousPhase = null;
let previousWaitingFor = null;
let previousVoteCount = 0;

// Track chat messages/emojis for current story (clientId -> last emoji/message)
let participantChatEmojis = new Map();
let currentStoryIdForChat = null;

// Common emojis to detect in messages
const CHAT_EMOJIS = ['👍', '👎', '🎯', '🤔', '🚀', '☕', '❓', '❗', '✅', '❌', '💡', '🔥', '👀', '🙌', '💪', '😊', '😅', '🤷', '👏', '🎉'];

// ============================================
// DRAWER FUNCTIONS
// ============================================

function openDrawer(tab = null) {
    drawerState.isOpen = true;
    elements.drawer?.classList.add('open');
    elements.drawerOverlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';

    if (tab) {
        switchDrawerTab(tab);
    }

    // Clear chat badge and participant indicators if opening to chat tab
    if (drawerState.activeTab === 'chat') {
        clearDrawerChatBadge();
        clearParticipantChatIndicators();
    }

    saveDrawerState();
}

function closeDrawer() {
    drawerState.isOpen = false;
    elements.drawer?.classList.remove('open');
    elements.drawerOverlay?.classList.remove('visible');
    document.body.style.overflow = '';
    saveDrawerState();
}

function toggleDrawer() {
    if (drawerState.isOpen) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

function switchDrawerTab(tabId) {
    drawerState.activeTab = tabId;

    // Update tab active states
    elements.drawerTabs?.forEach(tab => {
        const isActive = tab.dataset.tab === tabId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });

    // Update panel visibility
    const panels = {
        stories: elements.drawerPanelStories,
        settings: elements.drawerPanelSettings,
        chat: elements.drawerPanelChat
    };

    Object.entries(panels).forEach(([id, panel]) => {
        panel?.classList.toggle('active', id === tabId);
    });

    // Clear chat badge and participant indicators when switching to chat
    if (tabId === 'chat') {
        clearDrawerChatBadge();
        clearParticipantChatIndicators();
    }

    saveDrawerState();
}

function updateDrawerChatBadge(count) {
    drawerState.unreadChatCount = count;

    // Update drawer tab badge
    if (elements.drawerChatBadge) {
        if (count > 0) {
            elements.drawerChatBadge.textContent = count > 99 ? '99+' : count;
            elements.drawerChatBadge.classList.add('show');
        } else {
            elements.drawerChatBadge.classList.remove('show');
        }
    }

    // Update toggle button chat dot
    if (elements.drawerToggleChatDot) {
        elements.drawerToggleChatDot.style.display = count > 0 ? 'block' : 'none';
    }
    if (elements.drawerToggleChat) {
        elements.drawerToggleChat.classList.toggle('has-badge', count > 0);
    }
}

function updateDrawerStoriesBadge(count) {
    if (elements.drawerToggleStoriesCount) {
        if (count > 0) {
            elements.drawerToggleStoriesCount.textContent = count;
            elements.drawerToggleStoriesCount.style.display = 'flex';
        } else {
            elements.drawerToggleStoriesCount.style.display = 'none';
        }
    }
    if (elements.drawerToggleStories) {
        elements.drawerToggleStories.classList.toggle('has-badge', count > 0);
    }
}

function clearDrawerChatBadge() {
    drawerState.unreadChatCount = 0;
    updateDrawerChatBadge(0);
}

function clearParticipantChatIndicators() {
    // Clear the tracking map
    participantChatEmojis.clear();
    // Remove has-chatted class from all participant chips
    const chips = elements.zoneParticipantsTable?.querySelectorAll('.participant-chip.has-chatted');
    chips?.forEach(chip => chip.classList.remove('has-chatted'));
}

// Extract emoji from a chat message
function extractEmojiFromMessage(text) {
    // First check if the message is just an emoji
    const trimmed = text.trim();
    if (CHAT_EMOJIS.includes(trimmed)) {
        return trimmed;
    }
    // Check if message starts with an emoji
    for (const emoji of CHAT_EMOJIS) {
        if (trimmed.startsWith(emoji)) {
            return emoji;
        }
    }
    // Check if message contains any emoji
    for (const emoji of CHAT_EMOJIS) {
        if (trimmed.includes(emoji)) {
            return emoji;
        }
    }
    // Default chat bubble emoji if no emoji found
    return '💬';
}

// ============================================
// ZONE RENDER FUNCTIONS
// ============================================

function renderZoneStory(state, derived) {
    if (!elements.zoneStory) return;

    const hasStory = state.currentStoryId && derived.currentStory;

    if (!hasStory) {
        elements.zoneStory.classList.add('empty');
        if (elements.zoneStoryEmpty) elements.zoneStoryEmpty.style.display = 'block';
        if (elements.zoneStoryActive) elements.zoneStoryActive.style.display = 'none';
        return;
    }

    elements.zoneStory.classList.remove('empty');
    if (elements.zoneStoryEmpty) elements.zoneStoryEmpty.style.display = 'none';
    if (elements.zoneStoryActive) elements.zoneStoryActive.style.display = 'block';

    const story = derived.currentStory;

    // Story number badge (show position in stories list)
    const storyNumber = document.getElementById('zone-story-number');
    if (storyNumber) {
        const stories = state.stories || [];
        const storyIndex = stories.findIndex(s => s.id === state.currentStoryId);
        if (storyIndex >= 0 && stories.length > 1) {
            storyNumber.textContent = `${storyIndex + 1} of ${stories.length}`;
            storyNumber.style.display = '';
        } else {
            storyNumber.style.display = 'none';
        }
    }

    // Title (editable by host) - strip leading number if present
    if (elements.zoneStoryTitle) {
        // Remove leading "1. " or "1) " patterns if they exist
        let displayTitle = story.title;
        const numberPattern = /^\d+[\.\)]\s*/;
        displayTitle = displayTitle.replace(numberPattern, '');
        elements.zoneStoryTitle.textContent = displayTitle || story.title;
        elements.zoneStoryTitle.contentEditable = client?.isHost() ? 'true' : 'false';
    }

    // Edit button visibility
    if (elements.zoneStoryEditBtn) {
        elements.zoneStoryEditBtn.style.display = client?.isHost() ? '' : 'none';
    }

    // Phase badge
    if (elements.zonePhaseBadge) {
        elements.zonePhaseBadge.textContent = state.phase.toUpperCase();
        elements.zonePhaseBadge.className = 'phase-badge phase-' + state.phase;
    }

    // Progress (waiting for votes)
    if (state.phase === 'voting' && elements.zoneProgressText) {
        const votes = state.currentStoryId && state.votesByStory[state.currentStoryId]
            ? Object.keys(state.votesByStory[state.currentStoryId]).length
            : 0;
        const total = Object.keys(state.participants).length;
        const percent = total > 0 ? Math.round((votes / total) * 100) : 0;
        const remaining = total - votes;

        // Show invite prompt if user is alone
        const isAlone = total <= 1;
        const zoneInviteBtn = document.getElementById('zone-invite-btn');

        if (isAlone) {
            elements.zoneProgressText.textContent = 'Invite teammates to vote';
            if (elements.zoneStoryProgress) {
                elements.zoneStoryProgress.classList.add('invite');
                elements.zoneStoryProgress.classList.remove('waiting');
            }
            if (zoneInviteBtn) zoneInviteBtn.style.display = '';
            if (elements.zoneProgressFill) elements.zoneProgressFill.parentElement.style.display = 'none';
        } else if (votes === 0) {
            elements.zoneProgressText.textContent = 'Waiting for teammates to vote...';
            if (elements.zoneStoryProgress) {
                elements.zoneStoryProgress.classList.add('waiting');
                elements.zoneStoryProgress.classList.remove('invite');
            }
            if (zoneInviteBtn) zoneInviteBtn.style.display = 'none';
            if (elements.zoneProgressFill) {
                elements.zoneProgressFill.parentElement.style.display = '';
                elements.zoneProgressFill.style.width = '0%';
            }
        } else {
            const waitingText = remaining === 0
                ? `All ${total} votes in!`
                : `${votes}/${total} voted (${remaining} waiting)`;
            elements.zoneProgressText.textContent = waitingText;
            if (elements.zoneStoryProgress) {
                elements.zoneStoryProgress.classList.remove('invite', 'waiting');
            }
            if (zoneInviteBtn) zoneInviteBtn.style.display = 'none';
            if (elements.zoneProgressFill) {
                elements.zoneProgressFill.parentElement.style.display = '';
                elements.zoneProgressFill.style.width = percent + '%';
            }
        }

        if (elements.zoneStoryProgress) {
            elements.zoneStoryProgress.style.display = '';
        }
    } else if (elements.zoneStoryProgress) {
        elements.zoneStoryProgress.style.display = 'none';
    }

    // Inline stats (shown after reveal/locked)
    const statsInline = document.getElementById('zone-stats-inline');
    const statsConsensus = document.getElementById('stats-inline-consensus');
    const statsConsensusValue = document.getElementById('stats-consensus-value');
    const statsFull = document.getElementById('stats-inline-full');

    if (statsInline && (state.phase === 'revealed' || state.phase === 'locked')) {
        statsInline.classList.add('show');

        // Calculate stats
        const currentVotes = state.currentStoryId && state.votesByStory[state.currentStoryId]
            ? Object.values(state.votesByStory[state.currentStoryId])
            : [];
        const numericVotes = currentVotes.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
        const uniqueVotes = [...new Set(currentVotes)];

        // Check for consensus
        const isConsensus = uniqueVotes.length === 1 && currentVotes.length > 1;

        if (isConsensus) {
            // Show only consensus message
            statsInline.classList.add('consensus');
            if (statsConsensus) {
                statsConsensus.style.display = 'flex';
                if (statsConsensusValue) statsConsensusValue.textContent = uniqueVotes[0];
            }
            if (statsFull) statsFull.style.display = 'none';
            // Hide context chips - no need to discuss when there's consensus
            if (elements.zoneContextChips) elements.zoneContextChips.style.display = 'none';
        } else if (numericVotes.length > 0) {
            // Show full stats
            statsInline.classList.remove('consensus');
            if (statsConsensus) statsConsensus.style.display = 'none';
            if (statsFull) statsFull.style.display = 'flex';

            const min = Math.min(...numericVotes);
            const max = Math.max(...numericVotes);
            const spread = max - min;
            const sorted = [...numericVotes].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

            const minEl = document.getElementById('stats-inline-min');
            const medianEl = document.getElementById('stats-inline-median');
            const maxEl = document.getElementById('stats-inline-max');

            if (minEl) minEl.textContent = min;
            if (medianEl) medianEl.textContent = median;
            if (maxEl) maxEl.textContent = max;

            // Show "Discuss differences" chip if high spread
            if (elements.zoneContextChips && elements.chipDiscuss && spread >= 3) {
                elements.zoneContextChips.style.display = 'flex';
                elements.chipDiscuss.style.display = 'inline-flex';
            } else if (elements.zoneContextChips) {
                elements.zoneContextChips.style.display = 'none';
            }
        }
    } else if (statsInline) {
        statsInline.classList.remove('show', 'consensus');
        // Hide context chips
        if (elements.zoneContextChips) elements.zoneContextChips.style.display = 'none';
    }

    // Notes
    if (elements.zoneStoryNotesWrapper) {
        if (story.notes) {
            elements.zoneStoryNotesWrapper.style.display = '';
            if (elements.zoneStoryNotes) {
                elements.zoneStoryNotes.textContent = story.notes;
            }
        } else {
            elements.zoneStoryNotesWrapper.style.display = 'none';
        }
    }
}

function renderZoneCards(state) {
    if (!elements.zoneVotingCards) return;

    const deckType = state.deck?.type || 'fibonacci';
    const deckValues = getDeckValues(deckType, state.deck?.custom);
    const myVote = getMyVote(state);
    const isLocked = state.phase === 'locked';

    // Render cards
    elements.zoneVotingCards.innerHTML = deckValues.map(value => {
        const isSelected = myVote === value;
        return `
            <button class="vote-card ${isSelected ? 'selected' : ''}"
                    onclick="handleVoteClick('${escapeHtml(value)}')"
                    ${isLocked ? 'disabled' : ''}>
                <span>${escapeHtml(value)}</span>
            </button>
        `;
    }).join('');

    // Vote indicator
    if (elements.zoneVoteIndicator && elements.zoneVotePrompt) {
        if (myVote && state.phase === 'voting') {
            elements.zoneVoteIndicator.classList.add('show');
            if (elements.zoneMyVoteValue) {
                elements.zoneMyVoteValue.textContent = myVote;
            }
            elements.zoneVotePrompt.style.display = 'none';
        } else if (!myVote && state.phase === 'voting') {
            elements.zoneVoteIndicator.classList.remove('show');
            elements.zoneVotePrompt.style.display = '';
        } else {
            elements.zoneVoteIndicator.classList.remove('show');
            elements.zoneVotePrompt.style.display = 'none';
        }
    }
}

function renderZoneParticipants(state) {
    if (!elements.zoneParticipantsTable) return;

    const participants = Object.entries(state.participants);
    const currentVotes = state.currentStoryId && state.votesByStory[state.currentStoryId]
        ? state.votesByStory[state.currentStoryId]
        : {};
    const isRevealed = state.phase !== 'voting';
    const myClientId = client?.clientId;

    // Reset chat indicators when story changes
    if (state.currentStoryId !== currentStoryIdForChat) {
        participantChatEmojis.clear();
        currentStoryIdForChat = state.currentStoryId;
    }

    // Update count
    if (elements.zoneParticipantCount) {
        elements.zoneParticipantCount.textContent = `(${participants.length})`;
    }

    elements.zoneParticipantsTable.innerHTML = participants.map(([id, p]) => {
        const vote = currentVotes[id];
        const hasVoted = vote !== undefined;
        const isMe = id === myClientId;
        const avatar = p.avatar || '👤';
        const chatEmoji = participantChatEmojis.get(id);
        const hasChatted = !!chatEmoji;

        let voteDisplay = '';
        let voteClass = '';

        if (isRevealed && hasVoted) {
            voteDisplay = escapeHtml(vote);
            voteClass = 'revealed';
        } else if (hasVoted) {
            // During voting, show voted status (checkmark via CSS)
            voteDisplay = '';
            voteClass = 'voted';
        } else {
            // Not voted yet (empty dot via CSS)
            voteDisplay = '';
            voteClass = 'pending';
        }

        return `
            <div class="participant-chip ${isMe ? 'current-user' : ''} ${hasChatted ? 'has-chatted' : ''}"
                 data-client-id="${id}" data-vote="${hasVoted && isRevealed ? escapeHtml(vote) : ''}">
                <span class="avatar">${avatar}</span>
                <span class="name">${escapeHtml(p.name || 'Anonymous')}</span>
                <div class="vote-indicator ${voteClass}">
                    ${voteDisplay}
                    <span class="chat-avatar-badge">${chatEmoji || ''}</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers for peek effect
    setupParticipantClickHandlers();
}

function setupParticipantClickHandlers() {
    const chips = elements.zoneParticipantsTable?.querySelectorAll('.participant-chip');
    if (!chips) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Add peek highlight effect
            chip.classList.remove('peek-highlight');
            // Force reflow to restart animation
            void chip.offsetWidth;
            chip.classList.add('peek-highlight');

            // Remove class after animation
            setTimeout(() => {
                chip.classList.remove('peek-highlight');
            }, 1500);
        });
    });
}

function renderContextualFooter(state, derived) {
    if (!elements.contextualFooter) return;

    const isHost = client?.isHost();
    const hasCurrentStory = !!state.currentStoryId;

    // Only show footer for host when there's an active story
    if (!isHost || !hasCurrentStory) {
        elements.contextualFooter.classList.remove('show');
        document.body.classList.remove('footer-visible');
        return;
    }

    elements.contextualFooter.classList.add('show');
    document.body.classList.add('footer-visible');

    // Hide all control groups first
    if (elements.footerVotingControls) elements.footerVotingControls.style.display = 'none';
    if (elements.footerRevealedControls) elements.footerRevealedControls.style.display = 'none';
    if (elements.footerLockedControls) elements.footerLockedControls.style.display = 'none';
    if (elements.footerStats) elements.footerStats.style.display = 'none';

    // Show appropriate controls based on phase
    switch (state.phase) {
        case 'voting':
            if (elements.footerVotingControls) {
                elements.footerVotingControls.style.display = 'flex';
            }
            break;

        case 'revealed':
            if (elements.footerRevealedControls) {
                elements.footerRevealedControls.style.display = 'flex';
            }
            // Show stats
            if (elements.footerStats && derived.stats) {
                elements.footerStats.style.display = 'flex';
                if (elements.footerStatMin) elements.footerStatMin.textContent = derived.stats.min ?? '-';
                if (elements.footerStatMedian) elements.footerStatMedian.textContent = derived.stats.median ?? '-';
                if (elements.footerStatMax) elements.footerStatMax.textContent = derived.stats.max ?? '-';
            }
            // Populate lock value dropdown
            populateFooterLockOptions(state, derived);
            break;

        case 'locked':
            if (elements.footerLockedControls) {
                elements.footerLockedControls.style.display = 'flex';
            }
            break;
    }
}

function populateFooterLockOptions(state, derived) {
    if (!elements.footerLockValue) return;

    const deckType = state.deck?.type || 'fibonacci';
    const deckValues = getDeckValues(deckType, state.deck?.custom);

    // Get unique vote values
    const currentVotes = state.currentStoryId && state.votesByStory[state.currentStoryId]
        ? Object.values(state.votesByStory[state.currentStoryId])
        : [];
    const numericVotes = currentVotes.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
    const uniqueVotes = [...new Set(currentVotes)];

    // Calculate median
    let median = null;
    if (numericVotes.length > 0) {
        const sorted = [...numericVotes].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Default to median if available
    const defaultValue = median?.toString() || uniqueVotes[0] || deckValues[0];

    elements.footerLockValue.innerHTML = deckValues.map(v => {
        const isVoted = uniqueVotes.includes(v);
        const isDefault = v === defaultValue;
        return `<option value="${escapeHtml(v)}" ${isDefault ? 'selected' : ''}>
            ${escapeHtml(v)}${isVoted ? ' ✓' : ''}
        </option>`;
    }).join('');

    // Populate quick-pick chips with unique voted values
    const quickPicksEl = document.getElementById('footer-quick-picks');
    if (quickPicksEl) {
        // Only show numeric unique votes, max 4
        const numericUniqueVotes = uniqueVotes
            .filter(v => !isNaN(parseFloat(v)))
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .slice(0, 4);

        if (numericUniqueVotes.length > 1) {
            quickPicksEl.innerHTML = numericUniqueVotes.map(v => {
                const isMedian = parseFloat(v) === median;
                return `<button class="quick-pick-chip ${isMedian ? 'recommended' : ''}"
                        onclick="selectQuickPick('${escapeHtml(v)}')"
                        title="${isMedian ? 'Median (recommended)' : 'Vote value'}">
                    ${escapeHtml(v)}${isMedian ? ' ✓' : ''}
                </button>`;
            }).join('');
            quickPicksEl.style.display = 'flex';
        } else {
            quickPicksEl.style.display = 'none';
        }
    }
}

// Quick pick selection helper
function selectQuickPick(value) {
    if (elements.footerLockValue) {
        elements.footerLockValue.value = value;
    }
}

// Helper: Get deck values
function getDeckValues(type, custom) {
    const decks = {
        fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'],
        tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
        custom: custom && custom.length > 0 ? [...custom, '?', '☕'] : ['1', '2', '3', '5', '8', '?', '☕']
    };
    return decks[type] || decks.fibonacci;
}

// Helper: Get my vote
function getMyVote(state) {
    if (!state.currentStoryId || !client?.clientId) return null;
    const votes = state.votesByStory[state.currentStoryId];
    return votes ? votes[client.clientId] : null;
}

// Helper: Handle vote click
function handleVoteClick(value) {
    if (client && client.state?.currentStoryId) {
        client.vote(client.state.currentStoryId, value);
    }
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================
// DRAWER STORIES RENDER
// ============================================

function renderDrawerStories(state) {
    if (!elements.drawerStoriesList) return;

    const stories = state.stories || [];

    // Update drawer toggle stories badge
    updateDrawerStoriesBadge(stories.length);

    if (elements.drawerStoryCount) {
        elements.drawerStoryCount.textContent = `(${stories.length})`;
    }

    if (stories.length === 0) {
        elements.drawerStoriesList.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                No stories yet. Add one above!
            </div>
        `;
        return;
    }

    elements.drawerStoriesList.innerHTML = stories.map(story => {
        const isCurrent = story.id === state.currentStoryId;
        const isLocked = state.lockedByStory && state.lockedByStory[story.id];
        const lockedValue = isLocked ? state.lockedByStory[story.id] : null;

        return `
            <div class="story-item ${isCurrent ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                 onclick="handleSelectStory('${story.id}')">
                <div class="story-item-content">
                    <div class="story-item-title">${escapeHtml(story.title)}</div>
                    ${isLocked ? `<div class="story-item-estimate">${escapeHtml(lockedValue)}</div>` : ''}
                </div>
                <div class="story-actions">
                    <button onclick="event.stopPropagation(); openEditModal('${story.id}')" title="Edit">✏️</button>
                </div>
            </div>
        `;
    }).join('');
}

function handleSelectStory(storyId) {
    if (client) {
        client.setCurrentStory(storyId);
    }
}

// ============================================
// DRAWER CHAT RENDER
// ============================================

function renderDrawerChat(messages) {
    if (!elements.drawerChatMessages) return;

    if (!messages || messages.length === 0) {
        if (elements.drawerChatEmpty) elements.drawerChatEmpty.style.display = '';
        return;
    }

    if (elements.drawerChatEmpty) elements.drawerChatEmpty.style.display = 'none';

    const myClientId = client?.clientId;
    const participants = client?.state?.participants || {};

    elements.drawerChatMessages.innerHTML = messages.map(msg => {
        const isOwn = msg.clientId === myClientId;
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const participant = participants[msg.clientId];
        const avatar = participant?.avatar || '👤';

        return `
            <div class="chat-message ${isOwn ? 'own' : ''}">
                <div class="chat-message-avatar">${avatar}</div>
                <div class="chat-message-content">
                    <div class="chat-message-header">
                        <span class="chat-message-name">${escapeHtml(msg.name)}</span>
                        <span class="chat-message-time">${time}</span>
                    </div>
                    <div class="chat-message-text">${escapeHtml(msg.text)}</div>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    elements.drawerChatMessages.scrollTop = elements.drawerChatMessages.scrollHeight;
}

// Initialize
function init() {
    if (!roomId) {
        showError('No room ID provided');
        return;
    }

    elements.roomCode.textContent = roomId;

    // Create client
    client = new RoomClient(roomId, {
        roomSecret,
        onStateChange: handleStateChange,
        onError: handleError,
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onReconnecting: handleReconnecting,
        onChat: handleChatMessage,
        onFinish: handleFinish
    });

    // Connect
    client.connect();

    // Setup event listeners
    setupEventListeners();

    // Load drawer state from localStorage
    loadDrawerState();

    // Restore drawer state if it was open
    if (drawerState.isOpen) {
        openDrawer(drawerState.activeTab);
    }
}

function setupEventListeners() {
    // Join button
    elements.joinBtn.addEventListener('click', handleJoin);
    elements.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoin();
    });

    // Copy link
    elements.copyLinkBtn.addEventListener('click', copyRoomLink);

    // Share dropdown toggle
    elements.shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.shareMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        elements.shareMenu.classList.remove('show');
    });

    // Share options
    elements.shareSlack.addEventListener('click', shareToSlack);
    elements.shareTeams.addEventListener('click', shareToTeams);
    elements.shareEmail.addEventListener('click', shareViaEmail);
    elements.shareNative.addEventListener('click', shareNative);

    // QR Code
    elements.qrBtn.addEventListener('click', showQRCode);

    // Edit story modal (still needed)
    if (elements.editCancelBtn) {
        elements.editCancelBtn.addEventListener('click', hideEditStoryModal);
    }
    if (elements.editSaveBtn) {
        elements.editSaveBtn.addEventListener('click', handleSaveStory);
    }
    if (elements.deleteStoryBtn) {
        elements.deleteStoryBtn.addEventListener('click', handleDeleteStory);
    }
    if (elements.editStoryModal) {
        elements.editStoryModal.addEventListener('click', (e) => {
            if (e.target === elements.editStoryModal) hideEditStoryModal();
        });
    }

    // Avatar modal (still needed)
    if (elements.avatarCancelBtn) {
        elements.avatarCancelBtn.addEventListener('click', closeAvatarSelector);
    }
    if (elements.avatarModal) {
        elements.avatarModal.addEventListener('click', (e) => {
            if (e.target === elements.avatarModal) closeAvatarSelector();
        });
    }

    // Fortune toast close (still needed for fun mode)
    if (elements.fortuneClose) {
        elements.fortuneClose.addEventListener('click', hideFortune);
    }

    // Purchase modal
    if (elements.purchaseCloseBtn) {
        elements.purchaseCloseBtn.addEventListener('click', hidePurchaseModal);
    }
    if (elements.purchaseUpgradeBtn) {
        elements.purchaseUpgradeBtn.addEventListener('click', hidePurchaseModal);
    }
    if (elements.purchaseModal) {
        elements.purchaseModal.addEventListener('click', (e) => {
            if (e.target === elements.purchaseModal) hidePurchaseModal();
        });
    }

    // ======== DRAWER EVENT LISTENERS ========

    // Drawer toggle button - detect which icon was clicked
    if (elements.drawerToggle) {
        elements.drawerToggle.addEventListener('click', (e) => {
            const target = e.target.closest('.drawer-toggle-item');
            if (target) {
                // Clicked on a specific icon
                if (target.id === 'drawer-toggle-stories') {
                    openDrawer('stories');
                } else if (target.id === 'drawer-toggle-chat') {
                    openDrawer('chat');
                }
            } else {
                // Clicked on the toggle button itself, use smart default
                toggleDrawer();
            }
        });
    }

    // Drawer close button
    if (elements.drawerClose) {
        elements.drawerClose.addEventListener('click', closeDrawer);
    }

    // Drawer overlay (click to close)
    if (elements.drawerOverlay) {
        elements.drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Drawer tab buttons
    if (elements.drawerTabs && elements.drawerTabs.length > 0) {
        elements.drawerTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                switchDrawerTab(tabId);
            });
        });
    }

    // Escape key to close drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawerState.isOpen) {
            closeDrawer();
        }
    });

    // ======== DRAWER CHAT ========
    if (elements.drawerChatSendBtn) {
        elements.drawerChatSendBtn.addEventListener('click', () => {
            const input = elements.drawerChatInput;
            const text = input.value.trim();
            if (text && client) {
                client.sendChat(text);
                input.value = '';
            }
        });
    }

    if (elements.drawerChatInput) {
        elements.drawerChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = e.target.value.trim();
                if (text && client) {
                    client.sendChat(text);
                    e.target.value = '';
                }
            }
        });
    }

    // ======== DRAWER ADD STORY ========
    if (elements.drawerAddStoryBtn) {
        elements.drawerAddStoryBtn.addEventListener('click', () => {
            const input = elements.drawerNewStoryInput;
            const title = input.value.trim();
            if (title && client) {
                client.addStory(title);
                input.value = '';
            }
        });
    }

    if (elements.drawerNewStoryInput) {
        elements.drawerNewStoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const title = e.target.value.trim();
                if (title && client) {
                    client.addStory(title);
                    e.target.value = '';
                }
            }
        });
    }

    // ======== CONTEXTUAL FOOTER CONTROLS ========

    // Voting phase - Reveal button
    if (elements.footerRevealBtn) {
        elements.footerRevealBtn.addEventListener('click', () => client.reveal());
    }

    // Revealed phase - Lock button
    if (elements.footerLockBtn) {
        elements.footerLockBtn.addEventListener('click', () => {
            const value = elements.footerLockValue?.value;
            if (value && client.state?.currentStoryId) {
                client.lock(client.state.currentStoryId, value);
            }
        });
    }

    // Revealed phase - Clear button
    if (elements.footerClearBtn) {
        elements.footerClearBtn.addEventListener('click', () => {
            if (client.state?.currentStoryId) {
                client.clearVotes(client.state.currentStoryId);
            }
        });
    }

    // Locked phase - Next Story button
    if (elements.footerNextBtn) {
        elements.footerNextBtn.addEventListener('click', () => client.next());
    }

    // ======== ZONE STORY TITLE EDITING ========
    if (elements.zoneStoryTitle) {
        elements.zoneStoryTitle.addEventListener('blur', (e) => {
            e.target.setAttribute('contenteditable', 'false');
            const newTitle = e.target.textContent.trim();
            if (newTitle && client.state?.currentStoryId) {
                client.editStory(client.state.currentStoryId, newTitle);
            }
        });

        elements.zoneStoryTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    // ======== ZONE STORY EDIT BUTTON ========
    if (elements.zoneStoryEditBtn) {
        elements.zoneStoryEditBtn.addEventListener('click', () => {
            if (elements.zoneStoryTitle) {
                elements.zoneStoryTitle.setAttribute('contenteditable', 'true');
                elements.zoneStoryTitle.focus();
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(elements.zoneStoryTitle);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }

    // ======== DRAWER SETTINGS LISTENERS ========
    if (elements.drawerDeckSelect) {
        elements.drawerDeckSelect.addEventListener('change', (e) => {
            const deckType = e.target.value;
            if (deckType === 'custom') {
                elements.drawerCustomDeckInput.style.display = 'block';
            } else {
                elements.drawerCustomDeckInput.style.display = 'none';
                if (client) client.setDeck(deckType);
            }
        });
    }

    if (elements.drawerApplyCustomDeck) {
        elements.drawerApplyCustomDeck.addEventListener('click', () => {
            const values = elements.drawerCustomDeckValues.value
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0);
            if (values.length > 0 && client) {
                client.setDeck('custom', values);
            }
        });
    }

    if (elements.drawerFunModeToggle) {
        elements.drawerFunModeToggle.addEventListener('change', (e) => {
            if (client) client.toggleFun(e.target.checked);
        });
    }

    if (elements.drawerExportCsvBtn) {
        elements.drawerExportCsvBtn.addEventListener('click', exportToCsv);
    }

    if (elements.drawerFinishBtn) {
        elements.drawerFinishBtn.addEventListener('click', handleFinishSession);
    }

    // ======== FOOTER AUTO-CALC BUTTON ========
    if (elements.footerAutoCalcBtn) {
        elements.footerAutoCalcBtn.addEventListener('click', handleAutoCalculate);
    }

    // ======== FOOTER REVOTE BUTTON ========
    if (elements.footerRevoteBtn) {
        elements.footerRevoteBtn.addEventListener('click', () => {
            if (client.state?.currentStoryId) {
                client.clearVotes(client.state.currentStoryId);
            }
        });
    }

    // ======== DRAWER IMPORT BUTTON ========
    if (elements.drawerImportBtn) {
        elements.drawerImportBtn.addEventListener('click', () => {
            if (elements.drawerImportFileInput) {
                elements.drawerImportFileInput.click();
            }
        });
    }

    if (elements.drawerImportFileInput) {
        elements.drawerImportFileInput.addEventListener('change', handleImportFile);
    }

    // ======== ZONE EMOJI REACTIONS ========
    if (elements.zoneEmojiReactions) {
        elements.zoneEmojiReactions.addEventListener('click', (e) => {
            const btn = e.target.closest('.emoji-reaction-btn');
            if (btn) {
                const emoji = btn.dataset.emoji;
                triggerEmojiFloat(emoji, e.clientX, e.clientY);
            }
        });
    }

    // ======== CHAT QUICK CHIPS ========
    const chatChips = document.querySelectorAll('.chat-chip');
    chatChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const message = chip.dataset.message;
            if (message && elements.drawerChatInput) {
                elements.drawerChatInput.value = message;
                elements.drawerChatInput.focus();
            }
        });
    });

    // ======== FINISH SESSION CONFIRMATION MODAL ========
    setupFinishConfirmModal();
}

// Handlers
function handleConnect() {
    elements.statusDot.classList.add('connected');
    elements.statusDot.classList.remove('reconnecting');
    elements.statusText.textContent = 'Connected';
    elements.loadingContainer.classList.add('hidden');
    elements.roomUI.style.display = 'flex';

    // Clear any connection-lost state
    document.body.classList.remove('connection-lost');

    // Remove any connection toast
    const toast = document.getElementById('connection-toast');
    if (toast) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }

    // Show name modal if not joined yet
    if (!hasJoined) {
        elements.nameModal.classList.remove('hidden');
        elements.nameInput.focus();
    }
}

function handleDisconnect() {
    elements.statusDot.classList.remove('connected');
    elements.statusDot.classList.add('reconnecting');
    elements.statusText.textContent = 'Reconnecting...';

    // Add visual indicator to the page
    document.body.classList.add('connection-lost');
}

function handleReconnecting(attempt, maxAttempts) {
    elements.statusDot.classList.remove('connected');
    elements.statusDot.classList.add('reconnecting');
    elements.statusText.textContent = `Reconnecting (${attempt}/${maxAttempts})...`;

    // Show reconnection toast for visibility
    showConnectionToast(`Reconnecting... Attempt ${attempt} of ${maxAttempts}`, 'warning');
}

function handleError(message) {
    console.error('Room error:', message);

    // Show user-friendly error messages
    const userMessage = getUserFriendlyError(message);

    // Use toast for non-critical errors, alert for critical ones
    if (isCriticalError(message)) {
        showConnectionToast(userMessage, 'error');
    } else {
        showConnectionToast(userMessage, 'warning');
    }
}

function getUserFriendlyError(message) {
    // Map technical errors to user-friendly messages
    const errorMap = {
        'Connection lost. Please refresh the page to reconnect.': 'Connection lost. Please refresh the page.',
        'Room full': 'This room is full. Please try again later.',
        'Message too large': 'Message is too long. Please shorten it.',
        'Too many requests': 'Please slow down and try again.',
        'Host secret required': 'Only the room host can perform this action.',
        'Join the room first': 'Please join the room before performing this action.',
        'Invalid avatar': 'Please select a valid avatar.',
        'Cannot edit a locked story': 'This story is locked and cannot be edited.',
        'Cannot delete a locked story': 'This story is locked and cannot be deleted.',
    };

    // Check for partial matches
    for (const [key, friendly] of Object.entries(errorMap)) {
        if (message.includes(key)) {
            return friendly;
        }
    }

    return message; // Return original if no mapping found
}

function isCriticalError(message) {
    const criticalPatterns = [
        'Connection lost',
        'Room expired',
        'Session ended',
        'Room not found'
    ];
    return criticalPatterns.some(pattern => message.includes(pattern));
}

function showConnectionToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.getElementById('connection-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'connection-toast';
    toast.className = `connection-toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds for non-error toasts
    if (type !== 'error') {
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

function handleJoin() {
    const name = elements.nameInput.value.trim();
    if (!name) {
        elements.nameInput.focus();
        return;
    }

    client.join(name);
    hasJoined = true;
    elements.nameModal.classList.add('hidden');

    // Enable drawer chat
    if (elements.drawerChatInput) {
        elements.drawerChatInput.disabled = false;
        elements.drawerChatInput.placeholder = 'Type a message...';
    }
    if (elements.drawerChatSendBtn) {
        elements.drawerChatSendBtn.disabled = false;
    }

    // Load existing chat messages from state
    if (client.chatMessages && client.chatMessages.length > 0) {
        renderDrawerChat(client.chatMessages);
    }
}

function handleStateChange(state, derived) {
    // Check for fun triggers before rendering
    checkFunTriggers(state, derived);

    // ======== 3-ZONE LAYOUT RENDERING ========
    renderZoneStory(state, derived);
    renderZoneCards(state);
    renderZoneParticipants(state);
    renderContextualFooter(state, derived);
    renderDrawerStories(state);
    renderDrawerSettings(state);

    // Update previous state for next comparison
    previousPhase = state.phase;
    previousWaitingFor = derived.waitingFor;

    const currentVotes = state.currentStoryId
        ? Object.keys(state.votesByStory[state.currentStoryId] || {}).length
        : 0;
    previousVoteCount = currentVotes;
}

function handleAutoCalculate() {
    if (!client.state?.currentStoryId) return;

    const votes = client.state.votesByStory[client.state.currentStoryId];
    if (!votes || Object.keys(votes).length === 0) {
        alert('No votes to calculate from');
        return;
    }

    // Get all numeric votes
    const numericVotes = Object.values(votes)
        .map(v => parseFloat(v))
        .filter(n => !isNaN(n) && isFinite(n));

    if (numericVotes.length === 0) {
        // For non-numeric (like t-shirt sizes), use mode (most common)
        const voteCounts = {};
        Object.values(votes).forEach(v => {
            voteCounts[v] = (voteCounts[v] || 0) + 1;
        });
        const modeValue = Object.entries(voteCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        client.lock(client.state.currentStoryId, modeValue);
        return;
    }

    // Calculate median
    numericVotes.sort((a, b) => a - b);
    const mid = Math.floor(numericVotes.length / 2);
    const medianValue = numericVotes.length % 2 !== 0
        ? numericVotes[mid]
        : (numericVotes[mid - 1] + numericVotes[mid]) / 2;

    // Find closest deck value to median
    const deckValues = getDeckValues();
    const numericDeckValues = deckValues
        .map(v => ({ original: v, numeric: parseFloat(v) }))
        .filter(v => !isNaN(v.numeric));

    if (numericDeckValues.length > 0) {
        // Find closest deck value
        const closest = numericDeckValues.reduce((prev, curr) =>
            Math.abs(curr.numeric - medianValue) < Math.abs(prev.numeric - medianValue) ? curr : prev
        );
        client.lock(client.state.currentStoryId, closest.original);
    } else {
        // Use raw median if deck is non-numeric
        client.lock(client.state.currentStoryId, String(medianValue));
    }
}

function getDeckValues() {
    const state = client.state;
    if (!state) return [];

    if (state.deck.type === 'fibonacci') {
        return ['0', '1', '2', '3', '5', '8', '13', '21', '?'];
    } else if (state.deck.type === 'tshirt') {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'];
    } else if (state.deck.type === 'custom' && state.deck.custom) {
        return [...state.deck.custom, '?'];
    }
    return [];
}

function showPurchaseModal() {
    elements.purchaseModal.classList.add('visible');
}

function hidePurchaseModal() {
    elements.purchaseModal.classList.remove('visible');
}

// Edit story state
let editingStoryId = null;

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            alert('No stories found in the file');
            return;
        }

        if (lines.length > 50) {
            alert('Maximum 50 stories can be imported at once');
            lines.length = 50;
        }

        // Add each line as a story
        let added = 0;
        lines.forEach((line, index) => {
            // Add slight delay to avoid overwhelming the server
            setTimeout(() => {
                client.addStory(line.slice(0, 120));
                added++;
            }, index * 100);
        });

        // Clear the file input
        if (elements.drawerImportFileInput) {
            elements.drawerImportFileInput.value = '';
        }
    };

    reader.onerror = () => {
        alert('Error reading file');
    };

    reader.readAsText(file);
}

function showEditStoryModal(storyId) {
    const state = client.state;
    if (!state) return;

    const story = state.stories.find(s => s.id === storyId);
    if (!story) return;

    editingStoryId = storyId;
    const isLocked = storyId in state.lockedByStory;

    // Update modal title
    elements.editModalTitle.textContent = isLocked ? 'View Story (Locked)' : 'Edit Story';

    // Show/hide locked notice
    elements.editLockedNotice.style.display = isLocked ? 'flex' : 'none';

    // Fill in current values
    elements.editStoryTitle.value = story.title;
    elements.editStoryNotes.value = story.notes || '';

    // Disable inputs if locked
    elements.editStoryTitle.disabled = isLocked;
    elements.editStoryNotes.disabled = isLocked;
    elements.editSaveBtn.disabled = isLocked;
    elements.deleteStoryBtn.disabled = isLocked;
    elements.deleteStoryBtn.style.display = isLocked ? 'none' : 'block';

    // Show modal
    elements.editStoryModal.classList.add('visible');
}

function hideEditStoryModal() {
    elements.editStoryModal.classList.remove('visible');
    editingStoryId = null;
}

function handleSaveStory() {
    if (!editingStoryId || !client.state) return;

    const isLocked = editingStoryId in client.state.lockedByStory;
    if (isLocked) {
        hideEditStoryModal();
        return;
    }

    const newTitle = elements.editStoryTitle.value.trim();
    const newNotes = elements.editStoryNotes.value.trim();

    if (!newTitle) {
        alert('Story title is required');
        return;
    }

    const story = client.state.stories.find(s => s.id === editingStoryId);
    if (!story) return;

    // Check if title changed
    if (story.title !== newTitle) {
        client.editStory(editingStoryId, newTitle);
    }

    // Check if notes changed
    if ((story.notes || '') !== newNotes) {
        client.updateNotes(editingStoryId, newNotes);
    }

    hideEditStoryModal();
}

function handleDeleteStory() {
    if (!editingStoryId || !client.state) return;

    const isLocked = editingStoryId in client.state.lockedByStory;
    if (isLocked) return;

    const story = client.state.stories.find(s => s.id === editingStoryId);
    if (!story) return;

    if (confirm(`Delete "${story.title}"? This cannot be undone.`)) {
        client.deleteStory(editingStoryId);
        hideEditStoryModal();
    }
}

// Renderers
// Render drawer settings
function renderDrawerSettings(state) {
    const isHost = client?.isHost();

    // Room info box
    const roomCodeEl = document.getElementById('drawer-room-code');
    const hostStatusEl = document.getElementById('drawer-host-status');
    if (roomCodeEl && roomId) {
        roomCodeEl.textContent = roomId;
    }
    if (hostStatusEl) {
        hostStatusEl.textContent = isHost ? 'Host ✓' : 'Participant';
        hostStatusEl.classList.toggle('host', isHost);
    }

    // Deck select
    if (elements.drawerDeckSelect) {
        elements.drawerDeckSelect.value = state.deck.type;
        elements.drawerDeckSelect.disabled = !isHost;
    }

    // Host-only badge for deck
    const deckHostBadge = document.getElementById('deck-host-badge');
    if (deckHostBadge) {
        deckHostBadge.style.display = isHost ? 'none' : '';
    }

    // Fun mode toggle
    if (elements.drawerFunModeToggle) {
        elements.drawerFunModeToggle.checked = state.funMode;
    }

    // Custom deck input
    if (state.deck.type === 'custom') {
        if (elements.drawerCustomDeckInput) elements.drawerCustomDeckInput.style.display = 'block';
        if (state.deck.custom && elements.drawerCustomDeckValues) {
            elements.drawerCustomDeckValues.value = state.deck.custom.join(', ');
        }
    } else {
        if (elements.drawerCustomDeckInput) elements.drawerCustomDeckInput.style.display = 'none';
    }

    // Danger zone visibility (host only)
    const dangerZone = document.getElementById('drawer-danger-zone');
    if (dangerZone) {
        dangerZone.style.display = isHost ? '' : 'none';
    }
}

// Global functions for onclick handlers
window.selectStory = function(storyId) {
    client.setCurrentStory(storyId);
};

window.submitVote = function(value) {
    if (client.state?.currentStoryId) {
        client.vote(client.state.currentStoryId, value);
    }
};

window.openEditStory = function(storyId) {
    showEditStoryModal(storyId);
};

// Avatar selector functions
function openAvatarSelector() {
    if (!client || !client.state) return;

    const currentParticipant = client.getCurrentParticipant();
    const currentAvatar = currentParticipant?.avatar || '';

    // Get all avatars currently in use by other participants
    const usedAvatars = Object.entries(client.state.participants)
        .filter(([id, _]) => id !== client.clientId)
        .map(([_, p]) => p.avatar)
        .filter(a => a);

    // Render avatar grid
    elements.avatarGrid.innerHTML = AVATARS.map(avatar => {
        const isSelected = avatar === currentAvatar;
        const isUsed = usedAvatars.includes(avatar);

        return `
            <button class="avatar-option ${isSelected ? 'selected' : ''} ${isUsed ? 'disabled' : ''}"
                    onclick="selectAvatar('${avatar}')"
                    ${isUsed ? 'disabled title="Already in use"' : `title="${avatar}"`}>
                ${avatar}
            </button>
        `;
    }).join('');

    elements.avatarModal.classList.add('visible');
}

function closeAvatarSelector() {
    elements.avatarModal.classList.remove('visible');
}

window.openAvatarSelector = openAvatarSelector;

window.selectAvatar = function(avatar) {
    if (!client) return;

    // Check if already in use
    const usedAvatars = Object.entries(client.state.participants)
        .filter(([id, _]) => id !== client.clientId)
        .map(([_, p]) => p.avatar)
        .filter(a => a);

    if (usedAvatars.includes(avatar)) {
        alert('This avatar is already in use by another participant');
        return;
    }

    client.setAvatar(avatar);
    closeAvatarSelector();
};

// Utilities
function getGuestLink() {
    return `${window.location.origin}${window.location.pathname}#room=${roomId}`;
}

function copyRoomLink() {
    const guestLink = getGuestLink();
    navigator.clipboard.writeText(guestLink).then(() => {
        elements.copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            elements.copyLinkBtn.textContent = 'Copy Link';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        prompt('Copy this link:', guestLink);
    });
}

function shareToSlack() {
    const guestLink = getGuestLink();
    const message = `🎯 *Planning Poker Session*\n\nJoin our sprint estimation:\n${guestLink}\n\nRoom Code: \`${roomId}\``;

    // Slack doesn't have a direct share URL, so we copy a formatted message
    navigator.clipboard.writeText(message).then(() => {
        alert('📋 Slack message copied!\n\nPaste it in your Slack channel.');
    }).catch(() => {
        prompt('Copy this message to Slack:', message);
    });

    elements.shareMenu.classList.remove('show');
}

function shareToTeams() {
    const guestLink = getGuestLink();
    const message = `Join our Planning Poker session for sprint estimation`;

    // Microsoft Teams share URL
    const teamsUrl = `https://teams.microsoft.com/share?href=${encodeURIComponent(guestLink)}&msgText=${encodeURIComponent(message)}`;

    window.open(teamsUrl, '_blank', 'width=600,height=600');
    elements.shareMenu.classList.remove('show');
}

function shareViaEmail() {
    const guestLink = getGuestLink();
    const subject = 'Join our Planning Poker session';
    const body = `Hi team,

I've started a Planning Poker session for our sprint estimation.

Click here to join: ${guestLink}

Room Code: ${roomId}

See you there!`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    elements.shareMenu.classList.remove('show');
}

function shareNative() {
    const guestLink = getGuestLink();

    // Use Web Share API if available (mobile-friendly)
    if (navigator.share) {
        navigator.share({
            title: 'Join my Planning Poker session',
            text: `Join room ${roomId} for sprint estimation`,
            url: guestLink
        }).catch(() => {
            copyRoomLink();
        });
    } else {
        copyRoomLink();
    }

    elements.shareMenu.classList.remove('show');
}

function showQRCode() {
    const guestLink = getGuestLink();

    // Generate QR code
    const qr = qrcode(0, 'M');
    qr.addData(guestLink);
    qr.make();

    // Display QR code
    elements.qrCode.innerHTML = qr.createSvgTag(6, 0);
    elements.qrRoomCode.textContent = roomId;
    elements.qrModal.classList.remove('hidden');
}

// Webhook Integration
async function sendWebhook(webhookUrl, message) {
    // Detect webhook type and format message accordingly
    const isSlack = webhookUrl.includes('hooks.slack.com');
    const isTeams = webhookUrl.includes('webhook.office.com') || webhookUrl.includes('microsoft.com');

    let payload;
    if (isSlack) {
        payload = {
            text: message.text,
            blocks: [
                {
                    type: "section",
                    text: { type: "mrkdwn", text: message.formatted }
                }
            ]
        };
    } else if (isTeams) {
        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "2D5D76",
            "summary": message.text,
            "sections": [{
                "activityTitle": "🎯 Planning Poker Session",
                "facts": [
                    { "name": "Room Code", "value": roomId },
                    { "name": "Link", "value": message.link }
                ],
                "markdown": true
            }],
            "potentialAction": [{
                "@type": "OpenUri",
                "name": "Join Session",
                "targets": [{ "os": "default", "uri": message.link }]
            }]
        };
    } else {
        // Generic webhook
        payload = { text: message.text, link: message.link, roomId };
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    return response.ok;
}

// Webhook functions (optional - not in current UI but kept for future use)
async function testWebhook() {
    // Webhook UI not implemented in new drawer
    console.log('Webhook test not available in current UI');
}

async function notifyChannel() {
    // Webhook UI not implemented in new drawer
    console.log('Notify channel not available in current UI');
}

// Chat Functions
function handleChatMessage(message) {
    // Track the emoji/reaction from this participant for current story
    if (message.clientId && message.text) {
        const emoji = extractEmojiFromMessage(message.text);
        participantChatEmojis.set(message.clientId, emoji);

        // Update participant chip to show chat indicator with emoji
        const chip = elements.zoneParticipantsTable?.querySelector(`[data-client-id="${message.clientId}"]`);
        if (chip) {
            chip.classList.add('has-chatted');
            // Update the emoji badge
            const badge = chip.querySelector('.chat-avatar-badge');
            if (badge) {
                badge.textContent = emoji;
            }
        }
    }

    // Add message to drawer chat
    if (elements.drawerChatMessages) {
        // Hide empty state
        if (elements.drawerChatEmpty) {
            elements.drawerChatEmpty.style.display = 'none';
        }

        const isOwn = message.clientId === client?.clientId;
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const participant = client?.state?.participants?.[message.clientId];
        const avatar = participant?.avatar || '👤';

        const msgHtml = `
            <div class="chat-message ${isOwn ? 'own' : ''}">
                <div class="chat-message-avatar">${avatar}</div>
                <div class="chat-message-content">
                    <div class="chat-message-header">
                        <span class="chat-message-name">${escapeHtml(message.name)}</span>
                        <span class="chat-message-time">${time}</span>
                    </div>
                    <div class="chat-message-text">${escapeHtml(message.text)}</div>
                </div>
            </div>
        `;
        elements.drawerChatMessages.insertAdjacentHTML('beforeend', msgHtml);
        elements.drawerChatMessages.scrollTop = elements.drawerChatMessages.scrollHeight;
    }

    // Update drawer chat badge if drawer is closed or on different tab
    if (!drawerState.isOpen || drawerState.activeTab !== 'chat') {
        drawerState.unreadChatCount++;
        updateDrawerChatBadge(drawerState.unreadChatCount);
    }
}

// Session Finish Functions
function handleFinish(reason) {
    // Session was ended by host
    alert(reason || 'This session has ended.');
    window.location.href = '/';
}

function handleFinishSession() {
    // Show confirmation modal instead of browser confirm
    const modal = document.getElementById('finish-confirm-modal');
    const input = document.getElementById('finish-confirm-input');
    const confirmBtn = document.getElementById('finish-confirm-btn');

    if (modal && input && confirmBtn) {
        modal.classList.add('visible');
        input.value = '';
        confirmBtn.disabled = true;
        input.focus();
    }
}

function setupFinishConfirmModal() {
    const modal = document.getElementById('finish-confirm-modal');
    const input = document.getElementById('finish-confirm-input');
    const confirmBtn = document.getElementById('finish-confirm-btn');
    const cancelBtn = document.getElementById('finish-confirm-cancel');

    if (!modal || !input || !confirmBtn || !cancelBtn) return;

    // Enable confirm button only when user types "END"
    input.addEventListener('input', () => {
        confirmBtn.disabled = input.value.toUpperCase() !== 'END';
    });

    // Confirm button - actually finish the session
    confirmBtn.addEventListener('click', () => {
        if (input.value.toUpperCase() === 'END') {
            modal.classList.remove('visible');
            client.finish();
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        input.value = '';
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            input.value = '';
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            modal.classList.remove('visible');
            input.value = '';
        }
    });
}

// CSV Export Functions
function exportToCsv() {
    if (!client.state) {
        alert('No data to export');
        return;
    }

    const state = client.state;
    const stories = state.stories;
    const participants = state.participants;
    const votesByStory = state.votesByStory;
    const lockedByStory = state.lockedByStory;

    if (stories.length === 0) {
        alert('No stories to export');
        return;
    }

    // Build CSV headers
    const participantNames = Object.entries(participants).map(([id, p]) => ({
        id,
        name: p.name
    }));

    const headers = ['Story Title', 'Notes', 'Final Estimate'];
    participantNames.forEach(p => {
        headers.push(p.name);
    });
    headers.push('Min', 'Max', 'Median', 'Spread');

    // Build CSV rows
    const rows = [headers];

    stories.forEach(story => {
        const votes = votesByStory[story.id] || {};
        const lockedValue = lockedByStory[story.id] || '';

        // Calculate stats
        const numericVotes = Object.values(votes)
            .map(v => parseFloat(v))
            .filter(n => !isNaN(n));

        let min = '', max = '', median = '', spread = '';
        if (numericVotes.length > 0) {
            numericVotes.sort((a, b) => a - b);
            min = Math.min(...numericVotes);
            max = Math.max(...numericVotes);
            const mid = Math.floor(numericVotes.length / 2);
            median = numericVotes.length % 2
                ? numericVotes[mid]
                : (numericVotes[mid - 1] + numericVotes[mid]) / 2;
            spread = max - min;
        }

        const row = [
            escapeCsvField(story.title),
            escapeCsvField(story.notes || ''),
            escapeCsvField(lockedValue)
        ];

        // Add each participant's vote
        participantNames.forEach(p => {
            row.push(escapeCsvField(votes[p.id] || ''));
        });

        row.push(min, max, median, spread);
        rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sprint-estimates-${roomId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeCsvField(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function showError(message) {
    elements.loadingContainer.classList.add('hidden');
    elements.roomUI.style.display = 'none';
    elements.nameModal.classList.add('hidden'); // Hide modal on error
    elements.errorContainer.classList.add('show');
    elements.errorMessage.textContent = message;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ FUN ELEMENTS ============

// Vibrant neon colors for dark theme
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#a855f7', '#14b8a6', '#fbbf24'];

// Agile-themed fortune cookies
const FORTUNES = [
    // Estimation wisdom
    { text: "The estimate you seek is hiding in plain sight", emoji: "🔮" },
    { text: "A story well-split is a story half-done", emoji: "✂️" },
    { text: "Today's 8 is tomorrow's 3... with the right refactor", emoji: "🎯" },
    { text: "The true complexity reveals itself after the sprint starts", emoji: "🙈" },
    { text: "Trust the team's gut - it knows more than the backlog", emoji: "🧠" },
    { text: "Small batches lead to big victories", emoji: "🏆" },
    { text: "The best estimate is the one the whole team believes in", emoji: "🤝" },
    { text: "Yesterday's blocker is tomorrow's learning", emoji: "📚" },

    // Sprint philosophy
    { text: "A sprint well planned is a sprint half done", emoji: "📋" },
    { text: "Velocity is a compass, not a speedometer", emoji: "🧭" },
    { text: "The standup that finishes on time brings good fortune", emoji: "⏰" },
    { text: "Technical debt paid today saves three sprints tomorrow", emoji: "💳" },
    { text: "The demo that goes smoothly was tested twice", emoji: "🎬" },
    { text: "Scope creep enters through unguarded acceptance criteria", emoji: "🚪" },

    // Team wisdom
    { text: "A team that estimates together, ships together", emoji: "🚀" },
    { text: "The quietest team member often sees the hidden risk", emoji: "👁️" },
    { text: "Consensus is not compromise - it is shared understanding", emoji: "💡" },
    { text: "Your future self will thank you for that unit test", emoji: "🔧" },
    { text: "The retro action item you ignore will return threefold", emoji: "🔄" },
    { text: "Cross-functional collaboration unlocks unexpected velocity", emoji: "🔓" },

    // Playful predictions
    { text: "An unexpected dependency approaches... be prepared", emoji: "⚠️" },
    { text: "Coffee and courage will carry this sprint to success", emoji: "☕" },
    { text: "The PR you review today saves debugging tomorrow", emoji: "👀" },
    { text: "A wild edge case appears! Your tests are ready", emoji: "🐛" },
    { text: "The next standup will bring good news", emoji: "🌟" },
    { text: "Your estimation skills grow stronger with each session", emoji: "💪" },
    { text: "The fibonacci sequence favors the prepared mind", emoji: "🌀" },
    { text: "May your merge conflicts be few and your tests be green", emoji: "🌿" },

    // Motivational
    { text: "Every great product started with a single user story", emoji: "📖" },
    { text: "Done is better than perfect, but tested is best", emoji: "✅" },
    { text: "The impediment you raise today clears the path for tomorrow", emoji: "🛤️" },
    { text: "Incremental progress beats big bang releases", emoji: "📈" },
    { text: "Your next breakthrough is just one spike away", emoji: "⚡" },
    { text: "The backlog is long, but so is your determination", emoji: "🎖️" },
];

function getRandomFortune() {
    return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}

let fortuneTimeout = null;

function showFortune() {
    if (!elements.fortuneToast) return;

    const fortune = getRandomFortune();
    elements.fortuneEmoji.textContent = fortune.emoji;
    elements.fortuneText.textContent = fortune.text;

    // Clear any existing timeout
    if (fortuneTimeout) {
        clearTimeout(fortuneTimeout);
    }

    // Show the toast
    elements.fortuneToast.classList.add('show');

    // Auto-hide after 6 seconds
    fortuneTimeout = setTimeout(() => {
        hideFortune();
    }, 6000);
}

function hideFortune() {
    if (!elements.fortuneToast) return;
    elements.fortuneToast.classList.remove('show');
    if (fortuneTimeout) {
        clearTimeout(fortuneTimeout);
        fortuneTimeout = null;
    }
}

function checkFunTriggers(state, derived) {
    // Only trigger fun stuff if fun mode is enabled
    if (!state.funMode) return;

    const currentVotes = state.currentStoryId
        ? Object.keys(state.votesByStory[state.currentStoryId] || {}).length
        : 0;
    const participantCount = Object.keys(state.participants).length;

    // Trigger confetti and fortune when phase changes to locked
    if (previousPhase && previousPhase !== 'locked' && state.phase === 'locked') {
        triggerConfetti();

        // Check for consensus (all votes the same)
        const votes = state.currentStoryId
            ? Object.values(state.votesByStory[state.currentStoryId] || {})
            : [];
        const numericVotes = votes.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
        const uniqueVotes = [...new Set(votes)];
        const isConsensus = uniqueVotes.length === 1 && votes.length > 1;
        const spread = numericVotes.length > 0
            ? Math.max(...numericVotes) - Math.min(...numericVotes)
            : 0;
        const isHighSpread = spread >= 5; // High spread threshold

        if (isConsensus) {
            // Perfect consensus!
            setTimeout(() => {
                showCelebration('🎯', 'Perfect Consensus!', `Everyone voted ${uniqueVotes[0]}`);
            }, 500);
            // Show fortune for consensus celebration
            setTimeout(() => {
                showFortune();
            }, 1200);
        } else if (isHighSpread) {
            showCelebration('🔒', 'Locked!', `Estimate: ${state.lockedByStory[state.currentStoryId]}`);
            // Show fortune for high-spread (conflict) situation
            setTimeout(() => {
                showFortune();
            }, 1200);
        } else {
            // Normal lock - no fortune, just celebration
            showCelebration('🔒', 'Locked!', `Estimate: ${state.lockedByStory[state.currentStoryId]}`);
        }
    }

    // Trigger celebration when everyone has voted (voting phase only)
    if (state.phase === 'voting' && participantCount > 1) {
        if (previousWaitingFor !== null && previousWaitingFor > 0 && derived.waitingFor === 0) {
            showCelebration('🎉', 'All Votes In!', 'Ready to reveal');
        }
    }

    // Trigger small celebration when a new vote comes in
    if (state.phase === 'voting' && currentVotes > previousVoteCount && previousVoteCount > 0) {
        // Someone just voted - add pulse effect to zone participants
        const grid = elements.zoneParticipantsTable;
        if (grid) {
            grid.classList.add('all-voted-pulse');
            setTimeout(() => grid.classList.remove('all-voted-pulse'), 1000);
        }
    }
}

function triggerConfetti() {
    if (!elements.confettiContainer) return;

    const container = elements.confettiContainer;
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        const shapes = ['circle', 'square', 'triangle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        confetti.className = `confetti ${shape}`;
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        confetti.style.width = (Math.random() * 8 + 6) + 'px';
        confetti.style.height = (Math.random() * 8 + 6) + 'px';

        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.5;

        confetti.style.animation = `confetti-fall ${duration}s ease-out ${delay}s forwards`;

        container.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000 + 100);
    }
}

function showCelebration(emoji, text, subtext) {
    if (!elements.celebrationOverlay) return;

    elements.celebrationEmoji.textContent = emoji;
    elements.celebrationText.textContent = text;
    elements.celebrationSubtext.textContent = subtext;

    elements.celebrationOverlay.classList.add('show');

    // Auto-hide after 2.5 seconds
    setTimeout(() => {
        elements.celebrationOverlay.classList.remove('show');
    }, 2500);
}

function triggerEmojiFloat(emoji, x, y) {
    const floater = document.createElement('div');
    floater.className = 'emoji-float';
    floater.textContent = emoji;
    floater.style.left = x + 'px';
    floater.style.top = y + 'px';

    document.body.appendChild(floater);

    // Remove after animation
    setTimeout(() => {
        floater.remove();
    }, 2000);

    // Also send as chat message if joined
    if (hasJoined && client) {
        client.sendChat(emoji);
    }
}

// Add vote card animation when clicking
function addVoteCardAnimation(value) {
    const cards = elements.zoneVotingCards?.querySelectorAll('.vote-card');
    if (cards) {
        cards.forEach(card => {
            const cardValue = card.querySelector('span')?.textContent || card.textContent;
            if (cardValue.trim() === value) {
                card.classList.add('just-voted');
                setTimeout(() => card.classList.remove('just-voted'), 400);
            }
        });
    }
}

// Override handleVoteClick to include animation
const originalHandleVoteClick = window.handleVoteClick;
window.handleVoteClick = function(value) {
    addVoteCardAnimation(value);
    if (client?.state?.currentStoryId) {
        client.vote(client.state.currentStoryId, value);
    }
};

// Fun sound effects (optional - only plays if user has interacted)
let audioContext = null;

function playVoteSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        // Audio not supported or blocked
    }
}

function playCelebrationSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 100);
        });
    } catch (e) {
        // Audio not supported or blocked
    }
}

// Expose functions to global scope for inline onclick handlers
window.handleVoteClick = handleVoteClick;
window.handleSelectStory = handleSelectStory;
window.selectQuickPick = selectQuickPick;

// Start
document.addEventListener('DOMContentLoaded', init);
