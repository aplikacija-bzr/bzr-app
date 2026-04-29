import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* NAVBAR */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #ddd",
          padding: "12px 20px",
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Link href="/dashboard/poslodavci" style={linkStyle}>
          Poslodavci
        </Link>

        <Link href="/dashboard/kontrole" style={linkStyle}>
          Kontrole
        </Link>

        <Link href="/dashboard/arhiva" style={linkStyle}>
          Arhiva
        </Link>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

const linkStyle = {
  textDecoration: "none",
  fontWeight: "bold",
  color: "#111",
};