import GuestRsvp from './GuestRsvp'
export const metadata={title:'Respond to your invitation · PlanWedly',robots:{index:false,follow:false}}
export default async function RsvpPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params
 return <GuestRsvp token={token}/>
}
