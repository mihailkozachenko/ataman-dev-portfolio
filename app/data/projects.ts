export type Project = {
  /** Shown big inside the cloud. Keep it short — 1–3 words. */
  name: string;
  /** One line. Long text still fits, but the cloud grows taller. */
  description: string;
  url: string;
};

// Order = position along the smoke plume, from the nozzle upwards.
export const projects: Project[] = [
  {
    name: "UKOL",
    description: "AI quotes for Czech tradesmen — photo + voice → ready nabídka.",
    url: "https://ukol.app",
  },
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
