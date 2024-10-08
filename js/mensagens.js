// js/mensagens.js

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
    const guestNameInput = document.getElementById('guest-name');
    const weekDaySelect = document.getElementById('week-day');
    const weekSelect = document.getElementById('week');
    const btnBebe = document.getElementById('btn-bebe');
    const btnSms = document.getElementById('btn-sms');
    const btnGerarMensagem = document.getElementById('btn-gerar-mensagem');

    let addBebeMessage = false;
    let addSmsMessage = false;

    // Evento para quando o idioma for selecionado
    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDaySelect.style.display = 'none';
            weekSelect.style.display = 'none';
        } else {
            categoriaDiv.style.display = 'none';
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDaySelect.style.display = 'none';
            weekSelect.style.display = 'none';
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
            guestNameInput.style.display = 'none';
            weekDaySelect.style.display = 'none';
            weekSelect.style.display = 'none';
        }
    });

    // Evento para quando a opção for selecionada
    opcaoSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao) {
            if (opcao === 'Quando Chegam?') {
                guestNameInput.style.display = 'block';
                weekDaySelect.style.display = 'block';
                weekSelect.style.display = 'block';
                btnGerarMensagem.style.display = 'block';
            } else {
                guestNameInput.style.display = 'none';
                weekDaySelect.style.display = 'none';
                weekSelect.style.display = 'none';
                btnGerarMensagem.style.display = 'none';
            }

            if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
                mensagemContainer.innerHTML = mensagens[categoria][opcao][idioma];
            } else {
                mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
            }
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDaySelect.style.display = 'none';
            weekSelect.style.display = 'none';
            btnGerarMensagem.style.display = 'none';
        }
    });

    // Evento do botão Bebé
    btnBebe.addEventListener('click', () => {
        addBebeMessage = !addBebeMessage;
        btnBebe.classList.toggle('active');
    });

    // Evento do botão SMS
    btnSms.addEventListener('click', () => {
        addSmsMessage = !addSmsMessage;
        btnSms.classList.toggle('active');
    });

    // Evento do botão Gerar Mensagem
    btnGerarMensagem.addEventListener('click', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
            let mensagem = mensagens[categoria][opcao][idioma];
            const guestName = guestNameInput.value;
            const weekDay = weekDaySelect.value;
            const week = weekSelect.value;

            mensagem = mensagem.replace('[Hospede]', guestName).replace('[Dia Semana]', weekDay).replace('[Semana]', week);

            if (addSmsMessage) {
                mensagem = `I’m Miguel, your Porto Airbnb host.\n\n` + mensagem;
            }

            if (addBebeMessage) {
                mensagem += '\n\nAdditionally, I’d like to know if you need a baby bed and/or a feeding chair.';
            }

            mensagemContainer.innerHTML = mensagem;
        } else {
            mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
        }
        mensagemSecao.style.display = 'block';
    });

    // Evento para copiar mensagem ao clicar no container
    mensagemContainer.addEventListener('click', copiarMensagem);
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