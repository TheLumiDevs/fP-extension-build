import axios from 'axios';
import FormData from 'form-data';

type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

type Component = {
  type: number;
  components: Array<{
    type: number;
    label: string;
    style: number;
    url: string;
  }>;
};

export async function sendWebhookMessage(
  webhookUrl: string,
  content: string,
  options?: {
    embeds?: Embed[];
    components?: Component[];
    files?: Array<{ name: string; data: Buffer }>;
  }
) {
  const formData = new FormData();
  
  if (options?.files?.length) {
    options.files.forEach((file, index) => {
      formData.append(`files[${index}]`, file.data, file.name);
    });
  }

  const payload = {
    content,
    embeds: options?.embeds,
    components: options?.components
  };

  formData.append('payload_json', JSON.stringify(payload));

  return axios.post(webhookUrl, formData, {
    headers: {
      ...formData.getHeaders(),
      'Content-Length': formData.getLengthSync()
    }
  });
}

export function createLinkButton(label: string, url: string) {
  return {
    type: 1,
    components: [{
      type: 2,
      label,
      style: 5,
      url
    }]
  } as Component;
}