async function initStaffShell(redirectPath, activeLinkId) {
  const user = await requireAuth(redirectPath);
  const role = getUserRole(user);
  if (role !== 'STAFF' && role !== 'ADMIN') {
    location.href = '/';
    return null;
  }
  const name = getUserName(user);
  const staffNameEl = document.getElementById('staffName');
  if (staffNameEl) staffNameEl.textContent = name;
  setActiveSidebarLink(activeLinkId);
  return user;
}

async function doLogout() {
  await logoutToHome();
}
