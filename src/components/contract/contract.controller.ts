import { Controller, Get, Post, Body, Query, Response } from '@nestjs/common';
import { validate } from 'class-validator';
import { ContractService } from './contract.service';
import { AddressDTO } from './types';
import { mintDTO } from './types';
import { burnDTO, tokenDTO } from './types';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}
  @Get('getMaxSupply')
  async getMaxSupply(@Response() res) {
    return this.contractService.getMaxSupply(res);
  }

  @Get('get-balance')
  async getBalance(@Query() addressDTO: AddressDTO, @Response() res) {
    return this.contractService.getBalance(addressDTO, res);
  }

  @Get('token-uri')
  async tokenURI(@Query() tokenDTO: tokenDTO, @Response() res) {
    return this.contractService.tokenURI(tokenDTO, res);
  }

  @Post('mint-token')
  async mintToken(@Body() mintDTO: mintDTO, @Response() res) {
    return this.contractService.mintToken(mintDTO, res);
  }
  @Post('burn-token')
  async burnToken(@Body() burnDTO: burnDTO, @Response() res) {
    return this.contractService.burnToken(burnDTO, res);
  }
}
