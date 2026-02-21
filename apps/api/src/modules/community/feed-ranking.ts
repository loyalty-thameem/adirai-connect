export type RankedPost = {
  likesCount: number;
  commentsCount: number;
  importantVotes: number;
  urgentVotes: number;
  createdAt: Date;
  suspiciousSignalsCount?: number;
};

export function recencyWeight(createdAt: Date): number {
  const ageHours = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 3600));
  return Math.round(100 / ageHours);
}

export function calculatePostScore(post: RankedPost): number {
  return (
    post.likesCount * 2 +
    post.commentsCount * 3 +
    post.importantVotes * 5 +
    post.urgentVotes * 10 +
    recencyWeight(post.createdAt) -
    Math.min(50, (post.suspiciousSignalsCount ?? 0) * 5)
  );
}

export function urgentDeliveryPlan(urgentVotes: number, area: string) {
  if (urgentVotes >= 10) {
    return {
      tier: 'global',
      reach: 300,
      stages: [
        { stage: 'same_area', users: 120, area },
        { stage: 'nearby_wards', users: 120 },
        { stage: 'wider_adirai', users: 60 },
      ],
    };
  }
  if (urgentVotes >= 1) {
    return {
      tier: 'local',
      reach: 30,
      stages: [{ stage: 'same_area', users: 30, area }],
    };
  }
  return { tier: 'none', reach: 0, stages: [] as Array<Record<string, unknown>> };
}

