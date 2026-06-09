function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      {children}
    </svg>
  )
}

export function DashboardIcon() {
  return (
    <Icon>
      <path
        d="M4 13.5V6.5a2.5 2.5 0 0 1 2.5-2.5h3A2.5 2.5 0 0 1 12 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 4 13.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 10.5V6.5A2.5 2.5 0 0 1 14.5 4h3A2.5 2.5 0 0 1 20 6.5v4A2.5 2.5 0 0 1 17.5 13h-3A2.5 2.5 0 0 1 12 10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 17.5v-3A2.5 2.5 0 0 1 14.5 12h3A2.5 2.5 0 0 1 20 14.5v3A2.5 2.5 0 0 1 17.5 20h-3A2.5 2.5 0 0 1 12 17.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  )
}

export function GodownIcon() {
  return (
    <Icon>
      <path
        d="M4 9.5 12 5l8 4.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9 21V12h6v9"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  )
}

export function ProductIcon() {
  return (
    <Icon>
      <path
        d="M7 7.5 12 5l5 2.5v5L12 15l-5-2.5v-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 15v6"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 12.5 12 15l5-2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  )
}

export function DeliveryIcon() {
  return (
    <Icon>
      <path
        d="M3.5 7h10v10h-10V7Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M13.5 10h3l3 3v4h-6V10Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  )
}

export function CalendarIcon() {
  return (
    <Icon>
      <path
        d="M7 4.5v-1A1.5 1.5 0 0 1 8.5 2h7A1.5 1.5 0 0 1 17 3.5v1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 8h14M7 4.5h10M6 6.5h12A2 2 0 0 1 20 8.5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  )
}

export function ReportsIcon() {
  return (
    <Icon>
      <path
        d="M7 3.5h10A2.5 2.5 0 0 1 19.5 6v14A2.5 2.5 0 0 1 17 22.5H7A2.5 2.5 0 0 1 4.5 20V6A2.5 2.5 0 0 1 7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 9h8M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  )
}

export function ActivityLogsIcon() {
  return (
    <Icon>
      <path
        d="M9 12h6M9 16h4M8 8h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="6.5" cy="12" r="0.8" fill="currentColor" />
      <circle cx="6.5" cy="16" r="0.8" fill="currentColor" />
      <circle cx="6.5" cy="8" r="0.8" fill="currentColor" />
    </Icon>
  )
}

export function SearchIcon() {
  return (
    <Icon>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  )
}

