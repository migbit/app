import { db, auth } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js';

// Function to log 'Ciclismo Estrada' activity
async function logCiclismoEstrada(data) {
    try {
        const docRef = await addDoc(collection(db, "ciclismo_estrada"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Function to handle 'Ciclismo Estrada' form submission
document.getElementById('ciclismoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        data: document.getElementById('ciclismoData').value,
        tipo_exercicio: document.getElementById('tipoExercicio').value,
        velocidade_media: parseFloat(document.getElementById('velocidadeMedia').value),
        velocidade_maxima: parseFloat(document.getElementById('velocidadeMaxima').value),
        tempo_total: document.getElementById('tempoTotal').value,
        ritmo_cardiaco_medio: parseInt(document.getElementById('ritmoCardiacoMedio').value),
        ritmo_cardiaco_maximo: parseInt(document.getElementById('ritmoCardiacoMaximo').value),
        potencia_media: parseFloat(document.getElementById('potenciaMedia').value),
        potencia_maxima: parseFloat(document.getElementById('potenciaMaxima').value),
        max_potencia_media_20m: parseFloat(document.getElementById('maxPotenciaMedia20m').value),
        equilibrio_ed: parseFloat(document.getElementById('equilibrioED').value),
        potencia_normalizada: parseFloat(document.getElementById('potenciaNormalizada').value),
        fator_intensidade: parseFloat(document.getElementById('fatorIntensidade').value),
        pontuacao_stress: parseInt(document.getElementById('pontuacaoStress').value),
        definicao_ftp: parseFloat(document.getElementById('definicaoFTP').value),
        exercicio_kj: parseFloat(document.getElementById('exercicioKj').value),
        cadencia_media: parseInt(document.getElementById('cadenciaMedia').value),
        cadencia_maxima: parseInt(document.getElementById('cadenciaMaxima').value),
        subida_total: parseInt(document.getElementById('subidaTotal').value),
        elevacao_maxima: parseInt(document.getElementById('elevacaoMaxima').value),
        temperatura_media: parseFloat(document.getElementById('temperaturaMedia').value),
        total_pedaladas: parseInt(document.getElementById('totalPedaladas').value)
    };
    await logCiclismoEstrada(data);
    alert('Ciclismo Estrada registrado com sucesso!');
    document.getElementById('ciclismoForm').reset();
    fetchAndDisplayData();
});

// Similar functions for other exercise types...

// Function to log 'Aula RPM' activity
async function logAulaRPM(data) {
    try {
        const docRef = await addDoc(collection(db, "aula_rpm"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Handle 'Aula RPM' form submission
document.getElementById('rpmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        tempo_total: parseInt(document.getElementById('rpmTempoTotal').value),
        distancia_total: parseFloat(document.getElementById('rpmDistanciaTotal').value),
        ritmo_cardiaco_medio: parseInt(document.getElementById('rpmRitmoCardiacoMedio').value),
        ritmo_cardiaco_maximo: parseInt(document.getElementById('rpmRitmoCardiacoMaximo').value),
        watt_maximo: parseFloat(document.getElementById('rpmWattMaximo').value),
        media_watt: parseFloat(document.getElementById('rpmMediaWatt').value),
        media_rpm: parseInt(document.getElementById('rpmMediaRPM').value)
    };
    await logAulaRPM(data);
    alert('Aula RPM registrada com sucesso!');
    document.getElementById('rpmForm').reset();
    fetchAndDisplayData();
});

// Function to log 'Treino de Força' activity
async function logTreinoForca(data) {
    try {
        const docRef = await addDoc(collection(db, "treino_forca"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Handle 'Treino de Força' form submission
document.getElementById('forcaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const completed = document.getElementById('forcaCompleted').checked;
    const data = {
        data: new Date().toISOString(),
        concluido: completed
    };
    await logTreinoForca(data);
    alert('Treino de Força registrado com sucesso!');
    document.getElementById('forcaForm').reset();
    fetchAndDisplayData();
});

// Function to log 'Alongamentos' activity
async function logAlongamentos(data) {
    try {
        const docRef = await addDoc(collection(db, "alongamentos"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Handle 'Alongamentos' form submission
document.getElementById('alongamentosForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const completed = document.getElementById('alongamentosCompleted').checked;
    const data = {
        data: new Date().toISOString(),
        concluido: completed
    };
    await logAlongamentos(data);
    alert('Alongamentos registrados com sucesso!');
    document.getElementById('alongamentosForm').reset();
    fetchAndDisplayData();
});

// Function to log 'Caminhada' activity
async function logCaminhada(data) {
    try {
        const docRef = await addDoc(collection(db, "caminhada"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Handle 'Caminhada' form submission
document.getElementById('caminhadaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const completed = document.getElementById('caminhadaCompleted').checked;
    const data = {
        data: new Date().toISOString(),
        concluido: completed
    };
    await logCaminhada(data);
    alert('Caminhada registrada com sucesso!');
    document.getElementById('caminhadaForm').reset();
    fetchAndDisplayData();
});

// Function to log 'Peso' activity
async function logPeso(data) {
    try {
        const docRef = await addDoc(collection(db, "peso"), data);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Handle 'Peso' form submission
document.getElementById('pesoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        data: document.getElementById('pesoData').value,
        peso_atual: parseFloat(document.getElementById('pesoAtual').value)
    };
    await logPeso(data);
    alert('Peso registrado com sucesso!');
    document.getElementById('pesoForm').reset();
    fetchAndDisplayData();
    provideWeightRecommendation(data.peso_atual);
}

// Function to provide weight recommendations
async function provideWeightRecommendation(currentWeight) {
    const height = 176; // in cm
    const age = 40; // in years
    const bmi = (currentWeight) / ((height / 100) ** 2);
    let recommendation = "";
    if (bmi < 21) {
        recommendation = "Seu BMI está abaixo do ideal para desempenho de ciclismo. Considere ganhar um pouco de peso para melhorar a força e resistência.";
    } else if (bmi >= 21 && bmi <= 24.9) {
        recommendation = "Seu BMI está dentro da faixa ideal para desempenho de ciclismo. Mantenha seu peso atual para otimizar seu desempenho.";
    } else if (bmi >= 25 && bmi <= 29.9) {
        recommendation = "Seu BMI está acima do ideal para desempenho de ciclismo. Considere perder um pouco de peso para melhorar a eficiência e reduzir o estresse nas articulações.";
    } else {
        recommendation = "Seu BMI está significativamente acima do ideal para desempenho de ciclismo. Recomenda-se uma avaliação médica e um plano de perda de peso estruturado.";
    }
    document.getElementById('recomendacaoTexto').innerText = `Seu BMI atual é ${bmi.toFixed(1)}. ${recommendation}`;
}

// Function to fetch and display data on dashboard
async function fetchAndDisplayData() {
    // Fetch Ciclismo Estrada Data
    const ciclismoQuery = query(collection(db, "ciclismo_estrada"), orderBy("data", "desc"));
    const ciclismoSnapshot = await getDocs(ciclismoQuery);
    const ciclismoData = [];
    ciclismoSnapshot.forEach((doc) => {
        ciclismoData.push(doc.data());
    });

    // Fetch Weight Data
    const pesoQuery = query(collection(db, "peso"), orderBy("data", "desc"));
    const pesoSnapshot = await getDocs(pesoQuery);
    const pesoData = [];
    pesoSnapshot.forEach((doc) => {
        pesoData.push(doc.data());
    });

    // Create Performance Chart
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }
    window.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ciclismoData.map(entry => entry.data),
            datasets: [{
                label: 'Velocidade Média (kph)',
                data: ciclismoData.map(entry => entry.velocidade_media),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            },
            {
                label: 'Potência Média (W)',
                data: ciclismoData.map(entry => entry.potencia_media),
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                fill: false
            },
            {
                label: 'Ritmo Cardíaco Médio (bpm)',
                data: ciclismoData.map(entry => entry.ritmo_cardiaco_medio),
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Data' 
                    } 
                },
                y: { 
                    title: { 
                        display: true, 
                        text: 'Valores' 
                    },
                    beginAtZero: true
                }
            }
        }
    });

    // Create Weight Chart
    const ctxPeso = document.getElementById('weightChart').getContext('2d');
    if (window.weightChart) {
        window.weightChart.destroy();
    }
    window.weightChart = new Chart(ctxPeso, {
        type: 'line',
        data: {
            labels: pesoData.map(entry => entry.data),
            datasets: [{
                label: 'Peso (kg)',
                data: pesoData.map(entry => entry.peso_atual),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Data' 
                    } 
                },
                y: { 
                    title: { 
                        display: true, 
                        text: 'Peso (kg)' 
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Call the function on page load
window.onload = fetchAndDisplayData;

// Recommendation Engine Placeholder
// Future implementation: Analyze data to provide training recommendations
