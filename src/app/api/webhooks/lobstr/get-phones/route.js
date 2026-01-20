export async function POST(req) {
  const {id: runId} = await req.json()

  try {
    collectAdsFromL
  } catch(error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message, status: 500 }),
    );    
  }
}