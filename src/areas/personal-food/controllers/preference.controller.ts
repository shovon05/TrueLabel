// Feature F16: Food Preference & Allergen Profile
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Render,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PreferenceService,
  STANDARD_ALLERGENS,
  STANDARD_DIETS,
} from '../services/preference.service';
import { UpdatePreferenceProfileDto } from '../models/dto/update-preference-profile.dto';
import { AuthenticatedGuard } from '../../../common/guards/authenticated.guard';

@Controller('personal')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  /**
   * Render User Dietary & Allergen Profile Form
   */
  @Get('profile')
  @UseGuards(AuthenticatedGuard)
  @Render('areas/personal-food/views/profile')
  async getProfile(@Req() req: Request, @Query('saved') saved?: string) {
    const userId = req.session.user.id;
    const profile = await this.preferenceService.findOrCreate(userId);

    return {
      title: 'Dietary Profile & Allergen Preferences — TrueLabel',
      profile,
      standardAllergens: STANDARD_ALLERGENS,
      standardDiets: STANDARD_DIETS,
      saved: saved === 'true',
      user: req.session.user,
    };
  }

  /**
   * Save / Update Dietary & Allergen Profile
   */
  @Post('profile')
  @UseGuards(AuthenticatedGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateProfile(
    @Body() dto: UpdatePreferenceProfileDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = req.session.user.id;
    await this.preferenceService.updateProfile(userId, dto);
    return res.redirect('/personal/profile?saved=true');
  }
}

