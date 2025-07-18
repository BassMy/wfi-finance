// src/types/achievements.types.ts
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'financial' | 'usage' | 'milestone' | 'behavior';
  condition: AchievementCondition;
  reward?: AchievementReward;
}

export interface AchievementCondition {
  type: 'expense_count' | 'savings_amount' | 'efficiency_rate' | 'streak_days';
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface AchievementReward {
  type: 'badge' | 'discount' | 'feature_unlock';
  value: string;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  progress: number;
}