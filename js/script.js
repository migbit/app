// js/script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// TODO: Substitua os valores abaixo pelas suas configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRx2EYDi3FpfmJjttO2wd9zeFVV3uH6Q0",
    authDomain: "apartments-a4b17.firebaseapp.com",
    databaseURL: "https://apartments-a4b17-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "apartments-a4b17",
    storageBucket: "apartments-a4b17.appspot.com",
    messagingSenderId: "465612199373",
    appId: "1:465612199373:web:59f4d147e298603c532084"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);