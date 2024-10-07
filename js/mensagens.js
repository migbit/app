// js/mensagens.js
import { mensagens } from './mensagensData.js';

// Selecionar elementos do DOM
const idiomaSelect = document.getElementById('idioma');
const categoriaDiv = document.getElementById('categoria-div');
const categoriaSelect = document.getElementById('categoria');
const opcaoDiv = document.getElementById('opcao-div');
const opcaoSelect = document.getElementById('opcao');
const mensagemSecao = document.getElementById('mensagem-secao');
const mensagemContainer = document.getElementById('mensagem-container');

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
            mensagemContainer.innerHTML = mensagens[categoria][opcao][idioma];
        } else {
            mensagemContainer.innerHTML = "<p>Mensagem não encontrada para esta seleção.</p>";
        }
        mensagemSecao.style.display = 'block';
    } else {
        mensagemSecao.style.display = 'none';
    }
});

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = mensagemContainer.textContent;
    navigator.clipboard.writeText(mensagem).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Evento do botão copiar
const btnCopiar = document.getElementById('btn-copiar');
btnCopiar.addEventListener('click', copiarMensagem);