import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpzPnGr8sQZt-F2OQw3RLvgDo8G7hf9uc",
  authDomain: "mem-test-psy.firebaseapp.com",
  projectId: "mem-test-psy",
  storageBucket: "mem-test-psy.appspot.com",
  messagingSenderId: "485168375838",
  appId: "1:485168375838:web:6dcd059bbb1a0ceba2660f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, signInAnonymously, onAuthStateChanged };
