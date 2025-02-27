export async function sendBestellungEmail(email: string, bestellung: any) {
  try {
    const response = await fetch('/api/email/send-bestellung', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, bestellung }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Senden der Email');
    }

    return response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Fehler beim Senden der E-Mail');
  }
}

export async function sendServiceEmail(email: string, hardware: any) {
  try {
    const response = await fetch('/api/email/send-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, hardware }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Senden der Email');
    }

    return response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Fehler beim Senden der E-Mail');
  }
}

export async function sendWechselEmail(email: string, hardware: any) {
  try {
    const response = await fetch('/api/email/send-wechsel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, hardware }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Senden der Email');
    }

    return response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Fehler beim Senden der E-Mail');
  }
}

export async function sendBestellungVersendetEmail(bestellung: {
  id: string;
  standort: {
    name: string;
    verantwortlicher?: {
      email: string;
      full_name: string;
    }
  };
  artikel: Array<{
    artikel: {
      name: string;
      artikelnummer: string;
    };
    menge: number;
    versandte_menge: number;
  }>;
}) {
  try {
    const response = await fetch('/api/email/send-versand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bestellung }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Senden der Email');
    }

    return response.json();
  } catch (error) {
    console.error('Fehler beim Senden der Email:', error);
    throw error;
  }
} 