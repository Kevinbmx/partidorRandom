document.addEventListener("DOMContentLoaded", function () {
  // Elementos DOM
  const lights = [
    document.getElementById("light1"), // Rojo
    document.getElementById("light2"), // Amarillo 1
    document.getElementById("light3"), // Amarillo 2
    document.getElementById("light4"), // Verde
  ];

  const mainButton = document.getElementById("mainButton");
  const configToggle = document.getElementById("configToggle");
  const configPanel = document.getElementById("configPanel");
  const closeConfig = document.getElementById("closeConfig");
  const saveConfig = document.getElementById("saveConfig");

  // Elementos de audio
  const greenSound = document.getElementById("greenSound");
  const beepSound = document.getElementById("beepSound");
  const beepFinalSound = document.getElementById("beepFinalound");

  // Elementos de configuración
  const waitRange = document.getElementById("waitRange");
  const waitValue = document.getElementById("waitValue");
  const durationControl = document.getElementById("duration");
  const durationValue = document.getElementById("durationValue");
  const volumeControl = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");
  const autoStartToggle = document.getElementById("autoStart");
  const autoStartValue = document.getElementById("autoStartValue");
  const autoMinutes = document.getElementById("autoMinutes");
  const autoSeconds = document.getElementById("autoSeconds");
  const autoTimeContainer = document.getElementById("autoTimeContainer");
  const autoTimer = document.getElementById("autoTimer");
  const timerValue = document.getElementById("timerValue");
  const cancelAuto = document.getElementById("cancelAuto");

  // Variables de estado
  let isRunning = false;
  let currentAutoTime = 0;
  let autoStartInterval = null;

  // Configuración
  let config = {
    waitTimeMax: 3,
    circleDuration: 3000,
    volume: 0.7,
    autoStart: false,
    autoMinutes: 0,
    autoSeconds: 0,
  };

  // Inicializar
  function init() {
    loadConfig();
    setupEventListeners();
    updateUI();
    setupAudio();

    if (config.autoStart) {
      startAutoStart();
    }

    console.log("Sistema Niño Training iniciado");
  }

  function loadConfig() {
    const savedConfig = localStorage.getItem("ninoTrainingConfig");
    if (savedConfig) {
      config = JSON.parse(savedConfig);
    }
  }

  function saveConfigToStorage() {
    localStorage.setItem("ninoTrainingConfig", JSON.stringify(config));
  }

  function setupEventListeners() {
    mainButton.addEventListener("click", toggleSequence);
    configToggle.addEventListener("click", () =>
      configPanel.classList.add("active")
    );
    closeConfig.addEventListener("click", () =>
      configPanel.classList.remove("active")
    );
    saveConfig.addEventListener("click", saveConfiguration);
    waitRange.addEventListener("input", updateWaitRange);
    durationControl.addEventListener("input", updateDuration);
    volumeControl.addEventListener("input", updateVolume);
    autoStartToggle.addEventListener("change", toggleAutoStart);
    autoMinutes.addEventListener("change", updateAutoTime);
    autoSeconds.addEventListener("change", updateAutoTime);
    cancelAuto.addEventListener("click", cancelAutoStart);

    document.addEventListener("click", (e) => {
      if (
        !configPanel.contains(e.target) &&
        !configToggle.contains(e.target) &&
        configPanel.classList.contains("active")
      ) {
        configPanel.classList.remove("active");
      }
    });
  }

  function setupAudio() {
    greenSound.volume = config.volume;
    beepSound.volume = config.volume;
    beepFinalSound.volume = config.volume;

    // Cargar audios inmediatamente
    greenSound.load();
    beepSound.load();
    beepFinalSound.load();

    // Habilitar audio
    function enableAudio() {
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      silentAudio
        .play()
        .then(() => silentAudio.pause())
        .catch(() => {});
    }

    mainButton.addEventListener("click", enableAudio, { once: true });
  }

  function updateUI() {
    waitRange.value = config.waitTimeMax;
    waitValue.textContent = `${config.waitTimeMax}s`;
    durationControl.value = config.circleDuration / 1000;
    durationValue.textContent = `${config.circleDuration / 1000}s`;
    volumeControl.value = config.volume;
    volumeValue.textContent = `${Math.round(config.volume * 100)}%`;
    autoStartToggle.checked = config.autoStart;
    autoStartValue.textContent = config.autoStart ? "Activado" : "Desactivado";
    autoMinutes.value = config.autoMinutes;
    autoSeconds.value = config.autoSeconds;
    autoTimeContainer.style.display = config.autoStart ? "block" : "none";
  }

  function updateWaitRange() {
    config.waitTimeMax = parseInt(waitRange.value);
    waitValue.textContent = `${config.waitTimeMax}s`;
  }

  function updateDuration() {
    config.circleDuration = parseInt(durationControl.value) * 1000;
    durationValue.textContent = `${durationControl.value}s`;
  }

  function updateVolume() {
    config.volume = parseFloat(volumeControl.value);
    volumeValue.textContent = `${Math.round(config.volume * 100)}%`;
    greenSound.volume = config.volume;
    beepSound.volume = config.volume;
    beepFinalSound.volume = config.volume;
  }

  function toggleAutoStart() {
    config.autoStart = autoStartToggle.checked;
    autoStartValue.textContent = config.autoStart ? "Activado" : "Desactivado";
    autoTimeContainer.style.display = config.autoStart ? "block" : "none";

    if (config.autoStart) {
      startAutoStart();
    } else {
      cancelAutoStart();
    }
  }

  function updateAutoTime() {
    config.autoMinutes = parseInt(autoMinutes.value) || 0;
    config.autoSeconds = parseInt(autoSeconds.value) || 0;
    if (config.autoMinutes < 0) config.autoMinutes = 0;
    if (config.autoMinutes > 10) config.autoMinutes = 10;
    if (config.autoSeconds < 0) config.autoSeconds = 0;
    if (config.autoSeconds > 59) config.autoSeconds = 59;
    autoMinutes.value = config.autoMinutes;
    autoSeconds.value = config.autoSeconds;
  }

  function startAutoStart() {
    if (!config.autoStart || isRunning) return;
    cancelAutoStart();

    currentAutoTime = config.autoMinutes * 60 + config.autoSeconds;
    if (currentAutoTime === 0) currentAutoTime = 0;

    autoTimer.classList.add("active");
    updateTimerDisplay();

    autoStartInterval = setInterval(() => {
      currentAutoTime--;
      updateTimerDisplay();

      if (currentAutoTime <= 0) {
        clearInterval(autoStartInterval);
        autoTimer.classList.remove("active");

        if (!isRunning) {
          startSequence();
        }

        if (config.autoStart) {
          setTimeout(() => startAutoStart(), 1000);
        }
      }
    }, 1000);
  }

  function cancelAutoStart() {
    if (autoStartInterval) {
      clearInterval(autoStartInterval);
      autoStartInterval = null;
    }
    autoTimer.classList.remove("active");
    currentAutoTime = 0;
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(currentAutoTime / 60);
    const seconds = currentAutoTime % 60;
    timerValue.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  function saveConfiguration() {
    updateWaitRange();
    updateDuration();
    updateVolume();
    updateAutoTime();
    saveConfigToStorage();
    configPanel.classList.remove("active");

    if (config.autoStart) {
      startAutoStart();
    } else {
      cancelAutoStart();
    }

    console.log("Configuración guardada:", config);
  }

  async function toggleSequence() {
    if (isRunning) {
      stopSequence();
    } else {
      await startSequence();
    }
  }
  function playAudioFast(audio) {
    return new Promise((resolve) => {
      // Resetear y configurar
      audio.currentTime = 0;
      audio.volume = config.volume;

      // Intentar reproducir SIN manejo complejo de promesas
      try {
        audio
          .play()
          .then(() => {
            // Resolver inmediatamente, NO esperar onended
            // Esto hace que los beeps sean consecutivos
            resolve();
          })
          .catch(() => {
            // Si falla, continuar de inmediato
            resolve();
          });
      } catch (error) {
        // Si hay error, continuar
        resolve();
      }
    });
  }
  function activateLight(index) {
    // Usar requestAnimationFrame para sincronizar con render
    requestAnimationFrame(() => {
      lights[index].classList.add("active");
    });
  }
  function deactivateAllLights() {
    requestAnimationFrame(() => {
      lights.forEach((light) => light.classList.remove("active"));
    });
  }
  // FUNCIÓN PRINCIPAL CORREGIDA - SECUENCIA PASO A PASO
  async function startSequence() {
    if (isRunning) return;

    isRunning = true;
    stopRequested = false;

    // Cambiar botón inmediatamente
    mainButton.classList.add("stop");
    mainButton.innerHTML =
      '<i class="fas fa-stop"></i><span class="btn-text">DETENER</span>';

    cancelAutoStart();

    try {
      // 1. APAGAR TODAS LAS LUCES
      deactivateAllLights();

      // 2. REPRODUCIR VOZ (esperar a que termine)
      await playAudioAndWait(greenSound);
      if (stopRequested) return;

      // 3. ESPERA ALEATORIA
      const waitTime =
        (Math.floor(Math.random() * config.waitTimeMax) + 1) * 1000;
      await delay(waitTime);
      if (stopRequested) return;

      // 4. SECUENCIA RÁPIDA DE BEEPS (COMO PARTIDOR REAL)
      // Beep 1 - Luz Roja (INSTANTÁNEO)
        activateLight(0);
        playAudioFast(beepSound);
        if (stopRequested) return;
        await delay(100);
      // Beep 2 - Luz Amarillo 1 (INSTANTÁNEO)
        activateLight(1);
        playAudioFast(beepSound);
        if (stopRequested) return;
        await delay(100);

      // Beep 3 - Luz Amarillo 2 (INSTANTÁNEO)
        activateLight(2);
        playAudioFast(beepSound);
        if (stopRequested) return;
        await delay(100);

      // Beep Final - Luz Verde (INSTANTÁNEO)
        activateLight(3);
        playAudioFast(beepFinalound);
        if (stopRequested) return;
        // await delay(200);

      // 5. MANTENER LUCES
      await delay(config.circleDuration);
      if (stopRequested) return;

      // 6. APAGAR
      deactivateAllLights();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isRunning) {
        stopSequence();
      }

      if (config.autoStart) {
        setTimeout(startAutoStart, 1000);
      }
    }
  }
  // FUNCIÓN AUXILIAR PARA REPRODUCIR AUDIO Y ESPERAR
  function playAudioAndWait(audio) {
    return new Promise((resolve) => {
      audio.currentTime = 0;
      audio.volume = config.volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Para voz SÍ esperamos
            audio.onended = resolve;
          })
          .catch(() => {
            resolve(); // Si falla, continuar
          });
      } else {
        audio.onended = resolve;
      }
    });
  }

  // FUNCIÓN AUXILIAR PARA DELAY
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // FUNCIONES PARA MANEJAR LUCES
  function setLightActive(light, active) {
    if (active) {
      light.classList.add("active");
    } else {
      light.classList.remove("active");
    }
  }

  function deactivateAllLights() {
    lights.forEach((light) => {
      light.classList.remove("active");
    });
  }

  // DETENER SECUENCIA
  function stopSequence() {
    isRunning = false;
    mainButton.classList.remove("stop");
    mainButton.innerHTML =
      '<i class="fas fa-play"></i><span class="btn-text">INICIAR</span>';

    // Detener todos los sonidos
    greenSound.pause();
    greenSound.currentTime = 0;
    beepSound.pause();
    beepSound.currentTime = 0;
    beepFinalSound.pause();
    beepFinalSound.currentTime = 0;

    // Apagar luces
    deactivateAllLights();
  }

  // INICIAR APLICACIÓN
  init();
});
