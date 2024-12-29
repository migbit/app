// Import necessary Firebase functions and Chart.js components
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js';

// Register all necessary Chart.js components
Chart.register(...registerables);

// -----------------------------
// Utility Functions
// -----------------------------

/**
 * Converts a time input (hh:mm:ss) to total seconds.
 * @param {string} timeStr - Time string in hh:mm:ss format.
 * @returns {number|null} - Total seconds or null if invalid.
 */
function timeToSeconds(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(part => parseInt(part));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/**
 * Formats a date string (YYYY-MM-DD) to a more readable format.
 * @param {string} dateStr - Date string in YYYY-MM-DD format.
 * @returns {string} - Formatted date string.
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Data Não Disponível';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', options);
}

// -----------------------------
// Form Submission Handlers
// -----------------------------

/**
 * Handles form submissions by logging data to Firestore and updating the dashboard.
 * @param {string} formId - The ID of the form.
 * @param {string} collectionName - The Firestore collection name.
 * @param {Function} dataExtractor - Function to extract and process form data.
 */
async function handleFormSubmission(formId, collectionName, dataExtractor) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = dataExtractor();
        try {
            await addDoc(collection(db, collectionName), data);
            alert(`${collectionName.replace('_', ' ')} registrado com sucesso!`);
            form.reset();
            fetchAndDisplayData();
        } catch (error) {
            console.error(`Erro ao adicionar documento em ${collectionName}:`, error);
            alert(`Erro ao registrar ${collectionName.replace('_', ' ')}. Tente novamente.`);
        }
    });
}

// -----------------------------
// Specific Form Data Extractors
// -----------------------------

/**
 * Extracts data from the Ciclismo Estrada form.
 * @returns {Object} - Processed form data.
 */
function extractCiclismoEstradaData() {
    return {
        data: document.getElementById('ciclismoData').value || null,
        tipo_exercicio: document.getElementById('tipoExercicio').value || null,
        velocidade_media: parseFloat(document.getElementById('velocidadeMedia').value) || null,
        velocidade_maxima: parseFloat(document.getElementById('velocidadeMaxima').value) || null,
        tempo_total: timeToSeconds(document.getElementById('tempoTotal').value),
        ritmo_cardiaco_medio: parseInt(document.getElementById('ritmoCardiacoMedio').value) || null,
        ritmo_cardiaco_maximo: parseInt(document.getElementById('ritmoCardiacoMaximo').value) || null,
        potencia_media: parseFloat(document.getElementById('potenciaMedia').value) || null,
        potencia_maxima: parseFloat(document.getElementById('potenciaMaxima').value) || null,
        max_potencia_media_20m: parseFloat(document.getElementById('maxPotenciaMedia20m').value) || null,
        equilibrio_ed: parseFloat(document.getElementById('equilibrioED').value) || null,
        potencia_normalizada: parseFloat(document.getElementById('potenciaNormalizada').value) || null,
        fator_intensidade: parseFloat(document.getElementById('fatorIntensidade').value) || null,
        pontuacao_stress: parseInt(document.getElementById('pontuacaoStress').value) || null,
        definicao_ftp: parseFloat(document.getElementById('definicaoFTP').value) || null,
        exercicio_kj: parseFloat(document.getElementById('exercicioKj').value) || null,
        cadencia_media: parseInt(document.getElementById('cadenciaMedia').value) || null,
        cadencia_maxima: parseInt(document.getElementById('cadenciaMaxima').value) || null,
        subida_total: parseInt(document.getElementById('subidaTotal').value) || null,
        elevacao_maxima: parseInt(document.getElementById('elevacaoMaxima').value) || null,
        temperatura_media: parseFloat(document.getElementById('temperaturaMedia').value) || null,
        total_pedaladas: parseInt(document.getElementById('totalPedaladas').value) || null
    };
}

/**
 * Extracts data from the Aula RPM form.
 * @returns {Object} - Processed form data.
 */
