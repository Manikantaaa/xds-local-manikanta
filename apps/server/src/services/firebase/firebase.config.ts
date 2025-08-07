import { applicationDefault } from "firebase-admin/app";
// import { getAuth, signOut } from "firebase/auth";

const firebaseRealTimeDB = "" + process.env.XDS_FIREBASE_REALTIME_DB;
export const FIREBASE_ADMIN_CONFIG = {
  credential: applicationDefault(),
  databaseURL: firebaseRealTimeDB,
};

// export const FIREBASE_CONFIG = {
//   apiKey: process.env.XDS_FIREBASE_API_KEY,
//   authDomain: process.env.XDS_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.XDS_FIREBASE_PROJECT_ID,
// };

