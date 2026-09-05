import tls from 'tls';

function readEnv(name: string) {
  return process.env[name] || '';
}

function encodeBase64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64');
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const host = readEnv('SMTP_HOST');
  const port = Number(readEnv('SMTP_PORT') || 465);
  const user = readEnv('SMTP_USER');
  const password = readEnv('SMTP_PASSWORD');
  const from = readEnv('SMTP_FROM') || user;

  if (!host || !user || !password || !from) {
    throw new Error('Password reset email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
  }

  const subject = 'Reset Your Jersey Mention BD Password';
  const text = `Hello ${name},\n\nWe received a request to reset your Jersey Mention BD account password.\n\nReset your password here: ${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nJersey Mention BD`;
  const command = (socket: tls.TLSSocket, value: string) => new Promise<void>((resolve, reject) => {
    socket.write(`${value}\r\n`);
    const onData = (data: Buffer) => {
      const response = data.toString();
      if (/^[245]/.test(response)) {
        socket.off('data', onData);
        response.startsWith('2') ? resolve() : reject(new Error(`SMTP error: ${response.trim()}`));
      }
    };
    socket.on('data', onData);
  });

  await new Promise<void>((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host }, async () => {
      try {
        await command(socket, `EHLO jerseymentionbd.com`);
        await command(socket, `AUTH LOGIN`);
        await command(socket, encodeBase64(user));
        await command(socket, encodeBase64(password));
        await command(socket, `MAIL FROM:<${from}>`);
        await command(socket, `RCPT TO:<${to}>`);
        await command(socket, 'DATA');
        const body = [
          `From: ${from}`,
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          text,
          '.'
        ].join('\r\n');
        await command(socket, body);
        await command(socket, 'QUIT');
        socket.end();
        resolve();
      } catch (error) {
        socket.destroy();
        reject(error);
      }
    });
    socket.once('error', reject);
  });
}