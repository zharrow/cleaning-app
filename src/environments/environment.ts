import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyABEsIGWnPHyUzfclVEzjWEmHHnh6_0ILw",
    authDomain: "cleaning-app-toulouse.firebaseapp.com",
    projectId: "cleaning-app-toulouse",
    storageBucket: "cleaning-app-toulouse.firebasestorage.app",
    messagingSenderId: "971814563402",
    appId: "1:971814563402:web:4d0aa11a34c3a1eb8c40b3",
    measurementId: "G-P5YGVB17TC"
  },
  apiUrl: 'http://localhost:8000'
};

const app = initializeApp(environment.firebase);
const analytics = getAnalytics(app);