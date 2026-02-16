
import { Metadata } from 'next';
// import PayUserClient from './PayUserClient';
import NewPayUserClient from './NewPayUserClient';

type Props = {
  params: Promise<{ raizTag: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raizTag } = await params;
  return {
    title: `Raiz Payment for ${raizTag}`,
  };
}

export default function PayUserPage() {
  // return <PayUserClient />;
  return <NewPayUserClient />;
}
