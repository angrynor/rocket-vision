export default function Footer() {
  return (
    <footer className="mt-16 mb-10 text-center text-sm text-muted">
      <p>
        Built by Gavin Sim in 4 hours with Claude Code. The second engine.{" "}
        <a
          href="https://oma.example.com/preview"
          className="text-accent hover:underline"
          data-testid="footer-link"
        >
          Learn how →
        </a>
      </p>
    </footer>
  );
}
