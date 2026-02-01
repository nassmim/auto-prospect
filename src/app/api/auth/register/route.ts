import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env var(s):", { hasUrl: !!supabaseUrl, hasServiceRoleKey: !!serviceRoleKey })

      return NextResponse.json({ error: 
        'Server misconfiguration: ' +
      (supabaseUrl ?? 'null') +
      ' or ' +
      (serviceRoleKey ?? 'null') +
      ' is not set',
      
    }
    , 
    { status: 500 })
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey // server-only service role
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) {
      console.error("admin.createUser error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
