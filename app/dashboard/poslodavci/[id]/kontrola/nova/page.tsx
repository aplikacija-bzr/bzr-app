import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RedirectNovaKontrola({ params }: Props) {
  const { id } = await params;

  redirect(`/dashboard/poslodavci/${id}/kontrole/nova`);
}