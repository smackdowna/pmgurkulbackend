export function getLastTuesdayToNowRange() {
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.

  let daysToSubtract;

  if (today === 2) {
    // If today is Tuesday, subtract 7 to get last Tuesday
    daysToSubtract = 7;
  } else if (today > 2) {
    daysToSubtract = today - 2;
  } else {
    daysToSubtract = 7 - (2 - today);
  }

  const lastTuesday = new Date(now);
  lastTuesday.setDate(now.getDate() - daysToSubtract);
  lastTuesday.setHours(0, 0, 0, 0); // Midnight

  return {
    start: lastTuesday,
    end: now,
  };
}
