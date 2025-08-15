import fs from 'fs';
import path from 'path';
import { sendWebhookMessage } from '../api/discord-webhook';

async function sendWebhook() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const jsonPayload = process.env.DISCORD_PAYLOAD;
  const filePaths = process.env.DISCORD_FILE_PATHS;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set.');
    process.exit(1);
  }

  if (!jsonPayload) {
    console.error('DISCORD_PAYLOAD is not set.');
    process.exit(1);
  }

  try {
    const payload = JSON.parse(jsonPayload);
    const files: { name: string; data: Buffer }[] = [];

    if (filePaths) {
      const paths = filePaths.split(',').map(p => p.trim());
      for (const filePath of paths) {
        if (fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          const fileData = fs.readFileSync(filePath);
          files.push({ name: fileName, data: fileData });
        } else {
          console.warn(`File not found at path: ${filePath}.`);
        }
      }
    }

    const { content, ...options } = payload;
    await sendWebhookMessage(webhookUrl, content, {
      ...options,
      files: files.length > 0 ? files : undefined
    });

    console.log('Webhook sent successfully.');
  } catch (error: any) {
    console.error('Error sending webhook:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

sendWebhook();