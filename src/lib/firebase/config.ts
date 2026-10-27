// Public web config. Firebase web keys and the Maps browser key identify the project,
// they do not authorise anything, so they ship to the client by design. They live here
// rather than in env vars because `requireEnv(name)` reads `process.env[name]`
// dynamically, which Next does not inline into client bundles.
export const firebaseConfig = {
  apiKey: "AIzaSyBL9tQJ7X7-btWqwkj5x7QQdM3_7oXOhYM",
  authDomain: "yonja-5b8de.firebaseapp.com",
  projectId: "yonja-5b8de",
  storageBucket: "yonja-5b8de.firebasestorage.app",
  messagingSenderId: "904404628916",
  appId: "1:904404628916:web:aef82fd9bdc5df16f52ee1",
  measurementId: "G-MSHECL1QQP",
} as const;

export const MAPS_API_KEY = "AIzaSyAuG393ixgNhev-xWCNqLClnkTgZtBn-1E";
