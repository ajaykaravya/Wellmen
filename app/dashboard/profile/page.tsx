"use client";

import DashboardShell, { useDashboardContext } from "../_components/DashboardShell";

function ProfileContent() {
  const { user, setNavOpen } = useDashboardContext();
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <h2 className="rbac-title-lg">My Profile</h2>
          <div className="rbac-profile-grid">
            <div className="rbac-profile-item">
              <p className="rbac-label">Name</p>
              <p className="rbac-name">{displayName}</p>
            </div>
            <div className="rbac-profile-item">
              <p className="rbac-label">Email</p>
              <p className="rbac-name">{user?.email}</p>
            </div>
            <div className="rbac-profile-item">
              <p className="rbac-label">Mobile Number</p>
              <p className="rbac-name">{user?.mobileNumber}</p>
            </div>
            <div className="rbac-profile-item">
              <p className="rbac-label">Role</p>
              <p className="rbac-name">{user?.role}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ProfilePage() {
  return (
    <DashboardShell>
      <ProfileContent />
    </DashboardShell>
  );
}
