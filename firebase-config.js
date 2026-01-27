// Firebase Configuration and Initialization
// IMPORT: replace with actual Firebase CDN URLs if using in a browser environments
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// REPLACE THESE VALUES with your actual Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyBNY9DbsJp2_miQUN-4eH4bwEsOH-b5cxk",
    authDomain: "ev-analytics-c36f7.firebaseapp.com",
    projectId: "ev-analytics-c36f7",
    storageBucket: "ev-analytics-c36f7.firebasestorage.app",
    messagingSenderId: "777554406177",
    appId: "1:777554406177:web:0806a3d17f43188bb1ec60",
    measurementId: "G-LFQY1VWV4W"
};

// Initialize Firebase
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("⚡ Firebase Initialized Successfully: ev-analytics-c36f7");
} catch (error) {
    console.error("❌ Firebase Initialization Failed:", error);
}

export { auth, db };
