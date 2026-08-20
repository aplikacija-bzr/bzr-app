type ProcessStepStatus =
  | 'active'
  | 'completed'
  | 'upcoming'

type ProcessStepProps = {
  number: number
  title: string
  status: ProcessStepStatus
}

export default function ProcessStep({
  number,
  title,
  status,
}: ProcessStepProps) {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        background: isActive
          ? '#eff6ff'
          : 'transparent',
        border: isActive
          ? '1px solid #bfdbfe'
          : '1px solid transparent',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCompleted
            ? '#16a34a'
            : isActive
              ? '#2563eb'
              : '#e5e7eb',
          color:
            isCompleted || isActive
              ? '#ffffff'
              : '#6b7280',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {isCompleted ? '✓' : number}
      </div>

      <div>
        <div
          style={{
            fontWeight: 700,
            color: isActive
              ? '#1d4ed8'
              : '#111827',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: isCompleted
              ? '#15803d'
              : isActive
                ? '#2563eb'
                : '#9ca3af',
          }}
        >
          {isCompleted
            ? 'Završeno'
            : isActive
              ? 'Aktivan'
              : 'Predstoji'}
        </div>
      </div>
    </div>
  )
}