'use server'

import { createClient } from '@/lib/supabase/server'

export async function addHazardActivity(
  hazardId: string,
  activity: string,
) {
  const cleanHazardId =
    String(
      hazardId ?? '',
    ).trim()

  const cleanActivity =
    String(
      activity ?? '',
    ).trim()

  if (
    !cleanHazardId ||
    !cleanActivity
  ) {
    throw new Error(
      'Opasnost i naziv aktivnosti su obavezni.',
    )
  }

  const supabase =
    await createClient()

  const {
    data: existingActivity,
    error: existingActivityError,
  } =
    await supabase
      .from(
        'hazard_activities',
      )
      .select(`
        id,
        hazard_id,
        activity,
        sort_order
      `)
      .eq(
        'hazard_id',
        cleanHazardId,
      )
      .eq(
        'activity',
        cleanActivity,
      )
      .maybeSingle()

  if (
    existingActivityError
  ) {
    throw existingActivityError
  }

  if (existingActivity) {
    return existingActivity
  }

  const {
    data: lastActivity,
    error: lastActivityError,
  } =
    await supabase
      .from(
        'hazard_activities',
      )
      .select(`
        sort_order
      `)
      .eq(
        'hazard_id',
        cleanHazardId,
      )
      .order(
        'sort_order',
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle()

  if (lastActivityError) {
    throw lastActivityError
  }

  const nextSortOrder =
    (
      lastActivity
        ?.sort_order ?? 0
    ) + 10

  const {
    data: newActivity,
    error: insertError,
  } =
    await supabase
      .from(
        'hazard_activities',
      )
      .insert({
        hazard_id:
          cleanHazardId,
        activity:
          cleanActivity,
        sort_order:
          nextSortOrder,
        active: true,
      })
      .select(`
        id,
        hazard_id,
        activity,
        sort_order
      `)
      .single()

  if (insertError) {
    throw insertError
  }

  return newActivity
}