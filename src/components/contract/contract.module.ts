import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from 'src/entities/contract.entity';
import { HttpModule } from '@nestjs/axios';
import { Metadata } from 'src/entities/metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract,Metadata]), HttpModule],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
