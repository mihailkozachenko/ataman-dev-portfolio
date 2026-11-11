export type Project = {
  /** Shown big inside the cloud. Keep it short — 1–3 words. */
  name: string;
  /** One line. Long text still fits, but the cloud grows taller. */
  description: string;
  url: string;
};

export const projects: Project[] = [
  {
    name: "DokliCZ",
    description: "AI decoder for Czech official letters, in Russian and Ukrainian.",
    url: "https://dokli-cz.com",
  },
  {
    name: "AI Chat Widget",
    description: "Embeddable AI assistant for small businesses, in the visitor's language.",
    url: "https://chat-bot-demo-nu.vercel.app",
  },
];
