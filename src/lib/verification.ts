// Pure, shared, synchronous creator verification eligibility checklist calculations.
export function calculateVerificationEligibility(details: any) {
  if (!details) return null;

  const isProfileComplete = !!(details.fullName && details.avatarUrl && details.bio);
  const isCommunityStandingClean = (details.activeViolations || 0) === 0 && !details.isSuspended;

  const criteria = [
    {
      id: 'copies',
      name: 'Total Copies >= 1000',
      current: details.totalCopies || 0,
      target: 1000,
      unlocked: (details.totalCopies || 0) >= 1000,
      status: (details.totalCopies || 0) >= 1000 ? 'completed' : (details.totalCopies || 0) >= 500 ? 'near' : 'not',
      label: `${(details.totalCopies || 0).toLocaleString()} / 1,000 copies`
    },
    {
      id: 'prompts',
      name: 'Minimum Prompts Created',
      current: details.totalPrompts || 0,
      target: 10,
      unlocked: (details.totalPrompts || 0) >= 10,
      status: (details.totalPrompts || 0) >= 10 ? 'completed' : (details.totalPrompts || 0) >= 5 ? 'near' : 'not',
      label: `${details.totalPrompts || 0} / 10 Prompts`
    },
    {
      id: 'age',
      name: 'Account Age Requirement',
      current: details.accountAgeDays || 0,
      target: 30,
      unlocked: (details.accountAgeDays || 0) >= 30,
      status: (details.accountAgeDays || 0) >= 30 ? 'completed' : (details.accountAgeDays || 0) >= 15 ? 'near' : 'not',
      label: `${details.accountAgeDays || 0} / 30 Days`
    },
    {
      id: 'profile',
      name: 'Profile Completion',
      current: isProfileComplete ? 1 : 0,
      target: 1,
      unlocked: isProfileComplete,
      status: isProfileComplete ? 'completed' : 'not',
      label: isProfileComplete ? 'Profile Complete' : 'Missing Bio, Avatar, or Name'
    },
    {
      id: 'standing',
      name: 'Community Standing',
      current: isCommunityStandingClean ? 1 : 0,
      target: 1,
      unlocked: isCommunityStandingClean,
      status: isCommunityStandingClean ? 'completed' : 'not',
      label: isCommunityStandingClean ? 'Clean Record' : 'Active Violations / Suspended'
    }
  ];

  const completedCount = criteria.filter(c => c.unlocked).length;
  const progressPercent = Math.round((completedCount / criteria.length) * 100);
  const isEligible = completedCount === criteria.length;

  return {
    criteria,
    completedCount,
    progressPercent,
    isEligible
  };
}

