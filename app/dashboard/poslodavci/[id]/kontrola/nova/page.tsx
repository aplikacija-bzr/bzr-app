import { redirect } from 'next/navigation'

export default function RedirectNovaKontrola({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/dashboard/poslodavci/${params.id}/kontrole/nova`)
}