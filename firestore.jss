import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-h-rYvoL2dZs-9Q9cNdTQFfjAQpnfdII",
  authDomain: "voiceflow-ai-1c0e8.firebaseapp.com",
  projectId: "voiceflow-ai-1c0e8",
  storageBucket: "voiceflow-ai-1c0e8.firebasestorage.app",
  messagingSenderId: "911732232577",
  appId: "1:911732232577:web:2c538a95eb270619839880",
  measurementId: "G-YY94W8GM6B"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment
};