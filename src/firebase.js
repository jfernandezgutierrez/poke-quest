// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs,getDoc  } from "firebase/firestore";

// Importa otros servicios que necesites de Firebase

const firebaseConfig = {
    apiKey: "AIzaSyAXdvPbrFzZHbpBWFoT7vIf8_SecjTmgxY",
    authDomain: "poke-quest-547ef.firebaseapp.com",
    projectId: "poke-quest-547ef",
    storageBucket: "poke-quest-547ef.appspot.com",
    messagingSenderId: "57037074571",
    appId: "1:57037074571:web:b0e794892e3d68ee78a48e"
  };

  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();
  
  export {
    auth,
    googleProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs // Asegúrate de exportar getDoc
  };
