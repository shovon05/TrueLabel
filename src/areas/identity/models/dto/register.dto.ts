import { IsEmail, IsIn, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class RegisterDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsIn(['consumer', 'manufacturer', 'inspector', 'admin'], {
    message: 'Role must be consumer, manufacturer, inspector, or admin',
  })
  role: UserRole;
}

