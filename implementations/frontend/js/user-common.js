let userShellUser = null;

async function initUserShell(redirectPath, activeLinkId) {
  const user = await requireAuth(redirectPath);
  const role = getUserRole(user);
  if (role !== 'USER') {
    location.href = '/';
    return null;
  }
  userShellUser = user;
  const name = getUserName(user);
  const userLabelEl = document.getElementById('userLabel');
  if (userLabelEl) userLabelEl.textContent = name;
  const roleLabelEl = document.getElementById('roleLabel');
  if (roleLabelEl) roleLabelEl.textContent = roleLabel(user.role || user.UserRole || '');
  setActiveSidebarLink(activeLinkId);
  return user;
}

function getUserShellUser() {
  return userShellUser;
}

async function doLogout() {
  await logoutToHome();
}
