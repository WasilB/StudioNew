import { Controller, Get, Post, Body, Query, Response } from '@nestjs/common';
import { validate } from 'class-validator';
import { ContractService } from './contract.service';
import { AddressDTO, UUIDDTO } from './types';
import { MintTokenDTO } from './types';
import { BurnTokenDTO, tokenDTO } from './types';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}
  @Get('max-supply')
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

  @Get('metadata')
  async getTokenMetadata(@Query() uuidDTO: UUIDDTO, @Response() res) {
    return this.contractService.getTokenMetadata(uuidDTO, res);
  }

  @Post('mint-token')
  async mintToken(@Body() mintDTO: MintTokenDTO, @Response() res) {
    return this.contractService.mintToken(mintDTO, res);
  }
  @Post('burn-token')
  async burnToken(@Body() burnDTO: BurnTokenDTO, @Response() res) {
    return this.contractService.burnToken(burnDTO, res);
  }
  @Post('update-metadata')
  async updateMetadata(@Body() burnDTO: BurnTokenDTO, @Response() res) {
    return this.contractService.updateMetadata(burnDTO, res);
  }
}
