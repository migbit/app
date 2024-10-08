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
    const btnSms = document.getElementById('btn-sms');
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
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao === 'Quando Chegam?') {
            weekTypeSelect.style.display = 'block';
            weekDaySelect.style.display = 'block';
            btnSms.style.display = 'inline-block';
            btnBaby.style.display = 'inline-block';
        } else {
            weekTypeSelect.style.display = 'none';
            weekDaySelect.style.display = 'none';
            btnSms.style.display = 'none';
            btnBaby.style.display = 'none';
        }

        if (opcao) {
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento do botão Gerar Mensagem
    btnGerarMensagem.addEventListener('click', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        const semana = weekTypeSelect.value;
        const diaSemana = weekDaySelect.value;

        if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
            let mensagem = mensagens[categoria][opcao][idioma];
            mensagem = mensagem.replace('[Semana]', semana).replace('[Dia Semana]', diaSemana);
            mensagemContainer.innerHTML = mensagem;
        } else {
            mensagemContainer.innerHTML = '<p>Mensagem não encontrada para esta seleção.</p>';
        }
    });

    // Evento do botão SMS
    btnSms.addEventListener('click', () => {
        const idioma = idiomaSelect.value;
        let smsText = '';
        if (idioma === 'Português') {
            smsText = 'Sou o Miguel, o seu anfitrião do Airbnb no Porto.';
        } else if (idioma === 'Inglês') {
            smsText = "I'm Miguel, your Porto Airbnb host.";
        } else if (idioma === 'Espanhol') {
            smsText = 'Soy Miguel, su anfitrión de Airbnb en Oporto.';
        } else if (idioma === 'Francês') {
            smsText = 'Je suis Miguel, votre hôte Airbnb à Porto.';
        } else if (idioma === 'Alemão') {
            smsText = 'Ich bin Miguel, Ihr Porto Airbnb Gastgeber.';
        } else if (idioma === 'Italiano') {
            smsText = 'Sono Miguel, il tuo host Airbnb a Porto.';
        }

        if (mensagemContainer.innerHTML.includes(smsText)) return;
        mensagemContainer.innerHTML = smsText + ' ' + mensagemContainer.innerHTML;
    });

    // Evento do botão Bebé
    btnBaby.addEventListener('click', () => {
        const idioma = idiomaSelect.value;
        let babyText = '';
        if (idioma === 'Português') {
            babyText = 'Gostaria de saber se necessita de um berço e/ou uma cadeira de alimentação para bebé.';
        } else if (idioma === 'Inglês') {
            babyText = "Additionally, I'd like to know if you need a baby bed and/or a feeding chair.";
        } else if (idioma === 'Espanhol') {
            babyText = 'Además, me gustaría saber si necesita una cuna y/o una silla para alimentar al bebé.';
        } else if (idioma === 'Francês') {
            babyText = "De plus, j'aimerais savoir si vous avez besoin d'un lit bébé et/ou d'une chaise pour nourrir.";
        } else if (idioma === 'Alemão') {
            babyText = 'Außerdem möchte ich wissen, ob Sie ein Babybett und/oder einen Hochstuhl benötigen.';
        } else if (idioma === 'Italiano') {
            babyText = 'Inoltre, vorrei sapere se hai bisogno di un lettino e/o di una sedia per allattare.';
        }

        if (mensagemContainer.innerHTML.includes(babyText)) return;
        mensagemContainer.innerHTML = mensagemContainer.innerHTML.replace(/(Melhores cumprimentos|Kind regards|Un saludo|Cordialement|Mit freundlichen Grüßen|Cordiali saluti)/, `${babyText}

$1`);
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

// Evento para copiar a mensagem ao clicar no container
document.getElementById('mensagem-container').addEventListener('click', copiarMensagem);