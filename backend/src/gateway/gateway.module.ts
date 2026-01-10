import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Global() // Global để không cần import ở mọi module
@Module({
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class GatewayModule { }
