// script.js

// Estrutura de dados das mensagens
const mensagensData = {
    "Antes Reserva": {
        "Baixar Preço": {
            "Português": "Aqui está a mensagem para Baixar Preço em Português.",
            "Inglês": "Here is the message for Baixar Preço in English.",
            "Espanhol": "Aquí está el mensaje para Baixar Preço en Español.",
            "Francês": "Voici le message pour Baixar Preço en Français.",
            "Alemão": "Hier ist die Nachricht für Baixar Preço auf Deutsch.",
            "Italiano": "Ecco il messaggio per Baixar Preço in Italiano."
        },
        "Estacionamento 123": {
            "Português": "Mensagem para Estacionamento 123 em Português.",
            "Inglês": "Message for Estacionamento 123 in English.",
            "Espanhol": "Mensaje para Estacionamento 123 en Español.",
            "Francês": "Message pour Estacionamento 123 en Français.",
            "Alemão": "Nachricht für Estacionamento 123 auf Deutsch.",
            "Italiano": "Messaggio per Estacionamento 123 in Italiano."
        },
        // Adicione mais opções conforme necessário
    },
    "Antes do Check-in": {
        "Segunda-feira": {
            "Português": "Mensagem para Segunda-feira em Português.",
            "Inglês": "Message for Monday in English.",
            "Espanhol": "Mensaje para Lunes en Español.",
            "Francês": "Message pour Lundi en Français.",
            "Alemão": "Nachricht für Montag auf Deutsch.",
            "Italiano": "Messaggio per Lunedì in Italiano."
        },
        "Terça-feira": {
            "Português": "Mensagem para Terça-feira em Português.",
            "Inglês": "Message for Tuesday in English.",
            "Espanhol": "Mensaje para Martes en Español.",
            "Francês": "Message pour Mardi en Français.",
            "Alemão": "Nachricht für Dienstag auf Deutsch.",
            "Italiano": "Messaggio per Martedì in Italiano."
        },
        // Adicione mais opções conforme necessário
    },
    "Chegada ao Porto": {
        "Instruções metro aeroporto": {
            "Português": "Mensagem de instruções para o metro do aeroporto em Português.",
            "Inglês": "Airport metro instructions message in English.",
            "Espanhol": "Mensaje de instrucciones del metro del aeropuerto en Español.",
            "Francês": "Message d'instructions du métro de l'aéroport en Français.",
            "Alemão": "Nachricht mit Anweisungen für die Flughafubahn auf Deutsch.",
            "Italiano": "Messaggio delle istruzioni per la metro dell'aeroporto in Italiano."
        },
        // Adicione mais opções conforme necessário
    },
    // Adicione mais categorias conforme necessário
};

// Elementos do DOM
const idiomaSelect = document.getElementById('idioma');
const categoriaContainer = document.getElementById('categoria-container');
const categoriaSelect = document.getElementById('categoria');
const opcaoContainer = document.getElementById('opcao-container');
const opcaoSelect = document.getElementById('opcao');
const smsContainer = document.getElementById('sms-container');
const mensagemContainer = document.getElementById('mensagem-container');
const mensagemP = document.getElementById('mensagem');

// Event Listener para seleção de Idioma
idiomaSelect.addEventListener('change', () => {
    const idioma = idiomaSelect.value;
    if (idioma) {
        categoriaContainer.style.display = 'block';
    } else {
        categoriaContainer.style.display = 'none';
        opcaoContainer.style.display = 'none';
        mensagemContainer.style.display = 'none';
    }
    // Resetar seleções subsequentes
    categoriaSelect.value = '';
    opcaoSelect.innerHTML = '<option value="">-- Selecionar Opção --</option>';
    opcaoContainer.style.display = 'none';
    smsContainer.style.display = 'none';
    mensagemContainer.style.display = 'none';
});

// Event Listener para seleção de Categoria
categoriaSelect.addEventListener('change', () => {
    const categoria = categoriaSelect.value;
    const idioma = idiomaSelect.value;
    if (categoria) {
        opcaoContainer.style.display = 'block';
        // Populando as opções com base na categoria
        opcaoSelect.innerHTML = '<option value="">-- Selecionar Opção --</option>';
        const opcoes = Object.keys(mensagensData[categoria]);
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao;
            opcaoSelect.appendChild(option);
        });
    } else {
        opcaoContainer.style.display = 'none';
        mensagemContainer.style.display = 'none';
    }
    // Resetar seleções subsequentes
    opcaoSelect.value = '';
    mensagemContainer.style.display = 'none';
    smsContainer.style.display = 'none';
});

// Event Listener para seleção de Opção
opcaoSelect.addEventListener('change', () => {
    const opcao = opcaoSelect.value;
    const categoria = categoriaSelect.value;
    const idioma = idiomaSelect.value;
    if (opcao) {
        // Verificar se a categoria exige a opção SMS
        if (categoria === 'Antes do Check-in') {
            smsContainer.style.display = 'block';
        } else {
            smsContainer.style.display = 'none';
        }

        // Buscar a mensagem correspondente
        const mensagem = mensagensData[categoria][opcao][idioma];
        mensagemP.textContent = mensagem;
        mensagemContainer.style.display = 'block';
    } else {
        mensagemContainer.style.display = 'none';
        smsContainer.style.display = 'none';
    }
});

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = mensagemP.textContent;
    if (mensagem) {
        navigator.clipboard.writeText(mensagem).then(() => {
            alert('Mensagem copiada para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar a mensagem: ', err);
        });
    }
}
