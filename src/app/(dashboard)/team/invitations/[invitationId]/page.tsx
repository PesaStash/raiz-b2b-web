import TeamDetail from "../../_components/TeamDetail";
export default async function InvitationPage({ params }: { params: Promise<{ invitationId: string }> }) { const { invitationId } = await params; return <TeamDetail type="invitation" id={invitationId} />; }
