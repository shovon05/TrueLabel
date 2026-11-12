import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../models/user.entity';
import { RegisterDto } from '../models/dto/register.dto';
import { LoginDto } from '../models/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = this.userRepository.create({
      name: registerDto.name.trim(),
      email: registerDto.email.toLowerCase().trim(),
      passwordHash,
      role: registerDto.role,
      isVerified: true,
    });

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async validateUser(loginDto: LoginDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findById(id: number): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
