import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Hoặc JwtAuthGuard nếu bạn đã tạo riêng
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Decorator bạn tạo ở bước Auth

@Controller('reservations')
@UseGuards(AuthGuard('jwt')) // Bắt buộc đăng nhập
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) { }

    /**
     * GET /reservations/:id
     * Lấy chi tiết reservation với order info
     */
    @Get(':id')
    async getDetail(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) reservationId: number
    ) {
        return this.reservationService.getReservationDetail(user.userId, reservationId);
    }

    /**
     * GET /reservations
     * Lấy danh sách reservation của user
     */
    @Get()
    async getMyReservations(@CurrentUser() user: any) {
        return this.reservationService.getUserReservations(user.userId);
    }

    @Post()
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreateReservationDto
    ) {
        // Truyền userId lấy từ Token vào Service
        return this.reservationService.createReservation(user.userId, dto);
    }
}