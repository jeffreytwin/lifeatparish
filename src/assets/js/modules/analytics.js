import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyC7axVirp8Mz4Be9QmawECpVRUPfG-xRIA",
    authDomain: "lifeatparrish.firebaseapp.com",
    projectId: "lifeatparrish",
    storageBucket: "lifeatparrish.firebasestorage.app",
    messagingSenderId: "884369757057",
    appId: "1:884369757057:web:c181c32cf8e13558710e80",
    measurementId: "G-4PHFJYJYZF"
};

export function initAnalytics() {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    // Log initialization in dev mode for verification
    if (import.meta.env.DEV) {
        console.log('Firebase Analytics initialized');
    }
    return analytics;
}
