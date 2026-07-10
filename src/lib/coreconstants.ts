export enum StaffRole {
  ADMIN = 1,
  EDITOR = 2,
}

export enum StaffStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  SUSPENDED = 2,
  TERMINATED = 3,
}

export enum AuthorStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  SUSPENDED = 2,
  BANNED = 3,
  PENDING_VERIFICATION = 4,
}

export enum PostStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  SCHEDULED = 3,
  ARCHIVED = 4,
  REJECTED = 5,
  TRASHED = 6,
}

export enum CommentStatus {
  PENDING = 0,
  APPROVED = 1,
  SPAM = 2,
  REJECTED = 3,
  TRASHED = 4,
}

export enum CategoryStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export enum NewsletterSubscriptionStatus {
  UNSUBSCRIBED = 0,
  SUBSCRIBED = 1,
  PENDING_CONFIRMATION = 2,
}

export const JWT_SECRET = process.env.JWT_SECRET ?? '';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '';