function extractAulaRPMData() {
    return {
        tempo_total: parseInt(document.getElementById('rpmTempoTotal').value) || null,
        distancia_total: parseFloat(document.getElementById('rpmDistanciaTotal').value) || null,
        ritmo_cardiaco_medio: parseInt(document.getElementById('rpmRitmoCardiacoMedio').value) || null,
        ritmo_cardiaco_maximo: parseInt(document.getElementById('rpmRitmoCardiacoMaximo').value) || null,
        watt_maximo: parseFloat(document.getElementById('rpmWattMaximo').value) || null,
        media_watt: parseFloat(document.getElementById('rpmMediaWatt').value) || null,
        media_rpm: parseInt(document.getElementById('rpmMediaRPM').value) || null
    };
}

/**
 * Extracts data from the Treino de Força form.
 * @returns {Object} - Processed form data.
 */
function extractTreinoForcaData() {
    return {
        data: new Date().toISOString(),
        concluido: document.getElementById('forcaCompleted').checked
    };
}

/**
 * Extracts data from the Alongamentos form.
 * @returns {Object} - Processed form data.
 */
function extractAlongamentosData() {
    return {
        data: new Date().toISOString(),
        concluido: document.getElementById('alongamentosCompleted').checked
    };
}

/**
 * Extracts data from the Caminhada form.
 * @returns {Object} - Processed form data.
 */
function extractCaminhadaData() {
    return {
        data: new Date().toISOString(),
        concluido: document.getElementById('caminhadaCompleted').checked
    };
}

/**
 * Extracts data from the Peso form.
 * @returns {Object} - Processed form data.
 */
function extractPesoData() {
    return {
        data: document.getElementById('pesoData').value || new Date().toISOString(),
        peso_atual: parseFloat(document.getElementById('pesoAtual').value) || null
    };
}

// -----------------------------
// Initialize Form Handlers
// -----------------------------

handleFormSubmission('ciclismoForm', 'ciclismo_estrada', extractCiclismoEstradaData);
handleFormSubmission('rpmForm', 'aula_rpm', extractAulaRPMData);
handleFormSubmission('forcaForm', 'treino_forca', extractTreinoForcaData);
handleFormSubmission('alongamentosForm', 'alongamentos', extractAlongamentosData);
handleFormSubmission('caminhadaForm', 'caminhada', extractCaminhadaData);
handleFormSubmission('pesoForm', 'peso', extractPesoData);

// -----------------------------
// Weight Recommendation
// -----------------------------

/**
 * Provides weight recommendations based on BMI.
 * @param {number} currentWeight - Current weight in kg.
 */
function provideWeightRecommendation(currentWeight) {
    if (!currentWeight) {
        document.getElementById('recomendacaoTexto').innerText = "Insira seu peso para receber recomendações.";
        return;
    }
    const height = 176; // in cm
    const bmi = currentWeight / ((height / 100) ** 2);
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

// -----------------------------
// Data Fetching and Visualization
// -----------------------------

/**
 * Fetches data from Firestore and updates the charts.
 */
async function fetchAndDisplayData() {
    try {
        // Fetch Ciclismo Estrada Data
        const ciclismoQuery = query(collection(db, "ciclismo_estrada"), orderBy("data", "desc"));
        const ciclismoSnapshot = await getDocs(ciclismoQuery);
        const ciclismoData = [];
        ciclismoSnapshot.forEach((doc) => {
            ciclismoData.push(doc.data());
        });

        // Fetch Peso Data
        const pesoQuery = query(collection(db, "peso"), orderBy("data", "desc"));
        const pesoSnapshot = await getDocs(pesoQuery);
        const pesoData = [];
        pesoSnapshot.forEach((doc) => {
            pesoData.push(doc.data());
        });

        // Create or Update Performance Chart
        createOrUpdatePerformanceChart(ciclismoData);

        // Create or Update Weight Chart
        createOrUpdateWeightChart(pesoData);

        // Generate Training Recommendations for Next 5 Days
        generateTrainingRecommendations();
    } catch (error) {
        console.error("Erro ao buscar dados para os gráficos:", error);
    }
}

/**
 * Creates or updates the Performance Chart.
 * @param {Array} data - Array of ciclismo_estrada documents.
 */
function createOrUpdatePerformanceChart(data) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }

    window.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(entry => formatDate(entry.data)),
            datasets: [
                {
                    label: 'Velocidade Média (kph)',
                    data: data.map(entry => entry.velocidade_media),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    spanGaps: true
                },
                {
                    label: 'Potência Média (W)',
                    data: data.map(entry => entry.potencia_media),
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    fill: false,
                    spanGaps: true
                },
                {
                    label: 'Ritmo Cardíaco Médio (bpm)',
                    data: data.map(entry => entry.ritmo_cardiaco_medio),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Desempenho de Ciclismo Estrada'
                }
            },
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Data' 
                    },
                    ticks: {
                        maxRotation: 90,
                        minRotation: 45
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
}

