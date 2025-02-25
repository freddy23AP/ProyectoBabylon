const express = require("express"); // Framework para crear el servidor web
const cors = require("cors"); // Middleware para permitir solicitudes desde otros dominios (CORS)
const fetch = require("node-fetch"); // Módulo para hacer solicitudes HTTP

const app = express();// Creamos una instancia de la aplicación Express
app.use(express.json());// Middleware para permitir el uso de JSON en las solicitudes
app.use(cors());// Middleware para habilitar CORS y permitir solicitudes desde diferentes orígenes


// Definimos una ruta POST en "/preguntar" para manejar las preguntas del usuario
app.post("/preguntar", async (req, res) => {
    // Extraemos la pregunta (prompt) enviada por el usuario en el cuerpo de la solicitud
    const { prompt } = req.body;

    try {
        // Hacemos una solicitud a la API local de IA (Ollama) para obtener una respuesta
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST", // Método HTTP POST
            headers: { "Content-Type": "application/json" }, // Indicamos que el contenido es JSON
            body: JSON.stringify({ model: "mistral", prompt: prompt }) // Enviamos el prompt con el modelo a utilizar
        });

        // Convertimos la respuesta en texto
        const result = await response.text();

        let finalResponse = ""; // Variable para almacenar la respuesta procesada
        const lines = result.trim().split("\n"); // Dividimos la respuesta en líneas para procesarlas una por una

        // Recorremos cada línea y tratamos de extraer el JSON con la respuesta
        for (let line of lines) {
            try {
                const parsed = JSON.parse(line); // Intentamos parsear la línea como JSON
                if (parsed.response) { // Si el JSON tiene una clave "response"
                    finalResponse += parsed.response + " "; // La añadimos a la respuesta final
                }
            } catch (error) {
                console.warn("Error al parsear línea JSON:", line); // Si hay un error, lo mostramos en la consola
            }
        }

        finalResponse = finalResponse.trim(); // Elimina los espacios extra antes de procesar la respuesta

        // Extraemos solo la primera oración para una respuesta más concisa
        const match = finalResponse.match(/^[^.]*\./); // Busca la primera oración completa
        const firstSentence = match ? match[0] : "No se encontró una respuesta clara."; // Si encuentra una oración, la usa

        // Enviamos la respuesta en formato JSON
        res.json({ respuesta: firstSentence });

    } catch (error) {
        console.error("Error con Ollama:", error); // Capturamos y mostramos errores en la consola
        res.status(500).json({ error: "No se pudo obtener respuesta de la IA" }); // Enviamos un error al cliente
    }
});

const PORT = 3000; // pueto del servidor
// Iniciamos el servidor en el puerto definido y mostramos un mensaje en consola
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
