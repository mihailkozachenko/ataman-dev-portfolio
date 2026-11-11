export type Service = {
  /** Stable, URL-safe id — used for element ids. */
  id: string;
  /** Short label shown inside the bubble. */
  title: string;
  /** Revealed after the bubble pops. 1–2 sentences. */
  description: string;
};

export const services: Service[] = [
  {
    id: "websites",
    title: "Websites",
    description:
      "Landing pages, business sites and online stores. Fast, responsive, ready for search engines.",
  },
  {
    id: "automation",
    title: "Automation",
    description:
      "Telegram bots, integrations and scripts that take the routine work off your plate.",
  },
  {
    id: "ai-chatbots",
    title: "AI chatbots",
    description:
      "An assistant trained on your business that answers customers 24/7, in their language.",
  },
  {
    id: "accessibility-audit",
    title: "Accessibility audit",
    description:
      "A WCAG 2.2 / EAA audit with a clear list of fixes. I can make the fixes too.",
  },
];
