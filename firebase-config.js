// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgnRq9OTI72vrjJ3ziBgXecij-1s60Wu8",
  authDomain: "question-51078.firebaseapp.com",
  projectId: "question-51078",
  storageBucket: "question-51078.appspot.com",
  messagingSenderId: "1085814355948",
  appId: "1:1085814355948:web:f02fc74257c13b6e1032c9",
  measurementId: "G-P20WQ1D41P"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const db = firebase.firestore();
let storage;
try {
    storage = firebase.storage();
} catch (error) {
    console.warn('Firebase Storage not initialized:', error);
}
let analytics;
try {
    analytics = firebase.analytics();
} catch (error) {
    console.warn('Firebase Analytics not initialized:', error);
}
  