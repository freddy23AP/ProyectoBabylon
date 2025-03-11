// Espera a que el documento HTML esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);

    function createScene() {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.7, 0.9, 1, 1);

        const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 500, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);

        // 1. Carga el modelo 3D
        BABYLON.SceneLoader.ImportMesh("", "./", "robot_extremo.glb", scene, function (meshes) {
            console.log("Modelo cargado correctamente", meshes);
            window.robot = meshes[0]; // Ahora usamos el primer mesh correctamente

            if (window.robot) {
                window.robot.scaling.set(50, 50, 50);
                window.robot.position.y = 0.5;

                 //  Rotación para corregir la orientación
                 window.robot.rotationQuaternion = null; // Deshabilita rotación
                 window.robot.rotation = new BABYLON.Vector3(0, -Math.PI / 10, 0); // Girar 90° en el eje Y
                 
                console.log("Robot listo para moverse", window.robot);
            } else {
                console.error("No se encontró el modelo del robot");
            }
        });

        return scene;
    }

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());

    // UI: Indicador de movimiento
    const directionText = document.createElement("div");
    directionText.style.position = "absolute";
    directionText.style.bottom = "120px";
    directionText.style.left = "50%";
    directionText.style.transform = "translateX(-50%)";
    directionText.style.background = "rgba(22, 111, 68, 0.7)";
    directionText.style.color = "white";
    directionText.style.padding = "10px 20px";
    directionText.style.borderRadius = "8px";
    directionText.style.fontSize = "18px";
    directionText.innerText = "Movimiento: Esperando...";
    document.body.appendChild(directionText);

    // 2. Función de movimiento
    const speed = 5;

    function moveRobot(direction) {
        if (!window.robot) {
            console.error("Robot no está definido todavía");
            return;
        }

        switch (direction) {
            case "left":
                window.robot.position.x -= speed;
                directionText.innerText = "Movimiento: Moviendo derecha ➡️"; 
                break;
            case "right":
                window.robot.position.x += speed;
                directionText.innerText = "Movimiento: Moviendo izquierda ⬅️"; 
                break;
        }

    }

    //Eventos de teclado
    window.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") moveRobot("right");  
        if (event.key === "ArrowRight") moveRobot("left");  
    });

    // Botones de interfaz
    document.getElementById("btn-left")?.addEventListener("click", () => moveRobot("right")); 
    document.getElementById("btn-right")?.addEventListener("click", () => moveRobot("left"));

   //Reconocimiento de voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    document.getElementById("start-voice")?.addEventListener("click", () => {
        recognition.start();
        console.log("Escuchando...");
    });

    recognition.addEventListener("result", (event) => {
        const speechToText = event.results[0][0].transcript.toLowerCase();
        console.log("Texto reconocido:", speechToText);
        document.getElementById("input-pregunta").value = speechToText; // Muestra el texto en el input
        responderPregunta(speechToText); // Responde automáticamente

        // Actualiza el label con el texto reconocido
        const labelVoz = document.getElementById("label-voz");
        if (labelVoz) {
            labelVoz.innerText = `Escribiendo: ${speechToText}`; 
        }

        // Movimiento del robot basado en la voz
        if (speechToText.includes("moviendo izquierda")) moveRobot("right"); // Cambio para que sea la dirección correcta
        if (speechToText.includes("moviendo derecha")) moveRobot("left"); // Cambio para que sea la dirección correcta
    });

    recognition.addEventListener("end", () => console.log("Reconocimiento de voz finalizado."));
} else {
    alert("Tu navegador no soporta reconocimiento de voz.");
}


    // IA y Preguntas
    const inputPregunta = document.getElementById("input-pregunta");
    const preguntarBtn = document.getElementById("preguntar-btn");
    const iaResponse = document.getElementById("ia-response");

    // Función para responder a una pregunta
    async function responderPregunta(pregunta) {
        pregunta = pregunta.toLowerCase();
        let respuesta = "No entiendo la pregunta.";

        // Respuestas manuales para preguntas comunes
        if (pregunta.includes("capital de españa")) {
            respuesta = "La capital de España es Madrid.";
        } else if (pregunta.includes("que es la ia")) {
            respuesta = "La inteligencia artificial (IA) es la simulación de procesos de inteligencia humana por parte de sistemas informáticos.";
        } else if (pregunta.includes("quien descubrió América")) {
            respuesta = "Fue Cristóbal Colón.";
        }
        else if (pregunta.includes("continente") && (pregunta.includes("españa") || pregunta.includes("francia"))) {
            respuesta = "España y Francia están en Europa.";
        } else {
            // Consulta la IA en el backend si no hay respuesta manual
            try {
                const response = await fetch("http://localhost:3000/preguntar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: pregunta })
                });

                const data = await response.json();
                respuesta = data.respuesta || "No pude entender la respuesta.";
            } catch (error) {
                console.error(" Error al obtener respuesta de la IA:", error);
                respuesta = "Error al conectar con la IA.";
            }
        }

        iaResponse.innerText = "IA: " + respuesta;
    }

    // Evento que dispara la función responderPregunta cuando se hace clic en el botón "preguntar-btn"
    preguntarBtn.addEventListener("click", () => {
        responderPregunta(inputPregunta.value);
    });

    // DETECCIÓN DE GESTOS CON MANO (MediaPipe)
    const video = document.getElementById("video");
    const canvasOutput = document.getElementById("output");
    const ctx = canvasOutput.getContext("2d");

    // Función para acceder a la cámara y mostrar el video
    async function startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    }

    startCamera();

    // Configura la librería MediaPipe para la detección de manos
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // Evento que procesa los resultados de la detección de manos
    hands.onResults((results) => {
        ctx.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
        if (results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const thumb = landmarks[4].x; // Pulgar
            const index = landmarks[8].x; // Índice

            // Si el pulgar está a la derecha del índice, movemos el robot a la derecha
            if (thumb < index) {
                moveRobot("right");
            } else {
                // Si el pulgar está a la izquierda del índice, movemos el robot a la izquierda
                moveRobot("left");
            }
        }
    });

    // Configura la cámara para enviar frames a MediaPipe
    const camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 640,
        height: 480
    });

    camera.start();
});
