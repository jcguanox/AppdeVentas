const express = require("express");
const router = express.Router();
const fs = require("fs");
const { exec } = require("child_process");

router.post("/imprimir-pedido", async (req, res) => {
    const { pedidoId, productos, totalPrice} = req.body;
    console.log("Generando ticket para impresión...");

    const filePath = `C:\\Users\\hp\\Documents\\GitHub\\tesisPuceTec\\backend\\ticket.txt`;

    const now = new Date();
    const fechaHora = now.toLocaleString("es-EC", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const ancho = 32;

    const centrar = (texto) => {
        const espacio = Math.max(0, Math.floor((ancho - texto.length) / 2));
        return " ".repeat(espacio) + texto;
    };

    let contenido = "";
    contenido += `${centrar("ORDEN DE PEDIDO")}\n\n`;
    contenido += `${centrar("POLLOS A LA BRASA")}\n`;
    contenido += `${centrar("DEL VALLE")}\n`;
    contenido += `${centrar("TELF: 0959224201")}\n\n`;
    contenido += `${centrar(fechaHora)}\n\n`;

    contenido += `${centrar("NÚMERO DE ORDEN:")}\n`;
    contenido += `${centrar(`#${pedidoId}`)}\n\n`;

    contenido += `CANT  PRODUCTO  P.UNIT\n`;
contenido += `-------------------------------\n`;

productos.forEach(({ nombre, cantidad, precio }) => {
    const cantidadFormateada = String(cantidad ?? "").padEnd(4, " ");
    const nombreFormateado = (nombre ?? "").padEnd(18, " ").substring(0, 18);
    const precioNumero = parseFloat(precio);
    const precioFormateado = isNaN(precioNumero)
        ? "$0.00"
        : `$${precioNumero.toFixed(2)}`.padStart(6, " ");
    
    contenido += `${cantidadFormateada} ${nombreFormateado}${precioFormateado}\n`;
});




    contenido += `\nTOTAL: $${totalPrice.toFixed(2)}\n`;
    contenido += `*Documento sin valor tributario*\n`;
    contenido += `${centrar("GRACIAS POR PREFERIRNOS")}\n\n\n`;

    fs.writeFileSync(filePath, contenido, "utf-8");

    const printCommand = `notepad /p "${filePath}"`;

    exec(printCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("Error al imprimir:", error);
            return res.status(500).send("Error al imprimir el ticket.");
        }
        console.log("Ticket impreso correctamente:", stdout);
        res.status(200).send("Ticket impreso correctamente.");
    });
});

module.exports = router;
