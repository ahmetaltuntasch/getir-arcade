const GUEST_NAME_KEY = 'getir-arcade-guest-name-v1';
const GUEST_NAMES = ['Mor Kurye', 'Hızlı Panda', 'Gece Kuryesi', 'Rota Ustası', 'Turbo Çırak', 'Neon Teslimatçı'];

function randomGuestName() {
  return GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
}

export function getPlayerIdentity(store) {
  const profile = store?.getSnapshot?.().profile;
  if (profile?.mode === 'account' && profile.nickname) return { name: profile.nickname, account: true };
  try {
    const saved = sessionStorage.getItem(GUEST_NAME_KEY);
    if (saved) return { name: saved, account: false };
    const name = randomGuestName();
    sessionStorage.setItem(GUEST_NAME_KEY, name);
    return { name, account: false };
  } catch {
    return { name: randomGuestName(), account: false };
  }
}
