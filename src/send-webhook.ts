/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { sendWebhookMessage } from '../api/discord-webhook';
import type { Embed } from '../api/discord-webhook';
import { Buffer } from 'buffer';

async function sendWebhook() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const filePaths = process.env.DISCORD_FILE_PATHS;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set.');
    process.exit(1);
  }

  try {
    // Construct payload from individual environment variables
    const parsedOptions = process.env.DISCORD_OPTIONS ? JSON.parse(process.env.DISCORD_OPTIONS) : {};
    // Ensure embeds are always an array and validate structure
    if (parsedOptions.embeds) {
      parsedOptions.embeds = Array.isArray(parsedOptions.embeds)
        ? parsedOptions.embeds
        : [parsedOptions.embeds];
      // Validate required embed fields
      parsedOptions.embeds = parsedOptions.embeds.map((embed: Embed) => ({
        title: embed.title || 'Default Title',
        description: embed.description || 'Default Description',
        color: embed.color || 0x7289DA, // Discord blurple default
        ...embed as unknown as Embed
      }));
    }
    const payload = {
      content: process.env.DISCORD_MESSAGE || '',
      ...parsedOptions
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