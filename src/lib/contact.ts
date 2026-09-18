export const WHATSAPP_NUMBER = "525667701206";

export const whatsappUrl = (source: string, lang: "es" | "en" = "es") => {
  const message = lang === "en"
    ? `Hi, I came from the ${source} page on the Oasis website. I am working on ______ and my main growth problem right now is ______. I want to understand what you would do in my place.`
    : `Hola, vengo de la página ${source} del sitio de Oasis. Estoy trabajando en ______ y actualmente mi principal problema de crecimiento es ______. Quiero saber qué harías tú en mi lugar.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
