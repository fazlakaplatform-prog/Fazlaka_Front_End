export interface Comment {
  _id?: string;
  _type: 'comment';
  name: string;
  email: string;
  content: string;
  episode?: {
    _ref: string;
    _type: 'reference';
  };
  article?: {
    _ref: string;
    _type: 'reference';
  };
  parentComment?: {
    _ref: string;
    _type: 'reference';
  };
  createdAt: string;
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  replies?: Comment[];
}

export interface SanityUser {
  _id: string;
  _type: 'user';
  name: string;
  email: string;
  password?: string;
  image?: string;
  isActive: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  magicToken?: string;
  magicTokenExpiry?: string;
  otpCode?: string;
  otpExpiry?: string;
  otpPurpose?: 'login' | 'register' | 'reset' | 'verify';
  otpVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}