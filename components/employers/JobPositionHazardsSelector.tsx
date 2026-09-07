'use client'

import { useState } from 'react'

type Hazard = {
  id: string
  code: string
  name: string
  category: string
  article_number: number
  sort_order: number
}

type InitialHazard = {
  hazard_id: string
  activities: string
}

type HazardActivity = {
  id: string
  hazard_id: string
  activity: string
  sort_order: number
}

type JobPositionHazardsSelectorProps = {
  hazards: Hazard[]
  hazardActivities: HazardActivity[]
  initialHazards?: InitialHazard[]
  addHazardActivity?: (
    hazardId: string,
    activity: string,
  ) => Promise<HazardActivity>
}

export default function JobPositionHazardsSelector({
  hazards,
  hazardActivities,
  initialHazards = [],
  addHazardActivity,
}: JobPositionHazardsSelectorProps) {
  const initialSelected =
    Object.fromEntries(
      initialHazards.map(
        (item) => [
          item.hazard_id,
          true,
        ],
      ),
    )

  const initialActivities =
    Object.fromEntries(
      initialHazards.map(
        (item) => [
          item.hazard_id,
          item.activities,
        ],
      ),
    )

  const [
    selectedHazards,
    setSelectedHazards,
  ] =
    useState<Record<string, boolean>>(
      initialSelected,
    )

  const [
    activities,
    setActivities,
  ] =
    useState<Record<string, string>>(
      initialActivities,
    )

  const [
    localHazardActivities,
    setLocalHazardActivities,
  ] =
    useState<HazardActivity[]>(
      hazardActivities,
    )

  const [
    newActivityValues,
    setNewActivityValues,
  ] =
    useState<Record<string, string>>(
      {},
    )

  const dangers =
    hazards.filter(
      (hazard) =>
        hazard.category === 'OPASNOST',
    )

  const harmfulEffects =
    hazards.filter(
      (hazard) =>
        hazard.category === 'STETNOST',
    )

  const activitiesByHazard =
    localHazardActivities.reduce<
      Record<string, HazardActivity[]>
    >(
      (result, item) => {
        if (!result[item.hazard_id]) {
          result[item.hazard_id] = []
        }

        result[item.hazard_id].push(
          item,
        )

        return result
      },
      {},
    )

  function toggleHazard(
    hazardId: string,
  ) {
    setSelectedHazards(
      (current) => ({
        ...current,
        [hazardId]:
          !current[hazardId],
      }),
    )
  }

  function updateActivities(
    hazardId: string,
    value: string,
  ) {
    setActivities(
      (current) => ({
        ...current,
        [hazardId]:
          value,
      }),
    )
  }

  function toggleActivity(
    hazardId: string,
    activity: string,
  ) {
    const currentActivities =
      activities[hazardId] ?? ''

    const selectedActivities =
      currentActivities
        .split('\n')
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean)

    const alreadySelected =
      selectedActivities.includes(
        activity,
      )

    const nextActivities =
      alreadySelected
        ? selectedActivities.filter(
            (item) =>
              item !== activity,
          )
        : [
            ...selectedActivities,
            activity,
          ]

    updateActivities(
      hazardId,
      nextActivities.join('\n'),
    )
  }

   async function addLocalActivity(
    hazardId: string,
  ) {
   
    const newActivity =
      (
        newActivityValues[
          hazardId
        ] ?? ''
      ).trim()

    if (!newActivity) {
      return
    }

    const alreadyExists =
      localHazardActivities.find(
        (item) =>
          item.hazard_id ===
            hazardId &&
          item.activity ===
            newActivity,
      )

    if (alreadyExists) {
      toggleActivity(
        hazardId,
        alreadyExists.activity,
      )

      setNewActivityValues(
        (current) => ({
          ...current,
          [hazardId]: '',
        }),
      )

      return
    }
   

    if (!addHazardActivity) {
      return
    }

    const newItem =
      await addHazardActivity(
        hazardId,
        newActivity,
      )

    setLocalHazardActivities(
      (current) => [
        ...current,
        newItem,
      ],
    )

    toggleActivity(
      hazardId,
      newItem.activity,
    )

    setNewActivityValues(
      (current) => ({
        ...current,
        [hazardId]: '',
      }),
    )
  }

  function renderHazard(
    hazard: Hazard,
    isLast: boolean,
  ) {
    const selected =
      Boolean(
        selectedHazards[
          hazard.id
        ],
      )

    const currentActivities =
      activities[
        hazard.id
      ] ?? ''

    const availableActivities =
      activitiesByHazard[
        hazard.id
      ] ?? []

    return (
      <div
        key={hazard.id}
        style={{
          borderBottom:
            isLast
              ? 'none'
              : '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 14px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            name="hazard_ids"
            value={hazard.id}
            checked={selected}
            onChange={() =>
              toggleHazard(
                hazard.id,
              )
            }
            style={{
              marginTop: 3,
              width: 16,
              height: 16,
              flexShrink: 0,
              cursor: 'pointer',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: 14,
              flex: 1,
            }}
          >
            <div
              style={{
                minWidth: 60,
                fontWeight: 800,
                color: '#2563eb',
                fontSize: 14,
              }}
            >
              {hazard.code}
            </div>

            <div
              style={{
                color: '#374151',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {hazard.name}
            </div>
          </div>
        </label>

        {selected && (
          <div
            style={{
              padding:
                '0 14px 14px 42px',
            }}
          >
            <label
              htmlFor={
                `hazard_activities_${hazard.id}`
              }
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 700,
                color: '#374151',
              }}
            >
              Aktivnosti pri kojima se javlja
            </label>

            {availableActivities.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {availableActivities.map(
                  (item) => {
                    const checked =
                      currentActivities
                        .split('\n')
                        .map(
                          (value) =>
                            value.trim(),
                        )
                        .filter(Boolean)
                        .includes(
                          item.activity,
                        )

                    return (
                      <label
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems:
                            'flex-start',
                          gap: 8,
                          fontSize: 14,
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                      <input
  type="checkbox"
  name={`hazard_activity_ids_${hazard.id}`}
  value={item.id}
  checked={checked}
  onChange={() =>
    toggleActivity(
      hazard.id,
      item.activity,
    )
  }
  style={{
    marginTop: 3,
  }}
/>

                        <span>
                          {item.activity}
                        </span>
                      </label>
                    )
                  },
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <input
                type="text"
                value={
                  newActivityValues[
                    hazard.id
                  ] ?? ''
                }
                onChange={
                  (event) =>
                    setNewActivityValues(
                      (current) => ({
                        ...current,
                        [hazard.id]:
                          event.target.value,
                      }),
                    )
                }
                placeholder="Nova aktivnost..."
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  border:
                    '1px solid #d1d5db',
                  borderRadius: 7,
                  fontSize: 14,
                }}
              />

              <button
                type="button"
                onClick={() =>
                  addLocalActivity(
                    hazard.id,
                  )
                }
                style={{
                  padding:
                    '9px 12px',
                  border: 0,
                  borderRadius: 7,
                  background:
                    '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace:
                    'nowrap',
                }}
              >
                + Dodaj aktivnost
              </button>
            </div>

            <textarea
              id={
                `hazard_activities_${hazard.id}`
              }
              name={
                `hazard_activities_${hazard.id}`
              }
              value={
                currentActivities
              }
              onChange={
                (event) =>
                  updateActivities(
                    hazard.id,
                    event.target.value,
                  )
              }
              placeholder="Unesite aktivnosti pri kojima se ova opasnost ili štetnost javlja..."
              required
              style={{
                width: '100%',
                minHeight: 90,
                padding: '10px 12px',
                border:
                  '1px solid #d1d5db',
                borderRadius: 7,
                fontSize: 14,
                resize:
                  'vertical',
                boxSizing:
                  'border-box',
                background:
                  '#ffffff',
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: 30,
        paddingTop: 24,
        borderTop:
          '1px solid #e5e7eb',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 800,
          color: '#111827',
        }}
      >
        Opasnosti i štetnosti
      </h2>

      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          color: '#64748b',
          fontSize: 14,
        }}
      >
        Šifarnik prema članu 8. i 9.
        Pravilnika o načinu i postupku
        procene rizika na radnom mestu
        i u radnoj sredini.
      </p>

      <div
        style={{
          marginTop: 24,
        }}
      >
        <h3
          style={{
            margin:
              '0 0 12px 0',
            fontSize: 16,
            fontWeight: 800,
            color: '#111827',
          }}
        >
          OPASNOSTI — član 8.
        </h3>

        <div
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {dangers.map(
            (hazard, index) =>
              renderHazard(
                hazard,
                index ===
                  dangers.length - 1,
              ),
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
        }}
      >
        <h3
          style={{
            margin:
              '0 0 12px 0',
            fontSize: 16,
            fontWeight: 800,
            color: '#111827',
          }}
        >
          ŠTETNOSTI — član 9.
        </h3>

        <div
          style={{
            border:
              '1px solid #e5e7eb',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {harmfulEffects.map(
            (hazard, index) =>
              renderHazard(
                hazard,
                index ===
                  harmfulEffects.length - 1,
              ),
          )}
        </div>
      </div>
    </div>
  )
}