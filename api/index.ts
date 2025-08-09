import { sendWebhookMessage } from './discord-webhook';

export default async (req: any, res: any) => {
  const { webhookUrl, content, ...options } = req.body;

  if (!webhookUrl) {
    return res.status(400).send('Missing webhookUrl in request body');
  }

  try {
    await sendWebhookMessage(webhookUrl, content, options);
    res.status(200).send('Webhook sent successfully');
  } catch (error: any) {
    console.error('Error sending webhook:', error.response ? error.response.data : error.message);
    res.status(500).send('Error sending webhook');
  }
};