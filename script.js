import app, { db } from './firebase.js';

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// =========================
// AUTH
// =========================

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// =========================
// ROOT
// =========================

const root =
    document.getElementById('root');

// =========================
// STATE
// =========================

let players = {};

let rounds = [];

// =========================
// RENDER LOGIN
// =========================

function renderLogin() {

    root.innerHTML = `

        <div
            class="min-h-screen flex items-center justify-center p-6"
        >

            <div
                class="section-card max-w-md w-full text-center"
            >

                <h1 class="text-4xl font-black mb-3">
                    BrewNello Tracker
                </h1>

                <p class="text-gray-400 mb-8">
                    Sign in to continue
                </p>

                <button
                    id="google-login"
                    class="btn-primary w-full"
                >
                    Sign In With Google
                </button>

            </div>

        </div>
    `;

    document
        .getElementById('google-login')
        .addEventListener(
            'click',
            async () => {

                try {

                    await signInWithPopup(
                        auth,
                        provider
                    );

                } catch (err) {

                    console.error(err);

                    alert('Login failed');
                }
            }
        );
}

// =========================
// RENDER APP
// =========================

function renderApp(user) {

    root.innerHTML = `

        <div class="page-container">
        <!-- Header -->
        <div
            class="
                flex
                flex-col
                gap-6
                md:flex-row
                md:items-start
                md:justify-between
            "
        >

            <!-- LEFT -->
            <div class="min-w-0">

                <h1
                    class="
                        text-5xl
                        md:text-6xl
                        font-black
                        text-white
                        leading-none
                    "
                >
                    BrewNello
                    <br />
                    Tracker
                </h1>

                <p
                    class="
                        text-gray-400
                        mt-4
                        text-xl
                        max-w-md
                    "
                >
                    Track rounds and remaining holes.
                </p>

            </div>

            <!-- RIGHT -->
            <div
                class="
                    flex
                    flex-col
                    items-start
                    gap-3
                    md:items-end
                    shrink-0
                "
            >

                <div
                    class="
                        text-sm
                        text-gray-400
                        break-all
                        text-left
                        md:text-right
                        max-w-[220px]
                    "
                >
                    ${user.email}
                </div>

                <button
                    id="logout-btn"
                    class="action-btn"
                >
                    Logout
                </button>

            </div>

        </div>

            <!-- PLAYER CARDS -->
            <div
                id="player-cards"
                class="grid gap-4 md:grid-cols-3"
            ></div>

            <!-- ADD ROUND -->
            <div class="section-card">

                <h2 class="text-2xl font-bold mb-6">
                    Add Round
                </h2>

                <div
                    class="grid gap-4 md:grid-cols-2"
                >

                    <div>

                        <label>
                            Player
                        </label>

                        <select
                            id="name"
                            class="input"
                        >
                            <option>Andy</option>
                            <option>Scott</option>
                            <option>Stew</option>
                        </select>

                    </div>

                    <div>

                        <label>
                            Date
                        </label>

                        <input
                            type="date"
                            id="date"
                            class="input"
                        />

                    </div>

                    <div>

                        <label>
                            Holes
                        </label>

                        <input
                            type="number"
                            id="holes"
                            class="input"
                            min="1"
                            max="18"
                        />

                    </div>

                    <div>

                        <label>
                            Comments
                        </label>

                        <input
                            type="text"
                            id="comments"
                            class="input"
                        />

                    </div>

                </div>

                <button
                    id="add-round"
                    class="btn-primary mt-6"
                >
                    Add Round
                </button>

            </div>

            <!-- ROUNDS -->
            <div class="section-card">

                <h2
                    class="text-2xl font-bold mb-6"
                >
                    Rounds
                </h2>

                <div class="table-shell">

                    <table class="table-base">

                        <thead>

                            <tr>
                                <th>Player</th>
                                <th>Date</th>
                                <th>Holes</th>
                                <th>Comments</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody
                            id="rounds-table-body"
                        ></tbody>

                    </table>

                </div>

            </div>

        </div>
    `;

    bindAppEvents();

    loadPlayers();

    listenForRounds();
}

// =========================
// APP EVENTS
// =========================

function bindAppEvents() {

    document
        .getElementById('logout-btn')
        .addEventListener(
            'click',
            async () => {

                await signOut(auth);
            }
        );

    document
        .getElementById('add-round')
        .addEventListener(
            'click',
            addRound
        );
}

// =========================
// AUTH STATE
// =========================

onAuthStateChanged(auth, async user => {

    if (!user) {

        renderLogin();

        return;
    }

    renderApp(user);
});

// =========================
// LOAD PLAYERS
// =========================

async function loadPlayers() {

    try {

        players = {};

        const snapshot =
            await getDocs(
                collection(db, 'players')
            );

        snapshot.forEach(docSnap => {

            players[docSnap.id] = {

                id: docSnap.id,

                ...docSnap.data()
            };
        });

        renderPlayerCards();

    } catch (err) {

        console.error(err);

        alert(
            'You are not authorized to access this app.'
        );

        await signOut(auth);
    }
}

