// js/mensagens.js

// Objeto que armazena todas as mensagens categorizadas por idioma e categoria
const mensagens = {
    "Antes Reserva": {
        "Baixar Preço": {
            "Português": "Olá! Para baixar o preço, siga este link: [link]",
            "Inglês": "Hello! To lower the price, follow this link: [link]",
            "Espanhol": "¡Hola! Para bajar el precio, sigue este enlace: [link]",
            "Francês": "Bonjour! Pour baisser le prix, suivez ce lien: [link]",
            "Alemão": "Hallo! Um den Preis zu senken, folgen Sie diesem Link: [link]",
            "Italiano": "Ciao! Per abbassare il prezzo, segui questo link: [link]"
        },
        "Estacionamento 123": {
            "Português": "Estacionamento 123 está disponível para sua reserva.",
            "Inglês": "Parking 123 is available for your reservation.",
            "Espanhol": "El estacionamiento 123 está disponible para su reserva.",
            "Francês": "Le parking 123 est disponible pour votre réservation.",
            "Alemão": "Parkplatz 123 ist für Ihre Reservierung verfügbar.",
            "Italiano": "Il parcheggio 123 è disponibile per la tua prenotazione."
        },
        // Adicione outras opções conforme necessário
    },
    "Antes do Check-in": {
        "Segunda-feira": {
            "Português": "Informações para check-in na segunda-feira.",
            "Inglês": "Check-in information for Monday.",
            "Espanhol": "Información de check-in para el lunes.",
            "Francês": "Informations de check-in pour lundi.",
            "Alemão": "Check-in-Informationen für Montag.",
            "Italiano": "Informazioni per il check-in lunedì."
        },
        // Adicione outras opções conforme necessário
    },
    "Chegada ao Porto": {
        "Instruções metro aeroporto": {
            "Português": "Siga as instruções do metrô para chegar ao aeroporto.",
            "Inglês": "Follow the metro instructions to reach the airport.",
            "Espanhol": "Siga las instrucciones del metro para llegar al aeropuerto.",
            "Francês": "Suivez les instructions du métro pour arriver à l'aéroport.",
            "Alemão": "Folgen Sie den Metroanweisungen, um den Flughafen zu erreichen.",
            "Italiano": "Segui le istruzioni della metro per raggiungere l'aeroporto."
        },
        // Adicione outras opções conforme necessário
    },
    "Durante a Estadia": {
        "Papel Higiénico 123": {
            "Português": "O papel higiênico 123 está disponível.",
            "Inglês": "Toilet paper 123 is available.",
            "Espanhol": "El papel higiénico 123 está disponible.",
            "Francês": "Le papier toilette 123 est disponible.",
            "Alemão": "Toilettenpapier 123 ist verfügbar.",
            "Italiano": "La carta igienica 123 è disponibile."
        },
        // Adicione outras opções conforme necessário
    },
    "Check-Out": {
        "Agradecimento": {
            "Português": "Obrigado por se hospedar conosco!",
            "Inglês": "Thank you for staying with us!",
            "Espanhol": "¡Gracias por hospedarse con nosotros!",
            "Francês": "Merci d'avoir séjourné avec nous!",
            "Alemão": "Danke, dass Sie bei uns übernachtet haben!",
            "Italiano": "Grazie per aver soggiornato con noi!"
        },
        // Adicione outras opções conforme necessário
    },
    "Comentário": {
        // Adicione opções de comentários conforme necessário
    }
};

// Selecionar elementos do DOM
const idiomaSelect = document.getElementById('idioma');
const categoriaDiv = document.getElementById('categoria-div');
const categoriaSelect = document.getElementById('categoria');
const opcaoDiv = document.getElementById('opcao-div');
const opcaoSelect = document.getElementById('opcao');
const mensagemSecao = document.getElementById('mensagem-secao');
const mensagemP = document.getElementById('mensagem');

// Evento para quando o idioma for selecionado
idiomaSelect.addEventListener('change', () => {
    const idioma = idiomaSelect.value;
    if (idioma) {
        categoriaDiv.style.display = 'block';
        opcaoDiv.style.display = 'none';
        opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
        mensagemSecao.style.display = 'none';
    } else {
        categoriaDiv.style.display = 'none';
        opcaoDiv.style.display = 'none';
        mensagemSecao.style.display = 'none';
    }
});

// Evento para quando a categoria for selecionada
categoriaSelect.addEventListener('change', () => {
    const categoria = categoriaSelect.value;
    if (categoria) {
        opcaoDiv.style.display = 'block';
        mensagemSecao.style.display = 'none';
        opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';

        const opcoes = Object.keys(mensagens[categoria]);
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao;
            opcaoSelect.appendChild(option);
        });
    } else {
        opcaoDiv.style.display = 'none';
        mensagemSecao.style.display = 'none';
    }
});

// Evento para quando a opção for selecionada
opcaoSelect.addEventListener('change', () => {
    const idioma = idiomaSelect.value;
    const categoria = categoriaSelect.value;
    const opcao = opcaoSelect.value;
    if (opcao) {
        if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
            mensagemP.textContent = mensagens[categoria][opcao][idioma];
        } else {
            mensagemP.textContent = "Mensagem não encontrada para esta seleção.";
        }
        mensagemSecao.style.display = 'block';
    } else {
        mensagemSecao.style.display = 'none';
    }
});

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = mensagemP.textContent;
    navigator.clipboard.writeText(mensagem).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}
