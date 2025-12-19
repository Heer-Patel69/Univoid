import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OTP Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 3

function generateOTP(): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token for auth check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user auth to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Service role client for OTP table operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('User auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, otp } = await req.json()
    console.log(`Phone verification action: ${action} for user: ${user.id}`)

    if (action === 'send') {
      // Check if user has a mobile number
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('mobile_number, phone_verified')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError)
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!profile.mobile_number) {
        return new Response(
          JSON.stringify({ error: 'No mobile number on profile' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (profile.phone_verified) {
        return new Response(
          JSON.stringify({ error: 'Phone already verified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate new OTP
      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

      // Upsert OTP (replace any existing)
      const { error: upsertError } = await supabaseAdmin
        .from('phone_otp_codes')
        .upsert({
          user_id: user.id,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
          attempts: 0,
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        console.error('OTP upsert error:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // TODO: Integrate with SMS provider (Twilio, MSG91, etc.)
      // For now, log the OTP (in production, send via SMS)
      console.log(`OTP for ${profile.mobile_number}: ${otpCode} (expires: ${expiresAt.toISOString()})`)

      // In production, you would call an SMS API here:
      // await sendSMS(profile.mobile_number, `Your verification code is: ${otpCode}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'verify') {
      if (!otp || typeof otp !== 'string') {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get stored OTP
      const { data: storedOtp, error: fetchError } = await supabaseAdmin
        .from('phone_otp_codes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError || !storedOtp) {
        console.error('OTP fetch error:', fetchError)
        return new Response(
          JSON.stringify({ error: 'No OTP found. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if expired
      if (new Date(storedOtp.expires_at) < new Date()) {
        await supabaseAdmin
          .from('phone_otp_codes')
          .delete()
          .eq('user_id', user.id)
        
        return new Response(
          JSON.stringify({ error: 'OTP expired. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check max attempts
      if (storedOtp.attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin
          .from('phone_otp_codes')
          .delete()
          .eq('user_id', user.id)
        
        return new Response(
          JSON.stringify({ error: 'Too many attempts. Please request a new OTP.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Increment attempts
      await supabaseAdmin
        .from('phone_otp_codes')
        .update({ attempts: storedOtp.attempts + 1 })
        .eq('user_id', user.id)

      // Verify OTP
      if (storedOtp.otp_code !== otp) {
        const remainingAttempts = MAX_ATTEMPTS - storedOtp.attempts - 1
        return new Response(
          JSON.stringify({ 
            error: 'Invalid OTP', 
            remainingAttempts 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // OTP is valid - update profile and clean up
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ phone_verified: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify phone' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete used OTP
      await supabaseAdmin
        .from('phone_otp_codes')
        .delete()
        .eq('user_id', user.id)

      console.log(`Phone verified successfully for user: ${user.id}`)

      return new Response(
        JSON.stringify({ success: true, message: 'Phone verified successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Phone verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})