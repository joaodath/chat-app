export class messages {
  id: string;
  text: string;
  createdAt: Date;
  ownerUsername: string;
  roomName: string;
}
export class userWithoutPasswordDto {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  isLoggedIn?: boolean;
  messages?: messages[];
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
