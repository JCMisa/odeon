export interface UserType {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  credits?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
