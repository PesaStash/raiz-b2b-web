import TeamDetail from "../../_components/TeamDetail";
export default async function MemberPage({ params }: { params: Promise<{ memberId: string }> }) { const { memberId } = await params; return <TeamDetail type="member" id={memberId} />; }
