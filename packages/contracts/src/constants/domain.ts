export const API_PREFIX = "/api/v1";

export const FAMILY_ROLES = ["PARENT", "CHILD"] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const CHILD_AGE_MIN = 6;
export const CHILD_AGE_MAX = 11;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;

export const TITLE_MIN_LENGTH = 2;
export const TITLE_MAX_LENGTH = 100;

export const DESCRIPTION_MAX_LENGTH = 500;

export const COINS_MIN = 1;
export const COINS_MAX = 9999;

export const COINS_BALANCE_MIN = 0;

export const TASK_STATUSES = ["PENDING", "COMPLETED", "APPROVED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const REWARD_STATUSES = ["ACTIVE", "RETIRED"] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

export const REDEMPTION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type RedemptionStatus = (typeof REDEMPTION_STATUSES)[number];

export const COIN_REASONS = ["TASK_APPROVED", "REDEMPTION_APPROVED", "MANUAL_ADJUSTMENT"] as const;
export type CoinReason = (typeof COIN_REASONS)[number];

export const MAX_CHILDREN_PER_FAMILY = 10;

export const PIN_LENGTH = 4;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const PARENT_MAX_FAILED_ATTEMPTS = 10;
export const PARENT_LOCKOUT_MINUTES = 15;
export const CHILD_MAX_FAILED_ATTEMPTS = 5;
export const CHILD_LOCKOUT_MINUTES = 5;

export const PARENT_PIN_MAX_FAILED_ATTEMPTS = 10;
export const PARENT_PIN_LOCKOUT_MINUTES = 15;

export const PARENT_SESSION_DAYS = 30;
export const CHILD_SESSION_HOURS = 12;

export const ACCOUNT_SESSION_COOKIE = "monedin_session";
export const PROFILE_SESSION_COOKIE = "monedin_profile";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ASSISTANT_QUESTION_MAX_LENGTH = 500;

export const ASSISTANT_MAX_HISTORY_TURNS = 12;

export const ASSISTANT_TURN_MAX_LENGTH = 2000;

export const ASSISTANT_ROLES = ["user", "assistant"] as const;
export type AssistantRole = (typeof ASSISTANT_ROLES)[number];
