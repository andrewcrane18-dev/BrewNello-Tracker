import { db } from './firebase.js';

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const roundsTableBody = document.getElementById('rounds-table-body');
const playerCards = document.getElementById('player-cards');
const addRoundButton = document.getElementById('add-round');

let players = {};
let rounds = [];


function formatDate(dateValue) {

    if (!dateValue) return '-';

    try {

        // Firestore Timestamp
        if (typeof dateValue.toDate === 'function') {

            return dateValue.toDate().toLocaleDateString(
                'en-CA',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }
            );
        }

        // plain string fallback
        return new Date(dateValue).toLocaleDateString(
            'en-CA',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }
        );

    } catch (err) {

        console.error('Date formatting error:', err);

        return '-';
    }
}

// LOAD PLAYERS
async function loadPlayers() {

    const snapshot = await getDocs(collection(db, 'players'));

    snapshot.forEach(docSnap => {

        players[docSnap.id] = {
            id: docSnap.id,
            ...docSnap.data()
        };
    });

    renderPlayerCards();
}

// REALTIME ROUNDS
function listenForRounds() {

    onSnapshot(collection(db, 'rounds'), snapshot => {

        rounds = [];

        snapshot.forEach(docSnap => {

            rounds.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        updateTable();
        renderPlayerCards();
    });
}

// PLAYER CARDS
function renderPlayerCards() {

    playerCards.innerHTML = '';

    // no players yet
    if (!players || Object.keys(players).length === 0) {
        return;
    }

    Object.values(players).forEach(player => {

        // safe round filtering
        const playerRounds = rounds.filter(round =>
            round &&
            round.name === player.id
        );

        // safe holes total
        const used = playerRounds.reduce((sum, round) => {

            const holes = parseInt(round.holes);

            return sum + (isNaN(holes) ? 0 : holes);

        }, 0);

        const totalHoles =
            parseInt(player.totalHoles) || 180;

        const remaining =
            totalHoles - used;

        const percent = Math.min(
            (used / totalHoles) * 100,
            100
        );

        const card = document.createElement('div');

        card.className = 'stat-card';

        card.innerHTML = `
            <div class="flex items-start justify-between">

                <div>

                    <div class="stat-title">
                        ${player.id} Remaining
                    </div>

                    <div class="stat-number text-green-400">
                        ${remaining}
                    </div>

                    <div class="text-sm text-gray-400 mt-1">
                        ${used} / ${totalHoles} used
                    </div>

                </div>

                <div
                    class="h-12 w-12 rounded-full
                    bg-green-500/20
                    border border-green-400/20
                    flex items-center justify-center
                    font-bold text-green-300"
                >
                    ${player.id[0]}
                </div>

            </div>

            <div class="progress-track">
                <div
                    class="progress-fill"
                    style="width:${percent}%"
                ></div>
            </div>
        `;

        card.addEventListener('click', async () => {

            const newTotal = prompt(
                `Update total holes for ${player.id}`,
                totalHoles
            );

            if (!newTotal) return;

            const parsed = parseInt(newTotal);

            if (isNaN(parsed)) return;

            await updateDoc(
                doc(db, 'players', player.id),
                {
                    totalHoles: parsed
                }
            );

            players[player.id].totalHoles = parsed;

            renderPlayerCards();
        });

        playerCards.appendChild(card);
    });
}

// TABLE
function updateTable() {

    roundsTableBody.innerHTML = '';

    const sorted = [...rounds].sort((a, b) => {

        const aTime = getTimestampValue(a.date);
        const bTime = getTimestampValue(b.date);

        return bTime - aTime;
    });

    sorted.forEach(round => {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${round.name || '-'}</td>
            <td>${formatDate(round.date)}</td>
            <td>${round.holes || 0}</td>
            <td>${round.comments || '-'}</td>

            <td>
                <div class="flex gap-2">

                    <button
                        class="action-btn edit-btn"
                        data-id="${round.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-id="${round.id}"
                    >
                        Delete
                    </button>

                </div>
            </td>
        `;

        roundsTableBody.appendChild(row);
    });

    bindActionButtons();
}

// ACTION BUTTONS
function bindActionButtons() {

    document.querySelectorAll('.delete-btn').forEach(btn => {

        btn.addEventListener('click', async () => {

            const id = btn.dataset.id;

            if (!confirm('Delete this round?')) return;

            await deleteDoc(doc(db, 'rounds', id));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {

        btn.addEventListener('click', async () => {

            const id = btn.dataset.id;

            const round = rounds.find(r => r.id === id);

            const newHoles = prompt(
                'Update holes',
                round.holes
            );

            if (!newHoles) return;

            await updateDoc(doc(db, 'rounds', id), {
                holes: parseInt(newHoles)
            });
        });
    });
}

// ADD ROUND
addRoundButton.addEventListener('click', async () => {

    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const holes = parseInt(document.getElementById('holes').value);
    const comments = document.getElementById('comments').value;

    if (!name || !date || isNaN(holes)) {
        alert('Please complete all fields');
        return;
    }

    await addDoc(collection(db, 'rounds'), {
        name,
        date,
        holes,
        comments
    });

    document.getElementById('holes').value = '';
    document.getElementById('comments').value = '';
});

// INIT
await loadPlayers();
listenForRounds();