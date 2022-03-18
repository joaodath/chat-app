export class userWithoutPasswordDto {
  name: string;
  username: string;
  email: string;
  profilePhoto: string | null;
  birthDate: Date;
  cpf: string;
  cep: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  phonenumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  deleted: boolean;
}
