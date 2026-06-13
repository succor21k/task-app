import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4RVdQsLzahCjZ_SAhAjwFYaBfyK16074",
  authDomain: "work-order-ca2c2.firebaseapp.com",
  projectId: "work-order-ca2c2",
  storageBucket: "work-order-ca2c2.firebasestorage.app",
  messagingSenderId: "54932859953",
  appId: "1:54932859953:web:b83b5307002f48602c3910",
  measurementId: "G-1ZB00T7VE8"
};

// Next.js 환경에서 여러 번 초기화되는 것을 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore (데이터베이스) 및 Storage (파일 저장소) 인스턴스 내보내기
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
