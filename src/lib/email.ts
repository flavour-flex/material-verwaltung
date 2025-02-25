import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBestellungEmail(email: string, bestellung: any) {
  try {
    console.log('Sending email to:', email); // Debug-Log

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY ist nicht konfiguriert');
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM ist nicht konfiguriert');
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Neue Bestellung von ${bestellung.standort?.name || 'Unbekannter Standort'}`,
      html: `
        <h1>Neue Bestellung eingegangen</h1>
        <p>Standort: ${bestellung.standort?.name || 'Unbekannter Standort'}</p>
        <h2>Bestellte Artikel:</h2>
        <ul>
          ${bestellung.artikel.map((pos: any) => `
            <li>${pos.artikel?.name || 'Unbekannter Artikel'} - ${pos.menge} Stück</li>
          `).join('')}
        </ul>
      `,
    });

    console.log('Email sent:', data); // Debug-Log

    if (error) {
      console.error('Email error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Fehler beim Senden der E-Mail');
  }
}

export async function sendServiceEmail(email: string, hardware: any) {
  await resend.emails.send({
    from: 'noreply@ihredomain.de',
    to: email,
    subject: `Service fällig: ${hardware.artikel.name}`,
    html: `
      <h1>Service-Intervall erreicht</h1>
      <p>Für folgende Hardware ist ein Service fällig:</p>
      <ul>
        <li>
          <strong>Artikel:</strong> ${hardware.artikel.name} (${hardware.artikel.artikelnummer})<br>
          <strong>Standort:</strong> ${hardware.standort.name}<br>
          <strong>Service-Intervall:</strong> ${hardware.serviceintervall_monate} Monate<br>
          <strong>Verantwortlicher:</strong> ${hardware.verantwortlicher.name}
        </li>
      </ul>
    `,
  });
}

export async function sendWechselEmail(email: string, hardware: any) {
  await resend.emails.send({
    from: 'noreply@ihredomain.de',
    to: email,
    subject: `Hardware-Wechsel fällig: ${hardware.artikel.name}`,
    html: `
      <h1>Hardware-Wechsel steht an</h1>
      <p>Für folgende Hardware steht ein Wechsel an:</p>
      <ul>
        <li>
          <strong>Artikel:</strong> ${hardware.artikel.name} (${hardware.artikel.artikelnummer})<br>
          <strong>Standort:</strong> ${hardware.standort.name}<br>
          <strong>Wechsel-Intervall:</strong> ${hardware.wechselintervall_jahre} Jahre<br>
          <strong>Installation:</strong> ${new Date(hardware.created_at).toLocaleDateString()}<br>
          <strong>Verantwortlicher:</strong> ${hardware.verantwortlicher.name}
        </li>
      </ul>
    `,
  });
} 