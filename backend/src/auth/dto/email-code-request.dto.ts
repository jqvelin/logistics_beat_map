import { IsEmail } from 'class-validator';

export class EmailCodeRequestDto {
  @IsEmail()
  email!: string;
}
