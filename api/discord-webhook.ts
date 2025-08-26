import axios from 'axios';
import FormData from 'form-data';

type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  author?: {
    name?: string;
    url?: string;
    icon_url?: string;
  };
  image?: {
    url?: string;
  };
  thumbnail?: {
    url?: string;
  };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
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
    username?: string;
    avatar_url?: string;
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
    ...(options?.username && { username: options.username }),
    ...(options?.avatar_url && { avatar_url: options.avatar_url }),
    content,
    ...(options?.embeds && { embeds: options.embeds }),
    ...(options?.components && { components: options.components })
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