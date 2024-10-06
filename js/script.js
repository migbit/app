// js/script.js

// Importar as funções necessárias do Firebase e EmailJS
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import emailjs from "https://cdn.emailjs.com/dist/email.min.js";

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

// Exportar Firestore para uso nos outros módulos
export { db };

// Exemplo: Função para copiar texto
function copiarMensagem(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Exportar a função se necessário
export { copiarMensagem };

// Inicializar EmailJS
(function() {
    emailjs.init("service_tuglp9h"); // Substitua por seu Service ID obtido no EmailJS Dashboard
})();

// Função para enviar um e-mail de urgência usando EmailJS
function enviarEmailUrgencia() {
    const templateParams = {
        to_name: "apartments.oporto@gmail.com",
        from_name: "Apartments Oporto",
        subject: "Reparação Urgente Necessária",
        message: "Teste de envio de e-mail para verificação do funcionamento do serviço."
    };

    emailjs.send('service_tuglp9h', 'default_template', templateParams)
        .then(function(response) {
            console.log('E-mail enviado com sucesso!', response.status, response.text);
        }, function(error) {
            console.error('Erro ao enviar e-mail:', error);
        });
}

// Exportar a função de e-mail se necessário
export { enviarEmailUrgencia };