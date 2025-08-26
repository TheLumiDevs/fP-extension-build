import fs from 'fs';
import path from 'path';
import { sendWebhookMessage } from '../api/discord-webhook';

async function sendWebhook() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const filePaths = process.env.DISCORD_FILE_PATHS;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set.');
    process.exit(1);
  }

  try {
    // Construct payload from individual environment variables
    const payload = {
      content: process.env.DISCORD_MESSAGE || '',
      ...(process.env.DISCORD_OPTIONS ? JSON.parse(process.env.DISCORD_OPTIONS) : {})
    };
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
    const formattedContent = typeof content === 'number' ? content.toString() : content;
    await sendWebhookMessage(webhookUrl, formattedContent, {
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