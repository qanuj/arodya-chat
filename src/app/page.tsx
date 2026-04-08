export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Arodya Chat Bot</h1>
      <p>
        Webhook endpoint: <code>/api/chat-webhook</code>
      </p>
      <p>
        Point your Zernio dashboard webhook URL here and configure{" "}
        <code>message.received</code> + <code>comment.received</code> events.
      </p>
    </main>
  );
}
