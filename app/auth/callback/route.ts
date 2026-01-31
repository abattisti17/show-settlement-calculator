import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Route handler for authentication callbacks (magic links, OAuth, etc.)
 * Exchanges the auth code for a session and redirects to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:12',message:'Callback invoked',data:{fullUrl:request.url,code:code,origin:origin,hasCode:!!code,allParams:Object.fromEntries(searchParams.entries())},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (code) {
    const supabase = await createClient()
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:21',message:'Before exchangeCodeForSession',data:{code:code.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:27',message:'After exchangeCodeForSession',data:{hasError:!!error,errorMessage:error?.message,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!error) {
      // #region agent log
      const session = await supabase.auth.getSession();
      fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:34',message:'Session after successful exchange',data:{hasSession:!!session.data.session,userId:session.data.session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:43',message:'Preparing redirect',data:{isLocalEnv:isLocalEnv,forwardedHost:forwardedHost,origin:origin,next:next},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8c045917-98d3-43c9-b40f-a64d68a70a38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:58',message:'Redirecting to login - error or no code',data:{hadCode:!!code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