// =========================
// REALTIME ROUNDS
// =========================

function listenForRounds() {

    onSnapshot(
        collection(db, 'rounds'),
        snapshot => {

            rounds = [];

            snapshot.forEach(docSnap => {

                rounds.push({

                    id: docSnap.id,

                    ...docSnap.data()
                });
            });

            updateTable();

            renderPlayerCards();
        }
    );
}

// =========================
// PLAYER CARDS
// =========================

function renderPlayerCards() {

    const playerCards =
        document.getElementById(
            'player-cards'
        );

    if (!playerCards) return;

    playerCards.innerHTML = '';

    Object.values(players).forEach(player => {

        const playerRounds =
            rounds.filter(round =>
                round.name === player.id
            );

        const used =
            playerRounds.reduce(
                (sum, round) =>
                    sum + (
                        parseInt(round.holes) || 0
                    ),
                0
            );

        const totalHoles =
            parseInt(player.totalHoles) || 180;

        const remaining =
            totalHoles - used;

        const percent = Math.min(
            (used / totalHoles) * 100,
            100
        );

        const card =
            document.createElement('div');

        card.className = 'stat-card';

        card.innerHTML = `

            <div
                class="flex items-start justify-between"
            >

                <div>

                    <div class="stat-title">
                        ${player.id} Remaining
                    </div>

                    <div
                        class="stat-number text-green-400"
                    >
                        ${remaining}
                    </div>

                    <div
                        class="text-sm text-gray-400 mt-1"
                    >
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

        card.addEventListener(
            'click',
            async () => {

                const newTotal = prompt(
                    `Update total holes for ${player.id}`,
                    totalHoles
                );

                if (!newTotal) return;

                const parsed =
                    parseInt(newTotal);

                if (isNaN(parsed)) return;

                await updateDoc(
                    doc(
                        db,
                        'players',
                        player.id
                    ),
                    {
                        totalHoles: parsed
                    }
                );

                players[player.id].totalHoles =
                    parsed;

                renderPlayerCards();
            }
        );

        playerCards.appendChild(card);
    });
}

// =========================
// UPDATE TABLE
// =========================

function updateTable() {

    const roundsTableBody =
        document.getElementById(
            'rounds-table-body'
        );

    if (!roundsTableBody) return;

    roundsTableBody.innerHTML = '';

    const sorted =
        [...rounds].sort(
            (a, b) =>
                getTimestampValue(b.date) -
                getTimestampValue(a.date)
        );

    sorted.forEach(round => {

        const row =
            document.createElement('tr');

        row.innerHTML = `

            <td>${round.name}</td>

            <td>
                ${formatDate(round.date)}
            </td>

            <td>${round.holes}</td>

            <td>
                ${round.comments || '-'}
            </td>

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

// =========================
// ACTION BUTTONS
// =========================

function bindActionButtons() {

    document
        .querySelectorAll('.delete-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                async () => {

                    const id =
                        btn.dataset.id;

                    await deleteDoc(
                        doc(db, 'rounds', id)
                    );
                }
            );
        });

    document
        .querySelectorAll('.edit-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                async () => {

                    const id =
                        btn.dataset.id;

                    const round =
                        rounds.find(
                            r => r.id === id
                        );

                    const newHoles = prompt(
                        'Update holes',
                        round.holes
                    );

                    if (!newHoles) return;

                    const parsed =
                        parseInt(newHoles);

                    if (isNaN(parsed)) return;

                    await updateDoc(
                        doc(db, 'rounds', id),
                        {
                            holes: parsed
                        }
                    );
                }
            );
        });
}

// =========================
// ADD ROUND
// =========================

async function addRound() {

    const name =
        document.getElementById('name').value;

    const date =
        document.getElementById('date').value;

    const holes = parseInt(
        document.getElementById('holes').value
    );

    const comments =
        document.getElementById('comments').value;

    if (
        !name ||
        !date ||
        isNaN(holes)
    ) {

        alert(
            'Please complete all fields'
        );

        return;
    }

    const [year, month, day] =
        date.split('-').map(Number);

    const localDate =
        new Date(year, month - 1, day);

    await addDoc(
        collection(db, 'rounds'),
        {

            name,

            date: Timestamp.fromDate(
                localDate
            ),

            holes,

            comments
        }
    );

    document.getElementById('holes').value =
        '';

    document.getElementById('comments').value =
        '';
}

// =========================
// DATE HELPERS
// =========================

function formatDate(dateValue) {

    if (!dateValue) return '-';

    try {

        if (
            typeof dateValue.toDate ===
            'function'
        ) {

            return dateValue
                .toDate()
                .toLocaleDateString(
                    'en-CA',
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }
                );
        }

        return new Date(dateValue)
            .toLocaleDateString(
                'en-CA',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }
            );

    } catch {

        return '-';
    }
}

function getTimestampValue(dateValue) {

    if (!dateValue) return 0;

    try {

        if (
            typeof dateValue.toDate ===
            'function'
        ) {

            return dateValue
                .toDate()
                .getTime();
        }

        return new Date(dateValue)
            .getTime();

    } catch {

        return 0;
    }
}