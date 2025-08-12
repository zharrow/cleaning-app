import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const environment = {
  production: true,
  firebase: {
    apiKey: "YOUR_PROD_API_KEY",
    authDomain: "YOUR_PROD_AUTH_DOMAIN",
    projectId: "YOUR_PROD_PROJECT_ID",
    storageBucket: "YOUR_PROD_STORAGE_BUCKET",
    messagingSenderId: "YOUR_PROD_MESSAGING_SENDER_ID",
    appId: "YOUR_PROD_APP_ID"
  },
  apiUrl: 'https://api.your-domain.com'
};

const app = initializeApp(environment.firebase);
const analytics = getAnalytics(app);