import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

export const metadata = {
  title: 'Privacy Policy — PlanWedly',
  description: 'How PlanWedly collects, uses, shares, and protects account, wedding-planning and vendor information, including Google sign-in data.',
  alternates: { canonical: '/privacy' },
}

const updated = 'November 21, 2026'
const contact = <a href="mailto:kapi91@gmail.com">kapi91@gmail.com</a>

export default function PrivacyPolicyPage() {
  const sections = [
    {id:'who-we-are',title:'Who we are',body:<>
      <p><strong>PlanWedly</strong> is an Ontario-based wedding-planning and vendor-discovery service, initially serving the Greater Toronto Area. This policy applies to <strong>www.planwedly.com</strong>, its registered couple and vendor accounts, and the associated PlanWedly services.</p>
      <p>For privacy questions, requests to access or correct information, or complaints, contact PlanWedly at {contact}. Please do not send identity documents or sensitive information in your first email.</p>
    </>},
    {id:'information-collected',title:'Information we collect',body:<>
      <p>Depending on the features you use, PlanWedly may collect or process:</p>
      <ul>
        <li><strong>Account and sign-in details:</strong> name, email, account type, authentication identifiers, and optional profile or contact information. Password authentication is handled through our authentication provider; we do not need your Google password.</li>
        <li><strong>Wedding plans:</strong> planning preferences, dates, event details, budget entries, guest-list information, tasks and other details you choose to save.</li>
        <li><strong>Vendor listing information:</strong> business name, service area, contact information, descriptions, images, social links, service packages, availability dates and subscription information.</li>
        <li><strong>Inquiries:</strong> messages sent to a particular vendor, wedding dates, guest counts and optional service budget information you decide to share.</li>
        <li><strong>Reviews and moderation:</strong> ratings, written reviews, dates of service, optional supporting documents, business responses, reports and moderation outcomes.</li>
        <li><strong>Usage and technical information:</strong> interactions with pages, vendor profile views and outbound clicks, basic browser/device information, and information collected through cookies or comparable technologies where enabled.</li>
        <li><strong>Billing information:</strong> subscription status, identifiers and invoices or other transaction records made available to us by our payment processor. Payment-card details are handled by the processor, not entered into PlanWedly&apos;s own forms.</li>
      </ul>
    </>},
    {id:'google-sign-in',title:'Google sign-in and Google user data',body:<>
      <p>If you choose <strong>Continue with Google</strong>, Google authenticates you and may provide PlanWedly, through our authentication provider, with your Google account identifier, email address, name, profile image and email-verification status, depending on the permissions you grant and Google&apos;s response.</p>
      <p>We use this information to create or connect your PlanWedly account, sign you in, identify your account and personalize basic profile details. <strong>PlanWedly does not need access to your Gmail messages, Google Drive files, contacts or calendar events for Google sign-in.</strong> Connecting a calendar in a future feature would require a separate permission flow and updated disclosure.</p>
      <p>We do not sell Google sign-in profile data or use it for advertising targeting. We share the necessary authentication information with our authentication and hosting service providers to operate sign-in, not with wedding vendors merely because you used Google to log in. We do not use Google user data to train generalized AI models.</p>
      <p>You can manage a Google account&apos;s third-party connections in your Google settings and can request deletion of your PlanWedly account separately. Removing Google access alone does not automatically erase PlanWedly&apos;s account records.</p>
    </>},
    {id:'how-used',title:'How we use information',body:<>
      <ul>
        <li>To authenticate accounts, operate and secure PlanWedly, and provide wedding-planning features.</li>
        <li>To publish vendor directory listings and make them discoverable to couples.</li>
        <li>To deliver the inquiries you choose to send to the vendors you select.</li>
        <li>To process genuine-customer reviews, evaluate submitted evidence and moderate disputes.</li>
        <li>To administer vendor ownership claims, subscriptions and access to Premium tools.</li>
        <li>To measure site usage and improve performance, reliability and user experience.</li>
        <li>To respond to support, security, legal or privacy requests and prevent abuse.</li>
      </ul>
      <p>Where consent is required, we seek it in context and provide available choices. We do not use your private wedding budgets or private review evidence as public directory information.</p>
    </>},
    {id:'sharing',title:'Who can see information and who receives it',body:<>
      <ul>
        <li><strong>Public visitors</strong> can see published business listings, vendor-provided public content and reviews approved for publication. A verified badge confirms the specified verification process, not the quality of a service.</li>
        <li><strong>Vendors you contact</strong> receive the name/contact details and wedding, budget and message information you deliberately submit in an inquiry. Vendors must use that information appropriately for responding to your request.</li>
        <li><strong>PlanWedly moderators</strong> may access reports, supporting review evidence and other information needed to investigate a dispute or claim. Supporting review evidence is kept in restricted storage rather than being shown with a public review.</li>
        <li><strong>Service providers</strong> assist with authentication and data hosting (Supabase), website delivery (Vercel), analytics (including PostHog), Google sign-in (Google) and payment processing (Stripe). An email delivery provider may also process your address when transactional email is configured.</li>
        <li><strong>Legal or safety purposes:</strong> information may be disclosed when required by law, to protect rights or safety, or to investigate misuse, subject to applicable legal requirements.</li>
      </ul>
      <p>We do not sell couples&apos; personal information or private Google sign-in data to vendors or advertisers. Business listings may include publicly provided professional contact details.</p>
    </>},
    {id:'cookies-analytics',title:'Cookies and analytics',body:<>
      <p>PlanWedly uses necessary session and authentication storage to keep accounts signed in. It also offers controls for analytics technologies, including PostHog, where those controls are presented. Some vendor-engagement metrics count an approximate browser-tab session once per vendor, day and interaction; these are not a guarantee of unique visitors.</p>
      <p>Analytics providers may process device, browsing and interaction information according to their service configurations. Logged-in activity may be associated with a PlanWedly account identifier in our analytics tools. You can use the site controls available to you and browser settings to limit optional tracking, recognizing that necessary authentication storage may still be required.</p>
    </>},
    {id:'storage-protection',title:'Storage, security and international processing',body:<>
      <p>We use access controls and reasonable technical and organizational safeguards intended to protect personal information. Review evidence and private vendor lead notes have restricted access, and public-facing features are separated from private account records. No internet service can promise absolute security.</p>
      <p>Some service providers may process or store information outside Ontario or Canada. Applicable laws in those locations may differ, including lawful government access. We use providers to operate PlanWedly and limit access to the purposes described here.</p>
    </>},
    {id:'retention',title:'Retention and account deletion',body:<>
      <p>We retain information for as long as reasonably needed to provide PlanWedly, handle legitimate reviews or disputes, fulfill applicable legal obligations and maintain necessary security or transaction records. Retention periods differ by record type; we do not promise that every backup or legal record disappears immediately.</p>
      <p>Signed-in non-administrator users can request self-service account deletion through <Link href="/account/settings">Account settings</Link>. This removes the account and associated personal planning content through the deletion process. A public vendor directory entry may remain as an unclaimed listing, and reviews submitted independently by other customers may continue to be shown subject to moderation. If self-service deletion is unavailable, contact us at {contact}.</p>
    </>},
    {id:'choices-rights',title:'Your choices and privacy rights',body:<>
      <p>Subject to applicable law and identity verification, you may ask to access or correct personal information held by PlanWedly, withdraw consent where available, request account deletion, or raise a privacy concern. We may need to keep certain information where legally required or necessary to resolve a legitimate dispute.</p>
      <p>Send requests to {contact}. If you are dissatisfied with our response, you may be able to contact the <a href="https://www.priv.gc.ca/en/" target="_blank" rel="noopener noreferrer">Office of the Privacy Commissioner of Canada</a>.</p>
    </>},
    {id:'children',title:'Children and information about guests',body:<>
      <p>PlanWedly accounts are intended for adults. The service is not designed for children to create accounts. Wedding planners may enter guest information, including information about family members; please enter only information needed for planning and avoid uploading sensitive personal details about others without an appropriate basis.</p>
    </>},
    {id:'changes-contact',title:'Changes and contact',body:<>
      <p>We may update this policy as the service evolves. The revision date at the top identifies the version currently published. Material changes may be communicated through the site or by email where appropriate.</p>
      <p><strong>Privacy contact:</strong> {contact}. <strong>Website:</strong> <a href="https://www.planwedly.com">www.planwedly.com</a>.</p>
      <p>For use of PlanWedly, also read our <Link href="/terms">Terms of Service</Link>.</p>
    </>},
  ]
  return <LegalPage title="Privacy Policy" description="How we handle your personal information when you plan a wedding, discover vendors or manage a business on PlanWedly." updated={updated} sections={sections} />
}
