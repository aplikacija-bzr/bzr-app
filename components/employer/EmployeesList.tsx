import type { CSSProperties } from 'react'
import Link from 'next/link'

import type { Employee } from '@/lib/employees'

import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import TableHeaderCell from '@/components/ui/TableHeaderCell'
import { theme } from '@/components/ui/theme'

type EmployeesListProps = {
  employerId: string
  employees: Employee[]
}

export default function EmployeesList({
  employerId,
  employees,
}: EmployeesListProps) {
  return (
    <div>
     <div style={listHeader}>
  <p style={employeeCount}>
    Broj zaposlenih: {employees.length}
  </p>

  <Link
    href={`/employers/${employerId}/employees/new`}
    style={newEmployeeLink}
  >
    + Novi zaposleni
  </Link>
</div>

<Table>
        <thead>
          <tr>
            <TableHeaderCell>
              <div style={employeeColumn}>
                Zaposleni
              </div>
            </TableHeaderCell>

            <TableHeaderCell>
              Radno mesto
            </TableHeaderCell>

            <TableHeaderCell>
              Status
            </TableHeaderCell>

            <TableHeaderCell>
              Akcija
            </TableHeaderCell>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              style={row}
            >
              <td style={employeeCell}>
                {employee.first_name}{' '}
                {employee.last_name}
              </td>

              <td style={jobPositionCell}>
                {employee.job_positions.length > 0
                  ? employee.job_positions
                      .map(
                        (jobPosition) =>
                          jobPosition.name
                      )
                      .join(', ')
                  : '—'}
              </td>

              <td style={statusCell}>
                <Badge
                  variant={
                    employee.active
                      ? 'success'
                      : 'danger'
                  }
                >
                  {employee.active
                    ? 'Aktivan'
                    : 'Neaktivan'}
                </Badge>
              </td>

              <td style={actionCell}>
                <Link
                  href={`/employers/${employee.employer_id}/employees/${employee.id}`}
                  style={openLink}
                >
                  Otvori
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
const listHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: theme.spacing.md,
}

const newEmployeeLink: CSSProperties = {
  display: 'inline-block',
  padding: '10px 16px',
  borderRadius: theme.radius.sm,
  background: '#16a34a',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: theme.fontSize.sm,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}
const employeeCount: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  fontSize: theme.fontSize.sm,
}

const row: CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
}

const employeeColumn: CSSProperties = {
  width: 280,
  minWidth: 280,
}

const employeeCell: CSSProperties = {
  width: 280,
  minWidth: 280,
  padding: '16px 12px',
  fontSize: theme.fontSize.sm,
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const jobPositionCell: CSSProperties = {
  padding: '16px 12px',
  fontSize: theme.fontSize.sm,
}

const statusCell: CSSProperties = {
  width: 120,
  padding: '16px 12px',
  fontSize: theme.fontSize.sm,
  whiteSpace: 'nowrap',
}

const actionCell: CSSProperties = {
  width: 120,
  padding: '16px 12px',
  whiteSpace: 'nowrap',
}

const openLink: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  border: '1px solid #cbd5e1',
  borderRadius: theme.radius.sm,
  background: '#ffffff',
  color: '#0f172a',
  textDecoration: 'none',
  cursor: 'pointer',
  fontSize: theme.fontSize.sm,
  fontWeight: 500,
}