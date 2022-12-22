export async function all() {
    return new Response(JSON.stringify({
        status: 404,
        message: "Oye cunt, this page doesn't exist"
    }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }