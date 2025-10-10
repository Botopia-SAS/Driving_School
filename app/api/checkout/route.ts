// Stripe integration removed. Endpoint disabled.
export async function POST() {
  return new Response(
    JSON.stringify({ error: "Stripe integration removed." }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}
