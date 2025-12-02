// Inicializar Iconos
if (typeof lucide !== 'undefined') lucide.createIcons();

// --- CLASES ---
class Pregunta {
    constructor(texto, opciones, respuestaCorrecta, explicacion) {
        this.texto = texto;
        this.opciones = opciones; 
        this.respuestaCorrecta = respuestaCorrecta; 
        this.explicacion = explicacion;
    }
}

class Examen {
    constructor() {
        this.bancoPreguntas = []; // Se llena con Fetch
        this.preguntasActivas = [];
        this.indice = 0;
        this.puntaje = 0;
    }
    
    // Método para cargar datos desde JSON
    cargarDatos(datosJson) {
        this.bancoPreguntas = datosJson.map(d => 
            new Pregunta(d.texto, d.opciones, d.respuestaCorrecta, d.explicacion)
        );
    }

    generarExamen() {
        // Validar que haya preguntas cargadas
        if (this.bancoPreguntas.length === 0) {
            console.error("No hay preguntas cargadas.");
            return false;
        }
        this.preguntasActivas = [...this.bancoPreguntas].sort(() => Math.random() - 0.5).slice(0, 5);
        this.indice = 0;
        this.puntaje = 0;
        return true;
    }

    obtenerPregunta() { return this.preguntasActivas[this.indice]; }
    
    responder(indiceOpcion) {
        const actual = this.obtenerPregunta();
        const correcta = actual.respuestaCorrecta === indiceOpcion;
        if (correcta) this.puntaje += 10;
        return { correcta, indiceCorrecto: actual.respuestaCorrecta };
    }
    
    siguiente() {
        this.indice++;
        return this.indice < this.preguntasActivas.length;
    }
}

// Datos de Tips
const tipsData = [
    "Tip: Potencias con exponente igual a 0: Cualquier número elevado a 0 es siempre 1.",
    "Tip: Potencias con exponente igual a 1: Cualquier número elevado a 1 siempre será el mismo número.",
    "Tip: Potencias con Base igual a 10: El exponente indica el número de ceros que tiene el resultado."
];

