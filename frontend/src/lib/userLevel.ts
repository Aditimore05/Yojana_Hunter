import { UserProfile, UserLevelInfo } from "@/types/profile";

export function calculateUserLevel(
  profile?: UserProfile | null,
  activityCount: number = 0,
  savedCount: number = 0,
  applicationCount: number = 0
): UserLevelInfo {
  // 1. Profile completeness contributes up to 40 points
  const completeness = profile?.completenessPercent ?? 0;
  const profilePoints = Math.min(40, Math.round(completeness * 0.4));

  // 2. Real user activities & scheme interactions contribute up to 30 points (5 pts per activity)
  const activityPoints = Math.min(30, activityCount * 5);

  // 3. Saved schemes contribute up to 20 points (10 pts per saved scheme)
  const savedSchemesPoints = Math.min(20, savedCount * 10);

  // 4. Applications drafted or submitted contribute up to 10 points
  const applicationPoints = applicationCount > 0 ? 10 : 0;

  const totalScore = Math.min(100, profilePoints + activityPoints + savedSchemesPoints + applicationPoints);

  let level = 1;
  let levelName = "New Citizen";
  let badgeColor = "blue";
  let nextLevel = 2;
  let nextThreshold = 25;

  if (totalScore < 25) {
    level = 1;
    levelName = "New Citizen";
    badgeColor = "blue";
    nextLevel = 2;
    nextThreshold = 25;
  } else if (totalScore < 50) {
    level = 2;
    levelName = "Scheme Explorer";
    badgeColor = "teal";
    nextLevel = 3;
    nextThreshold = 50;
  } else if (totalScore < 75) {
    level = 3;
    levelName = "Active Beneficiary";
    badgeColor = "indigo";
    nextLevel = 4;
    nextThreshold = 75;
  } else if (totalScore < 90) {
    level = 4;
    levelName = "Verified Beneficiary";
    badgeColor = "purple";
    nextLevel = 5;
    nextThreshold = 90;
  } else {
    level = 5;
    levelName = "Scheme Champion";
    badgeColor = "amber";
    nextLevel = 5;
    nextThreshold = 100;
  }

  const pointsToNext = Math.max(0, nextThreshold - totalScore);

  return {
    level,
    levelName,
    score: totalScore,
    maxScore: 100,
    nextLevel,
    nextThreshold,
    pointsToNext,
    badgeColor,
    progressPercent: totalScore,
    breakdown: {
      profilePoints,
      activityPoints,
      savedSchemesPoints,
      applicationPoints,
    },
  };
}
