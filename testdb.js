import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
getDocs(collection(db, 'settings')).then(() => console.log('DB EXISTS AND QUERIED')).catch(e => console.error('FIREBASE ERROR:', e.message));
