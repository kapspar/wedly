import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

export const metadata = {
  title: 'Terms of Service — PlanWedly',
  description: 'Terms for using PlanWedly wedding planning, vendor directory, reviews and vendor subscription features.',
  alternates: { canonical: '/terms' },
}

const updated = 'November 21, 2026'
const contact = <a href="mailto:kapi91@gmail.com">kapi91@gmail.com</a>

export default function TermsOfServicePage() {
  const sections = [
    {id:'agreement',title:'About these terms',body:<>
      <p>These Terms of Service govern the use of <strong>PlanWedly</strong> at <a href="https://www.planwedly.com">www.planwedly.com</a>, operated as an Ontario-based wedding-planning and vendor-discovery service. By creating an account or using interactive features, you agree to these terms and our <Link href="/privacy">Privacy Policy</Link>.</p>
      <p>If you do not agree, do not create an account or use the service. You must be legally able to enter a binding agreement; accounts are intended for adults.</p>
    </>},
    {id:'service',title:'What PlanWedly provides',body:<>
      <p>PlanWedly provides tools for organizing wedding plans, budgets, tasks, guest information, vendor discovery, business profiles, inquiries, availability and customer reviews. Features may vary by account type, location, availability and subscription status.</p>
      <p><strong>PlanWedly is a discovery and planning platform—not the wedding vendor.</strong> Unless specifically stated otherwise, contracts, quotes, service delivery, cancellations and payments for wedding services are arranged directly between the couple and the chosen vendor. Vendor listings and availability do not guarantee bookings or service outcomes.</p>
    </>},
    {id:'accounts',title:'Accounts and security',body:<>
      <p>You must provide accurate account information, keep your login secure and notify PlanWedly if you suspect unauthorized access. You may use email/password or available external sign-in providers such as Google. You are responsible for activity under your account except where prohibited by applicable law.</p>
      <p>Do not impersonate a person or business, use another person&apos;s account without permission, create fake engagement or abuse the service. We may restrict accounts to investigate security risks, unlawful activity or material violations, using reasonable measures appropriate to the situation.</p>
    </>},
    {id:'vendors',title:'Vendor listings, claims and representation',body:<>
      <p>Vendors must be authorized to represent the businesses they claim and must keep business details, contact information, portfolios, packages and availability reasonably accurate. PlanWedly may request evidence of business ownership before approving claims or showing a <strong>Verified Business</strong> badge.</p>
      <p>A Verified Business designation means listing ownership has been checked to the extent described by PlanWedly; it is not a licence, insurance check, performance guarantee or recommendation. <strong>Premium</strong> refers to an access tier, not an endorsement. <strong>Featured</strong> identifies promotional placement where used.</p>
      <p>Vendors are responsible for their own service agreements, pricing, taxes, permits, qualifications, intellectual-property permissions and compliance with laws applicable to their business.</p>
    </>},
    {id:'inquiries',title:'Inquiries and communication',body:<>
      <p>When you submit an inquiry, you authorize PlanWedly to share the information you enter with the specific vendor contacted. This may include your name, contact details, wedding date, guest count, message and optional service budget. Do not include unnecessary sensitive information.</p>
      <p>Vendors may use inquiry information to respond to the requested service and should not misuse it, resell it or contact couples for unrelated purposes without an appropriate legal basis. PlanWedly cannot guarantee that any vendor will respond or accept an inquiry.</p>
    </>},
    {id:'reviews',title:'Customer reviews and verification',body:<>
      <p>Reviews must describe a genuine firsthand customer experience. A review must identify the service date. You must not submit fabricated reviews, compensated praise without disclosure, harassment, confidential third-party information or reviews designed to manipulate a competitor&apos;s reputation.</p>
      <p>PlanWedly may moderate submissions, request optional proof of service, label substantiated customer relationships as <strong>Verified Customer</strong>, and remove content that violates these terms or applicable law. The verification label confirms a customer relationship was substantiated, not that every statement or opinion was independently proven.</p>
      <p>Vendors can submit respectful replies and report disputed reviews. <strong>Reporting a review does not automatically remove it</strong>; legitimate critical feedback is allowed. Reviews and responses may be subject to separate moderation. Reviewers retain responsibility for what they submit.</p>
    </>},
    {id:'content',title:'User content and permissions',body:<>
      <p>You retain ownership of original content you upload or write, subject to rights held by others. By submitting content, you grant PlanWedly a non-exclusive, worldwide, royalty-free licence to store, process, reproduce and display that content as needed to operate the features you choose—for example, displaying your published vendor listing or an approved review. This licence lasts for as long as reasonably necessary to provide the service and handle lawful obligations.</p>
      <p>Only upload images, logos, video links, reviews and written material you are entitled to use. Do not submit copyright-infringing material, unlawful content, malicious links, private documents that you lack permission to share or misleading claims about services and pricing.</p>
      <p>PlanWedly may remove or restrict content in connection with moderation, legal compliance, safety, third-party rights or significant service changes.</p>
    </>},
    {id:'plans',title:'Free features, Premium and promotions',body:<>
      <p>PlanWedly may offer free vendor listings, optional Premium features and separately labelled Featured promotions. The specific included features, prices, billing period and availability will be shown in the service or checkout flow as features become commercially available.</p>
      <p><strong>Current testing notice:</strong> Premium subscriptions currently operate in Stripe test mode. Test charges and Premium Preview indicators do not mean that PlanWedly is charging real money for a commercial subscription. Live paid subscriptions will require a separate production launch and clear checkout terms.</p>
      <p>If commercial paid plans are introduced, their published checkout terms will describe recurring charges, renewal, cancellation and any applicable refund terms before a purchase is completed. PlanWedly does not promise that every future feature or planned integration will become available by a particular date.</p>
    </>},
    {id:'third-parties',title:'External websites and service providers',body:<>
      <p>Vendor pages may link to independent websites, social-media accounts, Google-hosted sign-in, video providers and other services that PlanWedly does not control. Their own terms and privacy policies apply when you use them.</p>
      <p>PlanWedly uses third-party providers for hosting, authentication, analytics and payment processing. See the <Link href="/privacy">Privacy Policy</Link> for more information about personal data handled in connection with these services.</p>
    </>},
    {id:'disclaimers',title:'Accuracy, availability and responsibility',body:<>
      <p>We aim to keep information useful, but some vendor listings, user reviews, descriptions, prices and availability are provided by third parties and may be incomplete or outdated. Historical prices mentioned in reviews should not be treated as current vendor quotes. PlanWedly does not independently guarantee vendor availability, service quality, suitability, licensing, insurance or event outcomes.</p>
      <p>The website and its tools are provided on an as-available basis. We may modify, suspend or discontinue features, subject to applicable law and any binding paid-service commitments. Nothing in these terms removes rights or protections that cannot lawfully be excluded.</p>
    </>},
    {id:'liability',title:'Disputes and limitations',body:<>
      <p>Couples and vendors should first seek to resolve disputes about contracted wedding services directly with each other. PlanWedly may consider reports about platform misuse or misleading listings, but it does not replace a court, regulator or contractual dispute-resolution process.</p>
      <p>To the extent permitted by applicable law, PlanWedly is not responsible for losses arising solely from acts or omissions of independent wedding vendors or other users. Any limitation or disclaimer applies only where legally enforceable; applicable consumer-protection and privacy rights remain intact.</p>
    </>},
    {id:'termination',title:'Account deletion and ending access',body:<>
      <p>You may stop using the service at any time. Eligible non-staff accounts can request deletion in <Link href="/account/settings">Account settings</Link>; deletion may remove saved wedding plans, account information and vendor-managed uploads, while independently submitted reviews and unclaimed public business listings can remain where appropriate. Some records may need to be retained for legal or legitimate dispute purposes.</p>
      <p>PlanWedly may suspend or terminate access for material violations, fraud, unlawful activity or serious security risks, subject to applicable law. Account deletion does not automatically terminate independent contracts between couples and wedding vendors.</p>
    </>},
    {id:'law',title:'Governing law and changes',body:<>
      <p>These terms are generally governed by the laws of Ontario and the applicable laws of Canada, without limiting any mandatory protections that apply to you as a consumer. We may revise these terms as the service evolves and will update the date shown above. Material changes may be communicated through the service or email where appropriate.</p>
    </>},
    {id:'contact',title:'Contact',body:<>
      <p>Questions about these terms, a vendor claim or a moderation decision? Email {contact}. You can also review our <Link href="/privacy">Privacy Policy</Link>.</p>
      <p>PlanWedly · Ontario, Canada · <a href="https://www.planwedly.com">www.planwedly.com</a></p>
    </>},
  ]
  return <LegalPage title="Terms of Service" description="Clear ground rules for couples and wedding professionals using PlanWedly." updated={updated} sections={sections} />
}
