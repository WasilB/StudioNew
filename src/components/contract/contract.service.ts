import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity';
import { Repository } from 'typeorm';
import { mintDTO } from './types';
import { init721Contract } from '../../utils/initContract';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { AddressDTO } from './types';
import { Response } from 'express';
import { burnDTO, tokenDTO } from './types';
@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractModel: Repository<Contract>,
    private readonly httpService: HttpService,
  ) {}
  async getMaxSupply(response: Response) {
    try {
      const initContract = await init721Contract(process.env.CONTRACT_ADDRESS);
      const maxSupply = await initContract.methods.getMaxSupply().call();
      console.log(maxSupply);
      return response.status(200).json({
        success: true,
        maxSupply: parseInt(maxSupply),
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBalance(addressDTO: AddressDTO, response: Response) {
    try {
      const initContract = await init721Contract(process.env.CONTRACT_ADDRESS);
      const data = await initContract.methods
        .balanceOf(addressDTO.address)
        .call();
      return response.status(200).json({
        success: true,
        balance: parseInt(data),
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async tokenURI(tokenDTO: tokenDTO, response: Response) {
    try {
      const initContract = await init721Contract(process.env.CONTRACT_ADDRESS);
      const tokenURI = await initContract.methods.tokenURI(tokenDTO.id).call();
      const tokenMetaData = await this.httpService.axiosRef.get(
        `https://${tokenURI}`,
      );

      return response.status(200).json({
        success: true,
        tokenMetaData: tokenMetaData.data,
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async mintToken(mintDTO: mintDTO, response: Response) {
    try {
      const initContract = await init721Contract(process.env.CONTRACT_ADDRESS);
      const mint = await initContract.methods.mint();
      return response.status(200).json({
        success: true,
        Data: 'MINT FUNCTION CALLED',
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async burnToken(burnDTO: burnDTO, response: Response) {
    try {
      const initContract = await init721Contract(process.env.CONTRACT_ADDRESS);

      const burn = await initContract.methods.burn(burnDTO.tokenId);
      return response.status(200).json({
        success: true,
        Data: 'Burn FUNCTION CALLED',
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
