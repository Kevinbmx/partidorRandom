document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const circles = [
        document.getElementById('circle1'),  // Rojo
        document.getElementById('circle2'),  // Amarillo 1
        document.getElementById('circle3'),  // Amarillo 2
        document.getElementById('circle4')   // Verde
    ];
    
    const redButton = document.getElementById('redButton');
    const greenButton = document.getElementById('greenButton');
    const redSound = document.getElementById('redSound');
    const greenSound = document.getElementById('greenSound');
    const beepSound = document.getElementById('beepSound');
    
    // Elementos de configuración
    const waitRange = document.getElementById('waitRange');
    const waitValue = document.getElementById('waitValue');
    const durationControl = document.getElementById('duration');
    const durationValue = document.getElementById('durationValue');
    const volumeControl = document.getElementById('volume');
    const volumeValue = document.getElementById('volumeValue');
    
    // Elementos de estado
    const currentStatus = document.getElementById('currentStatus');
    const waitTime = document.getElementById('waitTime');
    const activeCirclesElement = document.getElementById('activeCircles');
    
    // Variables de configuración
    let waitTimeMin = 1;  // Valor mínimo del rango
    let waitTimeMax = 3; // Valor máximo del rango (cambiado a 10 como solicitas)
    let circleDuration = 4000;  // 4 segundos por defecto
    let isSequenceRunning = false;
    let activeCircles = 0;
    
    // Inicializar valores
    function initValues() {
        // Configurar rango de espera (1-10 segundos)
        updateWaitRange();
        
        // Configurar duración de círculos
        durationControl.value = circleDuration / 1000;
        durationValue.textContent = durationControl.value;
        durationControl.addEventListener('input', function() {
            circleDuration = this.value * 1000;
            durationValue.textContent = this.value;
        });
        
        // Configurar volumen
        redSound.volume = volumeControl.value;
        greenSound.volume = volumeControl.value;
        beepSound.volume = volumeControl.value;
        volumeValue.textContent = `${Math.round(volumeControl.value * 100)}%`;
        
        volumeControl.addEventListener('input', function() {
            const volume = this.value;
            redSound.volume = volume;
            greenSound.volume = volume;
            beepSound.volume = volume;
            volumeValue.textContent = `${Math.round(volume * 100)}%`;
        });
        
        // Actualizar estado inicial
        updateActiveCircles();
        updateStatus('idle', 'Listo');
    }
    
    // Actualizar rango de espera (1-10 segundos)
    function updateWaitRange() {
        waitTimeMin = 1;  // Siempre 1 segundo mínimo
        waitTimeMax = parseInt(waitRange.value);  // Máximo configurable 1-10
        waitValue.textContent = `${waitTimeMin}-${waitTimeMax}`;
    }
    
    // Generar tiempo de espera aleatorio entre 1 y waitTimeMax
    function getRandomWaitTime() {
        const waitSeconds = Math.floor(Math.random() * (waitTimeMax - waitTimeMin + 1)) + waitTimeMin;
        return waitSeconds * 1000; // Convertir a milisegundos
    }
    
    // Actualizar contador de círculos activos
    function updateActiveCircles() {
        activeCircles = circles.filter(circle => circle.classList.contains('active')).length;
        activeCirclesElement.textContent = `${activeCircles}/4`;
    }
    
    // Actualizar estado del sistema
    function updateStatus(type, message) {
        currentStatus.textContent = message;
        currentStatus.className = 'status-value ' + type;
    }
    
    // Activar/desactivar círculos
    function setCircleActive(circle, active) {
        if (active) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
        updateActiveCircles();
    }
    
    // Activar todos los círculos a la vez
    function activateAllCircles() {
        circles.forEach(circle => {
            setCircleActive(circle, true);
        });
        updateStatus('active', 'Círculos activados');
    }
    
    // Desactivar todos los círculos a la vez
    function deactivateAllCircles() {
        circles.forEach(circle => {
            setCircleActive(circle, false);
        });
        updateStatus('idle', 'Círculos desactivados');
    }
    
    // Activar solo círculos amarillos
    function activateYellowCircles() {
        setCircleActive(circles[1], true);  // Amarillo 1
        setCircleActive(circles[2], true);  // Amarillo 2
        setCircleActive(circles[0], false); // Rojo
        setCircleActive(circles[3], false); // Verde
        updateStatus('active', 'Amarillos activados');
    }
    
    // Función mejorada para reproducir beeps de forma confiable
    async function playBeepWithRetry() {
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                // Resetear el audio
                beepSound.currentTime = 0;
                
                // Crear una promesa para manejar el play
                return new Promise((resolve, reject) => {
                    beepSound.oncanplaythrough = () => {
                        const playPromise = beepSound.play();
                        
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    // Beep reproducido exitosamente
                                    setTimeout(() => {
                                        beepSound.pause();
                                        resolve(true);
                                    }, 80); // Beep de 300ms
                                })
                                .catch(e => {
                                    retryCount++;
                                    if (retryCount >= maxRetries) {
                                        reject(e);
                                    } else {
                                        // Reintentar después de un breve delay
                                        setTimeout(() => playBeepWithRetry().then(resolve).catch(reject), 0);
                                    }
                                });
                        }
                    };
                    
                    // Forzar carga del audio
                    beepSound.load();
                });
                
            } catch (error) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error('Error reproduciendo beep después de', maxRetries, 'intentos:', error);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 80));
            }
        }
    }
    
    // Botón Rojo
    redButton.addEventListener('click', async function() {
        if (isSequenceRunning) return;
        isSequenceRunning = true;
        
        // Efecto visual del botón
        redButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            redButton.style.transform = 'scale(1)';
        }, 150);
        
        // Activar círculos amarillos
        activateYellowCircles();
        updateStatus('running', 'Reproduciendo sonido rojo...');
        
        try {
            // Reproducir sonido rojo
            redSound.currentTime = 0;
            await redSound.play();
            
            // Mantener amarillos activos hasta que termine el sonido
            await new Promise(resolve => {
                redSound.onended = resolve;
            });
            
            // Desactivar todos los círculos
            deactivateAllCircles();
            updateStatus('idle', 'Sonido rojo completado');
            
        } catch (error) {
            console.error('Error en botón rojo:', error);
            updateStatus('idle', 'Error en reproducción');
        } finally {
            isSequenceRunning = false;
        }
    });
    
    // Botón Verde - VERSIÓN MEJORADA
    greenButton.addEventListener('click', async function() {
        if (isSequenceRunning) return;
        isSequenceRunning = true;
        
        // Efecto visual del botón
        greenButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            greenButton.style.transform = 'scale(1)';
        }, 150);
        
        try {
            // Paso 1: Reproducir sonido verde
            updateStatus('running', 'Reproduciendo sonido verde...');
            
            // Asegurar que el sonido verde se reproduzca completamente
            greenSound.currentTime = 0;
            
            // Esperar a que el audio esté listo
            await new Promise(resolve => {
                greenSound.oncanplaythrough = resolve;
                greenSound.load();
            });
            
            await greenSound.play();
            
            // Esperar a que termine el sonido verde COMPLETAMENTE
            await new Promise(resolve => {
                greenSound.onended = resolve;
            });
            
            // Paso 2: Espera aleatoria entre 1 y waitTimeMax segundos
            const randomWait = getRandomWaitTime();
            updateStatus('running', `Esperando ${randomWait/1000}s antes de beeps...`);
            waitTime.textContent = `${randomWait/1000} segundos`;
            
            // Mostrar cuenta regresiva
            let remaining = randomWait / 1000;
            const countdownInterval = setInterval(() => {
                remaining -= 0.1;
                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 100);
            
            await new Promise(resolve => setTimeout(resolve, randomWait));
            clearInterval(countdownInterval);
            
            // Paso 3: Reproducir 4 beeps CONFIABLES y activar círculos
            updateStatus('running', 'Iniciando secuencia de beeps...');
            
            // Activar y desactivar todos los círculos rápidamente para "resetear"
            deactivateAllCircles();
            
            for (let i = 0; i < 4; i++) {
                try {
                    // Activar círculo ANTES del beep
                    setCircleActive(circles[i], true);
                    
                    // Pequeña pausa para asegurar que se vea activado
                    await new Promise(resolve => setTimeout(resolve, 0));
                    
                    // Reproducir beep con sistema de reintentos
                    await playBeepWithRetry();
                    
                    // Pequeña pausa entre beeps
                    if (i < 3) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    
                } catch (error) {
                    console.error(`Error en beep ${i + 1}:`, error);
                    // Continuar con el siguiente beep a pesar del error
                    if (i < 3) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            }
            
            // Paso 4: Mantener todos activos por circleDuration segundos
            updateStatus('active', `Círculos activos por ${circleDuration/1000}s`);
            
            // Temporizador para circleDuration
            await new Promise(resolve => setTimeout(resolve, circleDuration));
            
            // Paso 5: Desactivar todos los círculos simultáneamente
            deactivateAllCircles();
            updateStatus('idle', 'Secuencia completada');
            waitTime.textContent = '-';
            
        } catch (error) {
            console.error('Error en secuencia verde:', error);
            updateStatus('idle', 'Error en secuencia');
            deactivateAllCircles();
        } finally {
            isSequenceRunning = false;
        }
    });
    
    // Event listener para el rango de espera (1-10 segundos)
    waitRange.addEventListener('input', function() {
        updateWaitRange();
        waitTime.textContent = `${waitTimeMin}-${waitTimeMax}s`;
    });
    
    // Habilitar audio al primer clic
    function initAudio() {
        // Intentar reproducir y pausar para habilitar audio
        const testSound = new Audio();
        testSound.volume = 0;
        
        testSound.play().then(() => {
            testSound.pause();
            console.log('Audio habilitado');
            
            // También cargar nuestros audios
            redSound.load();
            greenSound.load();
            beepSound.load();
        }).catch(e => {
            console.log('Audio no habilitado, necesitas interactuar:', e);
        });
    }
    
    // Habilitar audio cuando se haga clic en cualquier parte
    document.addEventListener('click', function enableAudio() {
        document.removeEventListener('click', enableAudio);
        initAudio();
    });
    
    // También habilitar con los botones principales
    redButton.addEventListener('click', initAudio, { once: true });
    greenButton.addEventListener('click', initAudio, { once: true });
    
    // Manejar errores de audio
    redSound.onerror = greenSound.onerror = beepSound.onerror = function(e) {
        console.error('Error cargando audio:', e);
        updateStatus('idle', 'Error: Sonidos no encontrados');
        
        // Crear sonidos de fallback si no se encuentran los archivos
        if (!redSound.src || redSound.error) {
            console.log('Usando sonido de fallback');
        }
    };
    
    // Inicializar la aplicación
    initValues();
    
    // Información en consola
    console.log('Sistema de Control de Secuencia iniciado');
    console.log('Configuración:');
    console.log('- Tiempo de espera:', waitTimeMin + '-' + waitTimeMax + 's');
    console.log('- Duración círculos:', circleDuration/1000 + 's');
    console.log('- Volumen:', volumeControl.value);
    
    // Precargar audios
    setTimeout(() => {
        redSound.load();
        greenSound.load();
        beepSound.load();
    }, 1000);
});