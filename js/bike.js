// app.js
import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --------------------- Ciclismo Estrada ---------------------
async function logCiclismoEstrada(data) {
  try {
    const docRef = await addDoc(collection(db, "ciclismo_estrada"), data);
    console.log("Ciclismo Estrada Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding Ciclismo Estrada document: ", error);
  }
}

document.getElementById("ciclismoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    data: document.getElementById("ciclismoData").value,
    tipo_exercicio: document.getElementById("tipoExercicio").value,
    velocidade_media: parseFloat(document.getElementById("velocidadeMedia").value),
    // Add other fields similarly...
    timestamp: new Date().getTime(), // optional
  };
  await logCiclismoEstrada(data);
  alert("Ciclismo Estrada registrado com sucesso!");
  e.target.reset();
});

// --------------------- Aula RPM ---------------------
async function logRPM(data) {
  try {
    const docRef = await addDoc(collection(db, "aula_rpm"), data);
    console.log("Aula RPM Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding RPM document: ", error);
  }
}

document.getElementById("rpmForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    tempo_total: parseInt(document.getElementById("rpmTempoTotal").value),
    timestamp: new Date().getTime(),
  };
  await logRPM(data);
  alert("Aula RPM registrada com sucesso!");
  e.target.reset();
});

// --------------------- Treino de Força ---------------------
async function logForca(data) {
  try {
    const docRef = await addDoc(collection(db, "treino_forca"), data);
    console.log("Treino de Força Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding Força document: ", error);
  }
}

document.getElementById("forcaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const forcaCompleted = document.getElementById("forcaCompleted").checked;
  const data = {
    completed: forcaCompleted,
    timestamp: new Date().getTime(),
  };
  await logForca(data);
  alert("Treino de Força registrado com sucesso!");
  e.target.reset();
});

// --------------------- Alongamentos ---------------------
async function logAlongamentos(data) {
  try {
    const docRef = await addDoc(collection(db, "alongamentos"), data);
    console.log("Alongamentos Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding Alongamentos document: ", error);
  }
}

document.getElementById("alongamentosForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alongamentosCompleted = document.getElementById("alongamentosCompleted").checked;
  const data = {
    completed: alongamentosCompleted,
    timestamp: new Date().getTime(),
  };
  await logAlongamentos(data);
  alert("Alongamentos registrados com sucesso!");
  e.target.reset();
});

// --------------------- Caminhada ---------------------
async function logCaminhada(data) {
  try {
    const docRef = await addDoc(collection(db, "caminhada"), data);
    console.log("Caminhada Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding Caminhada document: ", error);
  }
}

document.getElementById("caminhadaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const caminhadaCompleted = document.getElementById("caminhadaCompleted").checked;
  const data = {
    completed: caminhadaCompleted,
    timestamp: new Date().getTime(),
  };
  await logCaminhada(data);
  alert("Caminhada registrada com sucesso!");
  e.target.reset();
});

// --------------------- WEIGHT MANAGEMENT ---------------------
async function logWeight(weightData) {
  try {
    const docRef = await addDoc(collection(db, "weight_entries"), weightData);
    console.log("Weight Entry Document ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding weight entry: ", error);
  }
}

document.getElementById("weightForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("profileDate").value;
  const weight = parseFloat(document.getElementById("profileWeight").value);

  // If you have a target weight input:
  // const targetWeightInput = document.getElementById("profileTargetWeight");
  // const targetWeight = targetWeightInput.value ? parseFloat(targetWeightInput.value) : null;

  const weightData = {
    date,
    weight,
    // targetWeight,
    timestamp: new Date().getTime(),
  };

  await logWeight(weightData);
  alert("Peso registrado com sucesso!");
  e.target.reset();
  await displayWeightIndicator();
  await updateWeightChart();
});

/**
 * Displays a simple message or arrow indicating if the most recent
 * weight is up or down compared to the previous entry.
 */
async function displayWeightIndicator() {
  const weightIndicator = document.getElementById("weightIndicator");
  weightIndicator.innerHTML = ""; // Clear previous contents

  // Fetch all weight entries ordered by timestamp
  const q = query(collection(db, "weight_entries"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const weightArray = [];
  querySnapshot.forEach((doc) => {
    weightArray.push(doc.data());
  });

  if (weightArray.length === 0) {
    weightIndicator.textContent = "No weight data yet.";
    return;
  }

  if (weightArray.length === 1) {
    // Only one entry, so no comparison
    weightIndicator.textContent = `Current Weight: ${weightArray[0].weight} kg`;
    return;
  }

  // Compare the two most recent entries
  const [latest, previous] = weightArray;
  const diff = latest.weight - previous.weight;

  let message = `Current Weight: ${latest.weight} kg`;
  if (diff > 0) {
    message += " (↑ from " + previous.weight + " kg)";
  } else if (diff < 0) {
    message += " (↓ from " + previous.weight + " kg)";
  } else {
    message += " (no change)";
  }

  weightIndicator.textContent = message;
}

// --------------------- DASHBOARD & DATA VISUALIZATION ---------------------
async function fetchAndDisplayData() {
  // Example: Fetch all 'ciclismo_estrada' entries for the performance chart
  const ciclismoQuery = query(collection(db, "ciclismo_estrada"), orderBy("data", "asc"));
  const ciclismoSnapshot = await getDocs(ciclismoQuery);
  const ciclismoData = [];
  ciclismoSnapshot.forEach((doc) => {
    ciclismoData.push(doc.data());
  });

  // Build a Chart.js line chart for Velocidade Média
  const perfCtx = document.getElementById("performanceChart").getContext("2d");
  new Chart(perfCtx, {
    type: "line",
    data: {
      labels: ciclismoData.map((item) => item.data),
      datasets: [
        {
          label: "Velocidade Média (kph)",
          data: ciclismoData.map((item) => item.velocidade_media),
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Data" } },
        y: { title: { display: true, text: "Velocidade (kph)" }, beginAtZero: true },
      },
    },
  });
}

/**
 * (Optional) Build a chart of weight entries over time.
 */
async function updateWeightChart() {
  const weightCtx = document.getElementById("weightChart").getContext("2d");

  // Fetch all weight entries
  const q = query(collection(db, "weight_entries"), orderBy("date", "asc"));
  const querySnapshot = await getDocs(q);
  const weightArray = [];
  querySnapshot.forEach((doc) => {
    weightArray.push(doc.data());
  });

  // Clear existing chart instance if needed
  if (window.myWeightChart) {
    window.myWeightChart.destroy();
  }

  if (weightArray.length === 0) return;

  // Build data for the chart
  window.myWeightChart = new Chart(weightCtx, {
    type: "line",
    data: {
      labels: weightArray.map((entry) => entry.date),
      datasets: [
        {
          label: "Weight (kg)",
          data: weightArray.map((entry) => entry.weight),
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Weight (kg)" }, beginAtZero: false },
      },
    },
  });
}

// --------------------- ON PAGE LOAD ---------------------
window.onload = async () => {
  await fetchAndDisplayData();
  await displayWeightIndicator();
  await updateWeightChart();
};
