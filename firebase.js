import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "AIzaSyADyQu2IUei0qjFVl1dolYChVLkCEM0IdM",
  authDomain: "brewnello-tracker.firebaseapp.com",
  projectId: "brewnello-tracker",
  storageBucket: "brewnello-tracker.firebasestorage.app",
  messagingSenderId: "430339868986",
  appId: "1:430339868986:web:cec3f7651968732722e803",
  measurementId: "G-S675X43TX9"

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);