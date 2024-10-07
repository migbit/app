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
    const weekDayInput = document.getElementById('week-day');

    // Botões para modificar a mensagem
    const smsButton = document.getElementById('sms-button');
    const bebeButton = document.getElementById('bebe-button');
    const estaSemanaButton = document.getElementById('esta-semana-button');

    // Evento para quando o idioma for selecionado
    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDayInput.style.display = 'none';
        } else {
            categoriaDiv.style.display = 'none';
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDayInput.style.display = 'none';
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
            weekDayInput.style.display = 'none';
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
                weekDayInput.style.display = 'block';
            } else {
                guestNameInput.style.display = 'none';
                weekDayInput.style.display = 'none';
            }

            if (mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
                let mensagem = mensagens[categoria][opcao][idioma];
                const guestName = guestNameInput.value;
                const weekDay = weekDayInput.value;
                mensagem = mensagem.replace("[Guest's Name]", guestName).replace("[Week Day]", weekDay);

                mensagemContainer.innerHTML = mensagem;
                mensagemSecao.style.display = 'block';
            } else {
                mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
                mensagemSecao.style.display = 'block';
            }
        } else {
            mensagemSecao.style.display = 'none';
            guestNameInput.style.display = 'none';
            weekDayInput.style.display = 'none';
        }
    });

    // Eventos para os botões
    smsButton.addEventListener('click', () => {
        modifyMessage('sms');
    });

    bebeButton.addEventListener('click', () => {
        modifyMessage('bebe');
    });

    estaSemanaButton.addEventListener('click', () => {
        modifyMessage('esta-semana');
    });

    // Função para modificar a mensagem de acordo com os botões
    function modifyMessage(type) {
        let mensagem = mensagemContainer.innerHTML;

        switch (type) {
            case 'sms':
                mensagem += '<br><strong>Enviar via SMS:</strong> Lembre-se de responder rapidamente.';
                break;
            case 'bebe':
                mensagem += '<br><strong>Bebé:</strong> Gostaria de saber se precisará de um berço ou cadeira de alimentação.';
                break;
            case 'esta-semana':
                mensagem += '<br><strong>Esta Semana:</strong> Estamos muito felizes em receber você nesta semana!';
                break;
        }

        mensagemContainer.innerHTML = mensagem;
    }

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
