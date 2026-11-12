import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Render,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../models/dto/login.dto';
import { RegisterDto } from '../models/dto/register.dto';
import { UserRole } from '../models/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('areas/identity/views/login')
  getLoginPage(@Req() req: Request) {
    if (req.session?.user) {
      return { redirect: '/catalog' };
    }
    return {
      title: 'Sign In — TrueLabel',
      user: req.session?.user,
    };
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleLogin(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.validateUser(loginDto);
      req.session.user = user;
      return res.redirect('/catalog');
    } catch (err) {
      return res.render('areas/identity/views/login', {
        title: 'Sign In — TrueLabel',
        error: err.message || 'Invalid credentials',
        email: loginDto.email,
      });
    }
  }

  @Get('register')
  @Render('areas/identity/views/register')
  getRegisterPage(@Req() req: Request) {
    return {
      title: 'Create Account — TrueLabel',
      user: req.session?.user,
    };
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleRegister(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.register(registerDto);
      req.session.user = user;
      return res.redirect('/catalog');
    } catch (err) {
      return res.render('areas/identity/views/register', {
        title: 'Create Account — TrueLabel',
        error: err.message || 'Could not complete registration',
        name: registerDto.name,
        email: registerDto.email,
        role: registerDto.role,
      });
    }
  }

  @Post('logout')
  handleLogout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => {
      res.redirect('/catalog');
    });
  }

  // Quick Switch for CSE470 Evaluation / Demo Viva
  @Get('switch-role/:role')
  demoSwitchRole(
    @Param('role') role: UserRole,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const validRoles: UserRole[] = ['consumer', 'manufacturer', 'inspector', 'admin'];
    const chosenRole = validRoles.includes(role) ? role : 'consumer';

    req.session.user = {
      id: 99,
      name: `Demo ${chosenRole.charAt(0).toUpperCase() + chosenRole.slice(1)}`,
      email: `${chosenRole}@truelabel.demo`,
      role: chosenRole,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return res.redirect('/catalog');
  }
}