/**
 * Creates or updates the Weight Chart.
 * @param {Array} data - Array of peso documents.
 */
function createOrUpdateWeightChart(data) {
    const ctxPeso = document.getElementById('weightChart').getContext('2d');
    if (window.weightChart) {
        window.weightChart.destroy();
    }

    window.weightChart = new Chart(ctxPeso, {
        type: 'line',
        data: {
            labels: data.map(entry => formatDate(entry.data)),
            datasets: [
                {
                    label: 'Peso (kg)',
                    data: data.map(entry => entry.peso_atual),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Rastreamento de Peso'
                }
            },
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Data' 
                    },
                    ticks: {
                        maxRotation: 90,
                        minRotation: 45
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

// -----------------------------
// Training Recommendations
// -----------------------------

/**
 * Generates training recommendations for the next 5 days based on current routine.
 */
async function generateTrainingRecommendations() {
    const today = new Date();
    const recommendations = [];

    for (let i = 1; i <= 5; i++) {
        const nextDay = new Date();
        nextDay.setDate(today.getDate() + i);
        const dayOfWeek = nextDay.getDay(); // 0 (Sun) to 6 (Sat)

        let recommendedTrainings = [];

        // Example logic based on day of week and existing routine
        if (dayOfWeek === 2 || dayOfWeek === 5) { // Tuesdays & Fridays: Gym Cycling Classes
            recommendedTrainings.push({
                type: "Aula RPM",
                description: "Aula RPM (45 minutos)"
            });
        }
        if (dayOfWeek === 0) { // Sundays: Long Ride
            recommendedTrainings.push({
                type: "Ciclismo Estrada",
                description: "Long Ride (100 km)"
            });
        }
        if (dayOfWeek !== 0 && dayOfWeek !== 2 && dayOfWeek !== 5) {
            // Weekdays: Zone 2 Training or Active Recovery
            recommendedTrainings.push({
                type: "Ciclismo Estrada",
                description: "Zone 2 Training (60 minutos)"
            });
            recommendedTrainings.push({
                type: "Caminhada",
                description: "Caminhada leve (30 minutos)"
            });
        }

        // Option to reduce load during winter phase or manage tendinitis
        // Placeholder: Implement seasonal logic based on current date or user selection
        // For simplicity, assume current date is winter
        recommendedTrainings.push({
            type: "Alongamentos",
            description: "Sessão de Alongamentos (20 minutos)"
        });

        // Highlight the most recommended training (first option)
        recommendations.push({
            date: formatDate(nextDay.toISOString().split('T')[0]),
            options: recommendedTrainings,
            recommended: recommendedTrainings[0]
        });
    }

    // Display recommendations on the dashboard
    displayTrainingRecommendations(recommendations);
}

/**
 * Displays training recommendations in the dashboard.
 * @param {Array} recommendations - Array of recommendation objects.
 */
function displayTrainingRecommendations(recommendations) {
    const recSection = document.getElementById('recommendations');
    recSection.innerHTML = `<h3>Próximos 5 Dias de Treino</h3>`;

    recommendations.forEach(rec => {
        const recDiv = document.createElement('div');
        recDiv.classList.add('mb-3');
        recDiv.innerHTML = `
            <h5>${rec.date}</h5>
            <ul>
                ${rec.options.map(option => `
                    <li ${option === rec.recommended ? 'class="fw-bold"' : ''}>
                        ${option.description} (${option.type})
                        ${option === rec.recommended ? ' <span class="badge bg-success">Recomendado</span>' : ''}
                    </li>
                `).join('')}
            </ul>
        `;
        recSection.appendChild(recDiv);
    });
}

// -----------------------------
// Initialize on Page Load
// -----------------------------

// Fetch and display data when the window loads
window.addEventListener('load', fetchAndDisplayData);
