// js/script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Suas configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRx2EYDi3FpfmJjttO2wd9zeFVV3uH6Q0",
    authDomain: "apartments-a4b17.firebaseapp.com",
    databaseURL: "https://apartments-a4b17-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "apartments-a4b17",
    storageBucket: "apartments-a4b17.appspot.com",
    messagingSenderId: "465612199373",
    appId: "1:465612199373:web:59f4d147e298603c532084"
  }; 

  // Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Teste de Escrita e Leitura
async function testarFirestore() {
    try {
        // Adicionar um documento de teste
        const docRef = await addDoc(collection(db, "testes"), {
            nome: "Teste",
            valor: 123
        });
        console.log("Documento adicionado com ID: ", docRef.id);

        // Ler os documentos da coleção 'testes'
        const querySnapshot = await getDocs(collection(db, "testes"));
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
        });
    } catch (e) {
        console.error("Erro ao adicionar ou ler documentos: ", e);
    }
}

// Chamar a função de teste ao carregar o script
testarFirestore();