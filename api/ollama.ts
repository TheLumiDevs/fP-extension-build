import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import ollama from 'ollama';

export const generateResponse = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt must be a string' });
      return;
    }
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const response = await ollama.generate({
      model: 'llama2',
      prompt: prompt,
      stream: false
    });

    res.status(200).json({
      response: response.response,
      model: response.model,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    functions.logger.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});