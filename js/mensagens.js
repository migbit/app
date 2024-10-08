// mensagens.js

let mensagens = {};

// Função para carregar as mensagens do arquivo JSON
async function carregarMensagens() {
    try {
        const response = await fetch('mensagensData.json');
        mensagens = await response.json();
        inicializarFormulario();
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// Função para inicializar o formulário
function inicializarFormulario() {
    const idiomaSelect = document.getElementById('idioma');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemP = document.getElementById('mensagem');

    // Preencher categorias
    categoriaSelect.innerHTML = '<option value="">Selecionar Categoria</option>';
    Object.keys(mensagens).forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriaSelect.appendChild(option);
    });

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
                let mensagem = mensagens[categoria][opcao][idioma];
                // Substituir variáveis se necessário
                mensagem = substituirVariaveis(mensagem);
                mensagemP.innerHTML = mensagem; // Usar innerHTML para renderizar conteúdo HTML
            } else {
                mensagemP.textContent = "Mensagem não encontrada para esta seleção.";
            }
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
        }
    });
}

// Função para substituir variáveis na mensagem
function substituirVariaveis(mensagem) {
    const variaveis = {
        '[Hospede]': () => prompt('Nome do hóspede:') || '[Hospede]',
        '[Semana]': () => prompt('Semana:') || '[Semana]',
        '[Dia Semana]': () => prompt('Dia da semana:') || '[Dia Semana]'
    };

    return mensagem.replace(/\[.*?\]/g, match => {
        if (variaveis[match]) {
            return variaveis[match]();
        }
        return match;
    });
}

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = document.getElementById('mensagem').innerText;
    navigator.clipboard.writeText(mensagem).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Carregar mensagens quando a página carregar
document.addEventListener('DOMContentLoaded', carregarMensagens);