// --- APP PRINCIPAL ---
const app = {
    examen: new Examen(),
    
    init: function() {
        // 1. Cargar Iconos
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // 2. Cargar Splash Screen y Datos
        this.iniciarCarga();

        // 3. Iniciar Tips
        this.iniciarTipsRotativos();
        
        // 4. Check PWA y Registro SW
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrado:', reg.scope))
                .catch(err => console.error('Error al registrar SW:', err));
        }
    }, // <--- ¡AQUÍ FALTABA CERRAR LA LLAVE EN TU CÓDIGO!

    // --- REQUISITO: USO DE FETCH ---
    iniciarCarga: async function() {
        try {
            const respuesta = await fetch('./datos.json');
            const datos = await respuesta.json();
            
            this.examen.cargarDatos(datos);
            console.log("Preguntas cargadas vía Fetch:", datos.length);

            setTimeout(() => {
                document.getElementById('splash-screen').classList.add('fade-out');
                setTimeout(() => document.getElementById('splash-screen').style.display = 'none', 500);
            }, 1500);

        } catch (error) {
            console.error("Error cargando preguntas:", error);
            const splashText = document.querySelector('#splash-screen p');
            if(splashText) splashText.innerText = "Error cargando datos. Verifica datos.json";
        }
    },

    iniciarTipsRotativos: async function() {
        const tipElement = document.getElementById('tip-text');
        if(!tipElement) return;

        tipElement.innerText = "Cargando datos curiosos...";
        await new Promise(r => setTimeout(r, 1000));
        let index = 0;
        const cambiarTexto = () => {
            tipElement.classList.remove('opacity-100');
            tipElement.classList.add('opacity-0');
            setTimeout(() => {
                tipElement.innerText = tipsData[index];
                index = (index + 1) % tipsData.length;
                tipElement.classList.remove('opacity-0');
                tipElement.classList.add('opacity-100');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 500); 
        };
        cambiarTexto(); 
        setInterval(cambiarTexto, 5000); 
    },

    navegar: function(vistaId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById('view-' + vistaId).classList.add('active');
        window.scrollTo(0,0);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // --- REQUISITO: NOTIFICACIONES ---
    iniciarExamen: function() {
        this.solicitarPermisoNotificaciones();

        const exito = this.examen.generarExamen();
        if (exito) {
            this.renderizarPregunta();
            this.navegar('exam');
        } else {
            this.mostrarToast("Error: No se cargaron las preguntas.", "error");
        }
    },

    solicitarPermisoNotificaciones: function() {
        if (!("Notification" in window)) return;

        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    this.mostrarToast("Notificaciones activadas", "success");
                }
            });
        }
    },

    enviarNotificacionFin: function(puntaje) {
        if (Notification.permission === "granted") {
            new Notification("¡Examen Terminado!", {
                body: `Has completado tu práctica. Puntaje final: ${puntaje}/50`,
                icon: "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"
            });
        }
    },

    renderizarPregunta: function() {
        const pregunta = this.examen.obtenerPregunta();
        document.getElementById('q-current').innerText = this.examen.indice + 1;
        document.getElementById('q-total').innerText = 5;
        document.getElementById('score-display').innerText = this.examen.puntaje;
        
        const porcentaje = ((this.examen.indice) / 5) * 100;
        document.getElementById('progress-bar').style.width = `${porcentaje}%`;
        
        document.getElementById('question-text').innerHTML = pregunta.texto;
        
        const container = document.getElementById('options-container');
        container.innerHTML = ''; 
        pregunta.opciones.forEach((opcion, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn w-full bg-white border border-gray-200 p-4 rounded-xl text-left shadow-sm hover:bg-gray-50 transition-all font-medium text-gray-700 outline-none focus:outline-none ring-0 focus:ring-0';
            btn.innerText = opcion;
            btn.onclick = () => app.verificarRespuesta(index, btn);
            container.appendChild(btn);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    verificarRespuesta: function(indexSeleccionado, btnElement) {
        const botones = document.querySelectorAll('.option-btn');
        botones.forEach(b => b.disabled = true);
        const resultado = this.examen.responder(indexSeleccionado);
        
        if (resultado.correcta) {
            btnElement.classList.add('correct');
            this.mostrarToast("¡Correcto!", "success");
        } else {
            btnElement.classList.add('wrong');
            this.mostrarToast("Incorrecto", "error");
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            botones[resultado.indiceCorrecto].classList.add('correct');
        }

        setTimeout(() => {
            if (this.examen.siguiente()) { 
                this.renderizarPregunta(); 
            } else {
                const puntajeFinal = this.examen.puntaje;
                document.getElementById('final-score').innerText = puntajeFinal;
                this.enviarNotificacionFin(puntajeFinal);
                this.navegar('result');
            }
        }, 1500);
    },

    mostrarToast: function(msg, tipo) {
        const toast = document.getElementById('toast');
        if(!toast) return;
        toast.innerText = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
        
        if (tipo === 'success') {
            toast.className = toast.className.replace('bg-gray-800', 'bg-green-600').replace('bg-red-500', '');
        } else if (tipo === 'error') {
            toast.className = toast.className.replace('bg-green-600', 'bg-red-500').replace('bg-gray-800', '');
        } else {
            toast.className = 'fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl opacity-1 transition-all duration-300 pointer-events-none z-50 translate-y-[0]';
        }

        setTimeout(() => { 
            toast.style.opacity = '0'; 
            toast.style.transform = 'translate(-50%, -20px)'; 
        }, 2000);
    },
    
    cancelarExamen: function() { if(confirm('¿Salir del examen?')) this.navegar('home'); }
};

window.addEventListener('load', () => app.init());