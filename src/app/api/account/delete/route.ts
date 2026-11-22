import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// This endpoint only deletes the current authenticated user, never an
// arbitrary user ID supplied by the browser.
export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })

  let input: { email?: string; confirmation?: string }
  try { input = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (input.confirmation !== 'DELETE MY ACCOUNT') {
    return NextResponse.json({ error: 'Type DELETE MY ACCOUNT to confirm.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !user.email) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  if (typeof input.email !== 'string' || input.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Enter your account email address exactly.' }, { status: 400 })
  }

  const admin = billingAdmin()
  try {
    // Guard against deleting PlanWedly's owner, business admins or other staff.
    const { data: staff, error: staffError } = await admin.from('admin_access')
      .select('user_id').eq('user_id', user.id).maybeSingle()
    if (staffError) throw staffError
    if (staff) return NextResponse.json({
      error: 'Admin and owner accounts cannot be deleted here. Transfer staff access first.'
    }, { status: 403 })

    const { data: vendors, error: vendorError } = await admin.from('vendors')
      .select('id,slug,name').eq('claimed_by',user.id)
    if (vendorError) throw vendorError
    const ids=(vendors??[]).map(v=>v.id)

    // Stop new checkout sessions for the account while it is being deleted.
    const { error: holdError } = await admin.from('vendor_checkout_reservations')
      .delete().eq('owner_id',user.id)
    if (holdError) throw holdError

    // Billing must be canceled in Stripe *before* deleting the account;
    // otherwise customers could be charged after losing their login.
    const { data: subscriptions, error: subscriptionError } = await admin.from('vendor_subscriptions')
      .select('vendor_id,stripe_customer_id,stripe_subscription_id').eq('owner_id',user.id)
    if (subscriptionError) throw subscriptionError
    if ((subscriptions??[]).length) {
      const secret=process.env.STRIPE_SECRET_KEY
      if (!secret?.startsWith('sk_test_')) {
        return NextResponse.json({ error:'Please contact support to cancel billing before deleting your account.' }, { status:409 })
      }
      // Query all subscriptions per customer to avoid missing duplicate
      // subscriptions (the webhooks may not have recorded every test checkout).
      const customerIds=[...new Set((subscriptions??[]).map(s=>s.stripe_customer_id).filter(Boolean))]
      for (const customerId of customerIds) {
        let startingAfter: string|undefined
        for (let page=0;page<10;page++) {
          const query=new URLSearchParams({customer:customerId,status:'all',limit:'100'})
          if(startingAfter) query.set('starting_after',startingAfter)
          const response=await fetch('https://api.stripe.com/v1/subscriptions?'+query,{
            headers:{Authorization:'Bearer '+secret},cache:'no-store'
          })
          if(!response.ok) throw new Error('Stripe subscription lookup failed')
          const data=await response.json() as {data:{id:string;status:string}[];has_more:boolean}
          for(const subscription of data.data) {
            if (['canceled','incomplete_expired'].includes(subscription.status)) continue
            if (subscription.status === 'incomplete') {
              // Stripe may still create a completed invoice from open sessions;
              // don't silently delete the user while this exists.
              return NextResponse.json({error:'An unfinished checkout exists. Please retry once it expires.'},{status:409})
            }
            const cancelled=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(subscription.id),{
              method:'DELETE',headers:{Authorization:'Bearer '+secret},cache:'no-store'
            })
            if(!cancelled.ok) throw new Error('Stripe subscription cancellation failed')
          }
          if(!data.has_more) break
          if(page===9 || !data.data.length) throw new Error('Stripe subscription listing was incomplete')
          startingAfter=data.data[data.data.length-1].id
        }
      }
    }

    // Remove uploaded evidence from reviews authored by this person.
    const { data: reviews, error: reviewError } = await admin.from('reviews')
      .select('id,evidence_path').eq('couple_id',user.id).limit(1000)
    if(reviewError) throw reviewError
    if((reviews??[]).length===1000) return NextResponse.json({
      error:'Your account has too many reviews for automated cleanup. Please contact support.'
    },{status:409})
    const evidencePaths=(reviews??[]).map(r=>r.evidence_path).filter((path):path is string=>!!path)
    if(evidencePaths.length) {
      const {error}=await admin.storage.from('review-evidence').remove(evidencePaths)
      if(error) throw error
    }

    // Preserve the directory entries, but strip owner-uploaded photos and
    // owner-only business content before returning listings to unclaimed state.
    if(ids.length) {
      const {data:photos,error:photoError}=await admin.from('vendor_photos')
        .select('storage_path').in('vendor_id',ids).limit(1000)
      if(photoError) throw photoError
      if((photos??[]).length===1000) return NextResponse.json({
        error:'Your business has too many photos for automatic cleanup. Contact support.'
      },{status:409})
      const photoPaths=(photos??[]).map(p=>p.storage_path)
      if(photoPaths.length) {
        const {error}=await admin.storage.from('vendor-photos').remove(photoPaths)
        if(error) throw error
      }
    }

    // Cleanup of user references is atomic, preventing partially-unclaimed
    // businesses or records that would block deleting the auth identity.
    const { data:cleaned, error:cleanupError }=await admin.rpc('prepare_account_deletion', {p_user_id:user.id})
    if(cleanupError || cleaned!==true) throw cleanupError??new Error('Account cleanup failed')

    // Supabase officially recommends the Auth admin API rather than directly
    // deleting auth.users with SQL. Deletion cascades profiles, wedding data,
    // reviews written by the user, saved vendors and inquiries.
    const {error:deleteError}=await admin.auth.admin.deleteUser(user.id)
    if(deleteError) throw deleteError

    return NextResponse.json({ok:true})
  } catch(error) {
    console.error('Self-service account deletion failed:',error instanceof Error?error.message:'unknown')
    return NextResponse.json({
      error:'We could not complete deletion. Your account may still be active; please retry or contact support.'
    },{status:500})
  }
}
