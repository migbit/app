// Load the JSON data
document.addEventListener('DOMContentLoaded', () => {
    fetch('./mensagensData.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            initializeMessageSelectors(data);
        })
        .catch(error => {
            console.error('Error fetching the JSON data:', error);
        });
});

// Function to initialize selectors and events
function initializeMessageSelectors(mensagens) {
    // Selecionar elementos do DOM
    const idiomaSelect = document.getElementById('idioma');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    const guestNameInput = document.getElementById('guestName');
    const weekTypeSelect = document.getElementById('weekType');
    const weekDaySelect = document.getElementById('weekDay');
    const modifiersDiv = document.getElementById('modifiers');
    const btnSMS = document.getElementById('btn-sms');
    const btnBaby = document.getElementById('btn-baby');

    // Evento para quando o idioma for selecionado
    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
            guestNameInput.parentElement.style.display = 'none';
            weekTypeSelect.parentElement.style.display = 'none';
            weekDaySelect.parentElement.style.display = 'none';
            modifiersDiv.style.display = 'none';
        } else {
            categoriaDiv.style.display = 'none';
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
            guestNameInput.parentElement.style.display = 'none';
            weekTypeSelect.parentElement.style.display = 'none';
            weekDaySelect.parentElement.style.display = 'none';
            modifiersDiv.style.display = 'none';
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
            guestNameInput.parentElement.style.display = 'none';
            weekTypeSelect.parentElement.style.display = 'none';
            weekDaySelect.parentElement.style.display = 'none';
            modifiersDiv.style.display = 'none';
        }
    });

    // Evento para quando a opção for selecionada
    opcaoSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao) {
            if (opcao === 'Quando Chegam?') {
                guestNameInput.parentElement.style.display = 'block';
                weekTypeSelect.parentElement.style.display = 'block';
                weekDaySelect.parentElement.style.display = 'block';
                modifiersDiv.style.display = 'block';
            } else {
                guestNameInput.parentElement.style.display = 'none';
                weekTypeSelect.parentElement.style.display = 'none';
                weekDaySelect.parentElement.style.display = 'none';
                modifiersDiv.style.display = 'none';
            }

            if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
                let mensagem = mensagens[categoria][opcao][idioma];
                const guestName = guestNameInput.value;
                const weekType = weekTypeSelect.value;
                const weekDay = weekDaySelect.value;

                mensagem = mensagem.replace("[Hospede]", guestName)
                    .replace("[Semana]", weekType)
                    .replace("[Dia Semana]", getWeekDayInLanguage(weekDay, idioma));

                mensagemContainer.innerHTML = mensagem;
            } else {
                mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
            }
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
            guestNameInput.parentElement.style.display = 'none';
            weekTypeSelect.parentElement.style.display = 'none';
            weekDaySelect.parentElement.style.display = 'none';
            modifiersDiv.style.display = 'none';
        }
    });

    // Evento para copiar mensagem ao clicar no container
    mensagemContainer.addEventListener('click', copiarMensagem);

    // Funções para os botões SMS e Bebé
    btnSMS.addEventListener('click', () => {
        addSMSIntroduction();
    });

    btnBaby.addEventListener('click', () => {
        addBabyRequest();
    });
}

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = document.getElementById('mensagem-container').textContent;
    navigator.clipboard.writeText(mensagem).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Função para obter o dia da semana no idioma correto
function getWeekDayInLanguage(weekDay, idioma) {
    const weekDays = {
        "segunda-feira": {
            "Português": "segunda-feira",
            "Inglês": "Monday",
            "Espanhol": "lunes",
            "Francês": "lundi",
            "Alemão": "Montag",
            "Italiano": "lunedì"
        },
        // Restante dias da semana...
    };
    return weekDays[weekDay] ? weekDays[weekDay][idioma] : weekDay;
}

// Função para adicionar introdução SMS
function addSMSIntroduction() {
    const mensagemContainer = document.getElementById('mensagem-container');
    const smsIntro = "I’m Miguel, your Porto Airbnb host.";
    mensagemContainer.innerHTML = smsIntro + "\n\n" + mensagemContainer.innerHTML;
}

// Função para adicionar a solicitação de bebê
function addBabyRequest() {
    const mensagemContainer = document.getElementById('mensagem-container');
    const babyRequest = "Additionally, I’d like to know if you need a baby bed and/or a feeding chair.";
    mensagemContainer.innerHTML = mensagemContainer.innerHTML + "\n\n" + babyRequest;
}
