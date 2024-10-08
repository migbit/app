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
    const weekTypeSelect = document.getElementById('weekType');
    const weekDaySelect = document.getElementById('weekDay');
    const btnGerarMensagem = document.getElementById('btn-gerar-mensagem');
    const btnSMS = document.getElementById('btn-sms');
    const btnBaby = document.getElementById('btn-baby');

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
            if (opcao === 'Quando Chegam?') {
                weekTypeSelect.style.display = 'block';
                weekDaySelect.style.display = 'block';
                btnSMS.style.display = 'inline-block';
                btnBaby.style.display = 'inline-block';
            } else {
                weekTypeSelect.style.display = 'none';
                weekDaySelect.style.display = 'none';
                btnSMS.style.display = 'none';
                btnBaby.style.display = 'none';
            }
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para gerar a mensagem
    btnGerarMensagem.addEventListener('click', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        const weekType = weekTypeSelect.value;
        const weekDay = weekDaySelect.value;

        if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
            let mensagem = mensagens[categoria][opcao][idioma];
            mensagem = mensagem.replace('[Semana]', weekType).replace('[Dia Semana]', weekDay);
            mensagemContainer.innerHTML = mensagem;
        } else {
            mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
        }
    });

    // Evento para adicionar informação SMS
    btnSMS.addEventListener('click', () => {
        let mensagem = mensagemContainer.innerHTML;
        if (!mensagem.includes("I’m Miguel, your Porto Airbnb host.")) {
            mensagem = mensagem.replace(/^(Olá|Hello|Hola|Bonjour|Hallo|Ciao)/, "$&\nI’m Miguel, your Porto Airbnb host.");
            mensagemContainer.innerHTML = mensagem;
        }
    });

    // Evento para adicionar informação sobre bebé
    btnBaby.addEventListener('click', () => {
        let mensagem = mensagemContainer.innerHTML;
        if (!mensagem.includes("Additionally, I’d like to know if you need a baby bed and/or a feeding chair.")) {
            mensagem = mensagem.replace(/(Melhores cumprimentos|Kind regards|Un saludo|Cordialement|Mit freundlichen Grüßen|Cordiali saluti)/, "Additionally, I’d like to know if you need a baby bed and/or a feeding chair.\n$1");
            mensagemContainer.innerHTML = mensagem;
        }
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