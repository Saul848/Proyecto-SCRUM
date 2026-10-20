const nodemailer = require('nodemailer');

// Configuración limpia y directa sugerida por la comunidad
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function enviarInvitacionProyecto({ correoDestino, nombreProyecto, rol, idProyecto, idUsuario }) {
    const urlAceptar = `https://localhost:8443/proyectos/invitacion/responder?accion=aceptar&idProyecto=${idProyecto}&idUsuario=${idUsuario}&rol=${encodeURIComponent(rol)}`;
    const urlRechazar = `https://localhost:8443/proyectos/invitacion/responder?accion=rechazar&idProyecto=${idProyecto}&idUsuario=${idUsuario}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;">
            <h2 style="color: #007bff;">¡Has sido invitado a un proyecto en ScrumBird!</h2>
            <p>Se te ha seleccionado para colaborar en el proyecto <strong>"${nombreProyecto}"</strong> con el rol de <strong>${rol}</strong>.</p>
            <p>Por favor, confirma tu participación dando clic en una de las siguientes opciones:</p>
            
            <div style="margin-top: 25px; text-align: center;">
                <a href="${urlAceptar}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; font-weight: bold;">Aceptar Invitación</a>
                <a href="${urlRechazar}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rechazar</a>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"ScrumBird Bot" <${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: `Invitación al proyecto "${nombreProyecto}"`,
        html: htmlContent
    };

    return await transporter.sendMail(mailOptions);
}

module.exports = { enviarInvitacionProyecto };