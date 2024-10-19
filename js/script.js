// Importar as funções necessárias do Firebase e EmailJS
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRx2EYDi3FpfmJjttO2wd9zeFVV3uH6Q0",
    authDomain: "apartments-a4b17.firebaseapp.com",
    projectId: "apartments-a4b17",
    storageBucket: "apartments-a4b17.appspot.com",
    messagingSenderId: "465612199373",
    appId: "1:465612199373:web:2b8e1eb14f453caa532084"
};

// Inicializar Firebase apenas se não estiver já inicializado
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized.");
} else {
    app = getApps()[0]; // Usa a instância já existente
    console.log("Firebase app already initialized.");
}

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar o Firebase Authentication e o provedor do Google
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Função de login com Google
function loginComGoogle() {
    signInWithPopup(auth, provider)
    .then((result) => {
        // O utilizador autenticou-se com sucesso
        const user = result.user;
        console.log("Utilizador autenticado:", user.displayName, user.email);
        atualizarInterface(user);
    })
    .catch((error) => {
        // Tratar erros
        console.error("Erro na autenticação com o Google:", error.message);
    });
}

// Função de logout
function logout() {
    signOut(auth)
    .then(() => {
        console.log("Utilizador saiu com sucesso.");
        atualizarInterface(null);
    })
    .catch((error) => {
        console.error("Erro ao sair:", error.message);
    });
}

// Verificar o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        // O utilizador está autenticado
        console.log("Utilizador autenticado:", user.displayName);
        atualizarInterface(user);
    } else {
        // O utilizador não está autenticado
        console.log("Nenhum utilizador autenticado.");
        atualizarInterface(null);
    }
});

// Atualizar a interface de acordo com o estado de autenticação
function atualizarInterface(user) {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');

    if (user) {
        // Utilizador autenticado
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userInfo.style.display = 'block';
        userName.textContent = user.displayName;
        userEmail.textContent = user.email;
    } else {
        // Nenhum utilizador autenticado
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
    }
}

// Função para copiar texto (mantida do código anterior)
function copiarMensagem(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Exportar funções necessárias
export { db, copiarMensagem };

// Função para enviar um e-mail de urgência usando EmailJS (mantida do código anterior)
export function enviarEmailUrgencia(apartamento, descricao) {
    emailjs.send('service_tuglp9h', 'template_l516egr', {
        to_name: "apartments.oporto@gmail.com",
        from_name: "Apartments Oporto",
        subject: "Reparação Urgente Necessária",
        message: `Uma nova reparação urgente foi registrada no apartamento ${apartamento}: ${descricao}`
    })
    .then(function(response) {
        console.log('E-mail enviado com sucesso!', response.status, response.text);
    }, function(error) {
        console.error('Erro ao enviar e-mail:', error);
    });
}

// Attach the function to the window object if needed (for testing)
window.enviarEmailUrgencia = enviarEmailUrgencia;

// Event listeners para os botões de login e logout
document.getElementById('login-btn').addEventListener('click', loginComGoogle);
document.getElementById('logout-btn').addEventListener('click', logout);
