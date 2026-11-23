# PlanWedly authentication branding — deployment steps

The **website** confirmation landing page is deployed from this repository.

**Hosted Supabase authentication emails are NOT automatically deployed by merging
these files.** PlanWedly currently uses hosted Supabase Auth
(project `frhtluslmjovvezpgopx`). That platform stores its email templates
and sender separately from the Next.js website.

## Official logo in email templates

All five templates now reference the official PlanWedly floral W image at:
https://www.planwedly.com/brand/planwedly-logo.png

The hosted image must remain publicly accessible. If an email client blocks
remote images, the text wordmark and message still display. Do not attach
the image as an email attachment or paste the image file into the HTML editor.

**Important:** Committing website files and this repository's email HTML does
**not** change the live Supabase Auth templates. Open the hosted Supabase
dashboard and paste each updated HTML file into the corresponding template,
then save. The app-side SMTP configuration is separate and should already be
set for the verified PlanWedly sender.

## Apply the templates

1. Open https://supabase.com/dashboard/project/frhtluslmjovvezpgopx/auth/templates
   (or Authentication → Email → Templates).
2. In **Confirm signup**, set the subject to:
   `Confirm your email | PlanWedly`.
3. Paste the **full HTML** of
   `supabase/email-templates/confirmation.html` and save.
4. Repeat as desired for the other hosted templates:

   | Supabase template | Subject | Repository file |
   | --- | --- | --- |
   | Confirm signup | Confirm your email \| PlanWedly | confirmation.html |
   | Reset password | Reset your PlanWedly password | recovery.html |
   | Magic Link | Your PlanWedly sign-in link | magic_link.html |
   | Invite user | You're invited to PlanWedly | invite.html |
   | Change Email Address | Confirm your new PlanWedly email | email_change.html |

5. Test with a **new** email address. Check the From name, inbox delivery,
   verification button, and redirect (vendor and couple accounts).
6. Configure custom SMTP under Supabase Authentication → Email → SMTP, to
   send from a verified `@planwedly.com` address and control the From name.
   Never deploy SMTP passwords or API keys in this repository.
   The shared Supabase sending service will not automatically use a branded
   domain even after you change the email HTML.

Do not replace `{{ .ConfirmationURL }}` with a guessed application URL:
Supabase generates its verification link securely.

## Google login's random project identifier

Google sign-in currently redirects through a hosted Supabase Auth endpoint
whose project reference is a random ID. Changing the Next.js Google button
cannot rename what Google displays in the authorization screen.

Open https://console.cloud.google.com/auth/branding in the **Google Cloud
project used for PlanWedly OAuth** and set:
- App name: **PlanWedly**
- Homepage: `https://www.planwedly.com`
- Support email: a real monitored address
- Brand logo: recognizable PlanWedly logo
- Authorized domain: `planwedly.com`
- Privacy policy and terms URLs: **real, publicly accessible documents**
  describing Google sign-in (do not invent routes that do not exist).

Then complete branding verification and **Publish branding**. Until verified,
Google may display the Supabase project domain instead of PlanWedly.

If Google still identifies `frhtluslmjovvezpgopx.supabase.co` as the
authorization target, review Supabase's custom-domain feature and consider
`auth.planwedly.com`. Do **not** switch an Auth domain or OAuth redirect
URIs without carefully updating Google provider callbacks and Supabase
redirect configuration and checking both couple/vendor sign-in.

Supabase documentation:
https://supabase.com/docs/guides/auth/auth-email-templates
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/auth/social-sign-in/auth-google

Google branding:
https://console.cloud.google.com/auth/branding
https://support.google.com/cloud/answer/15549049?hl=en
