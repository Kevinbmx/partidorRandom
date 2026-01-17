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
  const beepFinalound = document.getElementById("beepFinalound");

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
  let isAutoStartActive = false;
  let autoStartTimeout = null;
  let currentAutoTime = 0;
  let autoStartInterval = null;

  // Configuración
  let config = {
    waitTimeMax: 3, // 1-10 segundos
    circleDuration: 4000, // 4 segundos por defecto
    volume: 0.7,
    autoStart: false,
    autoMinutes: 0,
    autoSeconds: 5,
  };

  // Inicializar
  function init() {
    loadConfig();
    setupEventListeners();
    updateUI();
    setupAudio();

    // Iniciar auto start si está activado
    if (config.autoStart) {
      startAutoStart();
    }

    console.log("Sistema Niño Training iniciado");
  }
  // Cargar configuración
  function loadConfig() {
    const savedConfig = localStorage.getItem("ninoTrainingConfig");
    if (savedConfig) {
      config = JSON.parse(savedConfig);
    }
  }

  // Guardar configuración
  function saveConfigToStorage() {
    localStorage.setItem("ninoTrainingConfig", JSON.stringify(config));
  }

  // Configurar eventos
  function setupEventListeners() {
    // Botón principal
    mainButton.addEventListener("click", toggleSequence);

    // Panel de configuración
    configToggle.addEventListener("click", () => {
      configPanel.classList.add("active");
    });

    closeConfig.addEventListener("click", () => {
      configPanel.classList.remove("active");
    });

    saveConfig.addEventListener("click", saveConfiguration);

    // Controles de configuración
    waitRange.addEventListener("input", updateWaitRange);
    durationControl.addEventListener("input", updateDuration);
    volumeControl.addEventListener("input", updateVolume);

    autoStartToggle.addEventListener("change", toggleAutoStart);
    autoMinutes.addEventListener("change", updateAutoTime);
    autoSeconds.addEventListener("change", updateAutoTime);

    // Cancelar auto inicio
    cancelAuto.addEventListener("click", cancelAutoStart);

    // Cerrar panel al hacer clic fuera
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

  // Configurar audio
  function setupAudio() {
    greenSound.volume = config.volume;
    beepSound.volume = config.volume;

    // Precargar audios inmediatamente
    greenSound.load();
    beepSound.load();

    // Estado de audio habilitado
    let audioEnabled = false;

    // Función para habilitar audio definitivamente
    function enableAudio() {
      if (audioEnabled) return;

      audioEnabled = true;
      console.log("Audio habilitado");

      // Reproducir y pausar inmediatamente para desbloquear
      const silentAudio = new Audio();
      silentAudio.volume = 0;

      // Crear un buffer de audio vacío
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createBufferSource();
      source.buffer = context.createBuffer(1, 1, 22050);
      source.connect(context.destination);
      source.start(0);

      // También intentar con un audio normal
      silentAudio
        .play()
        .then(() => {
          silentAudio.pause();
          console.log("Audio completamente desbloqueado");
        })
        .catch((e) => console.log("Silent audio falló:", e));
    }

    // Habilitar audio con cualquier interacción
    function handleUserInteraction() {
      enableAudio();
      // Remover listeners después de la primera interacción
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    }

    // Escuchar múltiples tipos de interacción
    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    // También escuchar clics específicos en elementos importantes
    mainButton.addEventListener("click", enableAudio, { once: true });
    configToggle.addEventListener("click", enableAudio, { once: true });

    // Modificar la función playSound para manejar mejor el audio
    window.playSound = async function (audio) {
      if (!isRunning) return;

      return new Promise((resolve) => {
        audio.currentTime = 0;

        // Intentar reproducir con manejo de errores mejorado
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audio.onended = () => {
                audio.onended = null;
                resolve();
              };
            })
            .catch((error) => {
              console.error("Error reproduciendo sonido:", error);

              // Si falla por política de autoplay, esperar un momento y reintentar
              if (error.name === "NotAllowedError") {
                setTimeout(() => {
                  enableAudio();
                  audio
                    .play()
                    .then(() => {
                      audio.onended = () => {
                        audio.onended = null;
                        resolve();
                      };
                    })
                    .catch((e) => {
                      console.error("Reintento falló:", e);
                      resolve(); // Continuar de todos modos
                    });
                }, 100);
              } else {
                resolve(); // Continuar a pesar del error
              }
            });
        } else {
          // Para navegadores antiguos
          audio.onended = () => {
            audio.onended = null;
            resolve();
          };
        }
      });
    };
  }
  // Actualizar UI con configuración
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

  // Actualizar rango de espera
  function updateWaitRange() {
    config.waitTimeMax = parseInt(waitRange.value);
    waitValue.textContent = `${config.waitTimeMax}s`;
  }

  // Actualizar duración
  function updateDuration() {
    config.circleDuration = parseInt(durationControl.value) * 1000;
    durationValue.textContent = `${durationControl.value}s`;
  }

  // Actualizar volumen
  function updateVolume() {
    config.volume = parseFloat(volumeControl.value);
    volumeValue.textContent = `${Math.round(config.volume * 100)}%`;
    greenSound.volume = config.volume;
    beepSound.volume = config.volume;
    beepFinalound.volume = config.volume;
  }

  // Alternar auto inicio
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

  // Actualizar tiempo auto inicio
  function updateAutoTime() {
    config.autoMinutes = parseInt(autoMinutes.value) || 0;
    config.autoSeconds = parseInt(autoSeconds.value) || 0;

    // Validar valores
    if (config.autoMinutes < 0) config.autoMinutes = 0;
    if (config.autoMinutes > 10) config.autoMinutes = 10;
    if (config.autoSeconds < 0) config.autoSeconds = 0;
    if (config.autoSeconds > 59) config.autoSeconds = 59;

    autoMinutes.value = config.autoMinutes;
    autoSeconds.value = config.autoSeconds;
  }

  // Iniciar auto inicio
  function startAutoStart() {
    if (!config.autoStart || isRunning) return;

    cancelAutoStart(); // Cancelar cualquier temporizador existente

    // Calcular tiempo total en segundos
    currentAutoTime = config.autoMinutes * 60 + config.autoSeconds;

    // Mostrar temporizador
    autoTimer.classList.add("active");
    updateTimerDisplay();

    // Iniciar cuenta regresiva
    autoStartInterval = setInterval(() => {
      currentAutoTime--;
      updateTimerDisplay();

      if (currentAutoTime <= 0) {
        clearInterval(autoStartInterval);
        autoTimer.classList.remove("active");

        // Iniciar secuencia automáticamente
        if (!isRunning) {
          startSequence();
        }

        // Reiniciar auto inicio si sigue activado
        if (config.autoStart) {
          setTimeout(() => startAutoStart(), 1000);
        }
      }
    }, 1000);
  }

  // Cancelar auto inicio
  function cancelAutoStart() {
    if (autoStartInterval) {
      clearInterval(autoStartInterval);
      autoStartInterval = null;
    }

    if (autoStartTimeout) {
      clearTimeout(autoStartTimeout);
      autoStartTimeout = null;
    }

    autoTimer.classList.remove("active");
    currentAutoTime = 0;
  }

  // Actualizar display del temporizador
  function updateTimerDisplay() {
    const minutes = Math.floor(currentAutoTime / 60);
    const seconds = currentAutoTime % 60;
    timerValue.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  // Guardar configuración
  function saveConfiguration() {
    updateWaitRange();
    updateDuration();
    updateVolume();
    updateAutoTime();

    saveConfigToStorage();
    configPanel.classList.remove("active");

    // Reiniciar auto inicio si está activado
    if (config.autoStart) {
      startAutoStart();
    } else {
      cancelAutoStart();
    }

    console.log("Configuración guardada:", config);
  }

  // Alternar secuencia (iniciar/detener)
  async function toggleSequence() {
    if (isRunning) {
      stopSequence();
    } else {
      await startSequence();
    }
  }

  // Iniciar secuencia
  async function startSequence() {
    if (isRunning) return;

    isRunning = true;
    mainButton.classList.add("stop");
    mainButton.innerHTML =
      '<i class="fas fa-stop"></i><span class="btn-text">DETENER</span>';

    // Cancelar auto inicio temporalmente
    cancelAutoStart();

    try {
      // Desactivar todas las luces
      deactivateAllLights();

      // Paso 1: Reproducir sonido verde
      await playSound(greenSound);

      // Paso 2: Espera aleatoria (1 a waitTimeMax segundos)
      const randomWait = getRandomWaitTime();
      await wait(randomWait);

      // Paso 3: Reproducir 4 beeps y activar luces
      for (let i = 0; i < 4; i++) {
        if (!isRunning) break; // Verificar si se detuvo
        if (i != 3) {
          await playSound(beepSound);
          // await wait(0); // Pequeña pausa entre beeps
        }
        setLightActive(lights[i], true);
      }
      await playSound(beepFinalound);

      // Paso 4: Mantener todas activas por circleDuration
      if (isRunning) {
        await wait(config.circleDuration);
      }

      // Paso 5: Desactivar todas las luces
      deactivateAllLights();
    } catch (error) {
      console.error("Error en secuencia:", error);
    } finally {
      if (isRunning) {
        stopSequence();
      }

      // Reactivar auto inicio si está configurado
      if (config.autoStart) {
        startAutoStart();
      }
    }
  }

  // Detener secuencia
  function stopSequence() {
    isRunning = false;
    mainButton.classList.remove("stop");
    mainButton.innerHTML =
      '<i class="fas fa-play"></i><span class="btn-text">INICIAR</span>';

    // Detener sonidos
    greenSound.pause();
    greenSound.currentTime = 0;
    beepSound.pause();
    beepSound.currentTime = 0;
    beepFinalound.pause();
    beepFinalound.currentTime = 0;

    // Detener temporizadorSound.pause();
    beepSound.currentTime = 0;
    // Desactivar todas las luces
    deactivateAllLights();
  }

  // Funciones auxiliares
  function getRandomWaitTime() {
    const waitSeconds = Math.floor(Math.random() * config.waitTimeMax) + 1;
    return waitSeconds * 1000;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function playSound(audio) {
    if (!isRunning) return;

    return new Promise((resolve) => {
      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.onended = resolve;
          })
          .catch((error) => {
            console.error("Error reproduciendo sonido:", error);
            resolve(); // Continuar a pesar del error
          });
      }
    });
  }

  function setLightActive(light, active) {
    if (active) {
      light.classList.add("active");
    } else {
      light.classList.remove("active");
    }
  }

  function deactivateAllLights() {
    lights.forEach((light) => {
      setLightActive(light, false);
    });
  }

  // Inicializar aplicación
  init();
});
