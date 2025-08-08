import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

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

    if (filePaths) {
      const form = new FormData();
      form.append('payload_json', jsonPayload);
      
      const paths = filePaths.split(',').map(p => p.trim());
      let fileAttached = false;
      for (const filePath of paths) {
        if (fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          form.append('file', fs.createReadStream(filePath), fileName);
          fileAttached = true;
        } else {
          console.warn(`File not found at path: ${filePath}.`);
        }
      }

      if (fileAttached) {
        await axios.post(webhookUrl, form, {
          headers: form.getHeaders(),
        });
      } else {
        // If paths were provided but no files were found, send without attachments
        await axios.post(webhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook sent successfully.');
  } catch (error: any) {
    console.error('Error sending webhook:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

sendWebhook();