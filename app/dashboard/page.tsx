import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import "./dashboard.css";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Welcome to Your Dashboard</h1>
          <p className="user-email">{user.email}</p>
        </div>

        <div className="dashboard-content">
          <p className="dashboard-intro">
            You're all set! Your settlement calculator is ready to use.
          </p>

          <div className="dashboard-actions">
            <Link href="/" className="action-btn primary">
              Go to Calculator
            </Link>

            <form action="/auth/signout" method="post">
              <button type="submit" className="action-btn secondary">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
