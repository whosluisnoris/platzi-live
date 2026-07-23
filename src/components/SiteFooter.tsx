// Pie de página con crédito, compartido por el catálogo y la landing.
export function SiteFooter() {
  return (
    <footer className="mx-auto mb-2 w-full max-w-[1500px] px-4 pb-4 pt-8 text-center text-xs text-gray-600 sm:px-4">
      Hecho con cariño para quienes aprenden IA y datos en español 💚. Por{" "}
      <a
        href="https://www.linkedin.com/in/luisnorisgarcia/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-colors hover:text-[#0aeb8b]"
      >
        Luis Noris
      </a>
    </footer>
  );
}
