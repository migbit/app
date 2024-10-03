// js/iva.js

// Importar funções necessárias do Firebase
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Selecionar elementos do DOM
const ivaForm = document.getElementById('iva-form');
const relatoriosDiv = document.getElementById('relatorios-iva');

// Evento para submissão do formulário
ivaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataCompra = document.getElementById('data_compra').value;
    const valorIva = parseFloat(document.getElementById('valor_iva').value);

    // Determinar o trimestre com base na data da compra
    const mes = parseInt(dataCompra.split('-')[1]);
    const trimestre = Math.ceil(mes / 3);

    // Criar objeto de dados
    const ivaData = {
        data_compra: dataCompra,
        valor_iva: valorIva,
        trimestre: trimestre
    };

    try {
        // Adicionar documento à coleção 'iva'
        await addDoc(collection(db, "iva"), ivaData);
        alert('Dados de IVA guardados com sucesso!');
        ivaForm.reset();
        carregarRelatorios();
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
    }
});

// Função para carregar relatórios trimestrais de IVA
async function carregarRelatorios() {
    relatoriosDiv.innerHTML = '<p>Carregando relatórios...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "iva"));
        const dados = [];

        querySnapshot.forEach((doc) => {
            dados.push(doc.data());
        });

        // Agregar dados por trimestre
        const relatorios = {};

        dados.forEach(entry => {
            const tr = entry.trimestre;
            if (!relatorios[tr]) {
                relatorios[tr] = {
                    total_iva: 0
                };
            }
            relatorios[tr].total_iva += entry.valor_iva;
        });

        // Criar HTML para exibir os relatórios
        let html = '<table>';
        html += `
            <tr>
                <th>Trimestre</th>
                <th>Total IVA Pago</th>
            </tr>
        `;

        for (const [trimestre, dadosTrimestre] of Object.entries(relatorios)) {
            html += `
                <tr>
                    <td>${trimestre}º Trimestre</td>
                    <td>${dadosTrimestre.total_iva.toFixed(2)}</td>
                </tr>
            `;
        }

        html += '</table>';
        relatoriosDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatórios: ", e);
        relatoriosDiv.innerHTML = '<p>Erro ao carregar relatórios.</p>';
    }
}

// Carregar relatórios ao carregar a página
window.addEventListener('load', carregarRelatorios);
