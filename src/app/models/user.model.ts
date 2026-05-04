export interface UserModel {
  userName: string;
  email: string;
  password: string; 
  role: 'ADMIN' | 'USER';
}