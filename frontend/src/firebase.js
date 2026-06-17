import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdjqWv-4PcfXmOHnAJsw_9yWtF8wQObNk",
  authDomain: "bedkey.firebaseapp.com",
  projectId: "bedkey",
  storageBucket: "bedkey.firebasestorage.app",
  messagingSenderId: "1002493902473",
  appId: "1:1002493902473:web:10657f362b3f8d84d39058"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
