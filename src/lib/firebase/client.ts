import { type AI, GoogleAIBackend, getAI } from "firebase/ai";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Firestore, getFirestore } from "firebase/firestore";

import { firebaseConfig } from "@/lib/firebase/config";

function app(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function db(): Firestore {
  return getFirestore(app());
}

let ai: AI | undefined;

export function geminiBackend(): AI {
  ai ??= getAI(app(), { backend: new GoogleAIBackend() });
  return ai;
}
